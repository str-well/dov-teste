import { enviarEmail, escaparHtml } from '@/lib/email';
import { emailValido, limitarEnvio, receber, textoValido } from '@/lib/formulario';
import { SITE } from '@/lib/site';

/**
 * Formulário de contato.
 *
 *     POST /api/contato   { "nome": "…", "email": "…", "mensagem": "…" }
 *
 * O destino vem de `CONTATO_EMAIL_DESTINO`, por sua decisão — variável no painel
 * da Hostinger, nada de e-mail real no repositório, e trocar o endereço não
 * exige deploy.
 *
 * **Aqui não há degradação silenciosa.** A mensagem não é gravada em lugar
 * nenhum: se o envio falha, ela se perde. Então falha do Resend responde erro de
 * verdade, e o formulário diz que não deu. Fingir sucesso seria o pior defeito
 * possível nesta rota — a página de contato já trazia um comentário dizendo que
 * um formulário que engole a mensagem sem enviar é pior que não ter formulário, e
 * essa continua sendo a regra.
 */
export const dynamic = 'force-dynamic';

/** Três mensagens por IP a cada dez minutos. Conta envio, não tentativa. */
const TETO_ENVIOS = 3;

const MENSAGEM_MINIMA = 10;
const MENSAGEM_MAXIMA = 5000;

export async function POST(requisicao: Request) {
  const destino = process.env.CONTATO_EMAIL_DESTINO;

  const { corpo, ip, falha } = await receber(requisicao, 'contato');

  if (falha) {
    return falha.erro
      ? Response.json({ ok: false, erro: falha.erro }, { status: falha.status })
      : Response.json({ ok: true });
  }

  const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';
  const email = typeof corpo.email === 'string' ? corpo.email.trim() : '';
  const mensagem = typeof corpo.mensagem === 'string' ? corpo.mensagem.trim() : '';

  if (!textoValido(nome, 2, 120)) {
    return Response.json({ ok: false, erro: 'Diga como podemos chamar você.' }, { status: 400 });
  }

  if (!emailValido(email)) {
    return Response.json({ ok: false, erro: 'Confira o endereço de e-mail.' }, { status: 400 });
  }

  if (!textoValido(mensagem, MENSAGEM_MINIMA, MENSAGEM_MAXIMA)) {
    return Response.json(
      {
        ok: false,
        erro: `A mensagem precisa ter entre ${MENSAGEM_MINIMA} e ${MENSAGEM_MAXIMA} caracteres.`,
      },
      { status: 400 },
    );
  }

  // Só aqui conta contra a cota. Errar o formulário não consome mensagem: com o
  // contador único, três erros de digitação travavam a pessoa por dez minutos.
  const excedeu = limitarEnvio('contato', ip, TETO_ENVIOS);

  if (excedeu) {
    return Response.json({ ok: false, erro: excedeu.erro }, { status: excedeu.status });
  }

  // A checagem do destino vem **depois** da validação, de propósito: quem digita
  // um e-mail errado deve ouvir isso, e não um 503 que esconde o próprio erro.
  if (!destino) {
    console.error('[contato] CONTATO_EMAIL_DESTINO não está definida.');

    return Response.json(
      { ok: false, erro: 'O formulário está temporariamente fora do ar. Tente mais tarde.' },
      { status: 503 },
    );
  }

  const envio = await enviarEmail({
    para: destino,
    // O nome vai no assunto: a caixa de entrada fica legível sem abrir cada um.
    assunto: `[${SITE.nome}] Mensagem de ${nome}`,
    // `responderPara` é o que faz responder funcionar. Sem ele, "Responder" na
    // caixa de entrada escreveria para o próprio site.
    responderPara: email,
    texto: [`Nome: ${nome}`, `E-mail: ${email}`, '', mensagem].join('\n'),
    // Escapado: o corpo é texto de um desconhecido, e o alvo de HTML injetado
    // aqui é o cliente de e-mail de quem lê, não o navegador.
    html: [
      `<p><strong>Nome:</strong> ${escaparHtml(nome)}<br>`,
      `<strong>E-mail:</strong> ${escaparHtml(email)}</p>`,
      `<p style="white-space:pre-wrap">${escaparHtml(mensagem)}</p>`,
    ].join(''),
  });

  if (!envio.ok) {
    console.error('[contato] falha no envio:', envio.motivo, envio.detalhe);

    return Response.json(
      {
        ok: false,
        erro: 'Não foi possível enviar agora. Tente de novo em alguns minutos.',
      },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}
