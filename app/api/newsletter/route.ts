import { enviarEmail } from '@/lib/email';
import { emailValido, limitarEnvio, receber } from '@/lib/formulario';
import { SITE } from '@/lib/site';
import { assinarNewsletter } from '@/lib/wp';

/**
 * Assinatura da newsletter.
 *
 *     POST /api/newsletter   { "email": "…", "origem": "rodape" }
 *
 * O endereço vai para o CPT `assinante` do WordPress, por decisão sua — assim a
 * lista fica no painel que o cliente já usa, sem serviço novo. A gravação passa
 * por `assinarNewsletter()` em `lib/wp/`, que fala com o namespace `dov/v1` do
 * mu-plugin e exige `WP_ASSINANTES_SECRET`.
 *
 * **É opt-in simples, não duplo.** Quem manda o formulário está inscrito na
 * hora, e recebe um e-mail de boas-vindas com o link de cancelamento. O custo
 * disso é real e vale registrar: **nada impede alguém de inscrever o e-mail de
 * outra pessoa.** Opt-in duplo — inscrever só depois de a pessoa clicar num link
 * de confirmação — resolveria, e exigiria um estado `confirmado` no CPT, uma rota
 * de confirmação e uma página de destino. É o caminho de melhoria mais claro
 * daqui, e está anotado no plano.
 */
export const dynamic = 'force-dynamic';

/** Cinco assinaturas por IP a cada dez minutos. Ninguém assina duas vezes. */
const TETO_ENVIOS = 5;

export async function POST(requisicao: Request) {
  const { corpo, ip, falha } = await receber(requisicao, 'newsletter');

  if (falha) {
    // A armadilha devolve 200 com erro vazio: para o robô parece sucesso.
    return falha.erro
      ? Response.json({ ok: false, erro: falha.erro }, { status: falha.status })
      : Response.json({ ok: true });
  }

  const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : '';

  if (!emailValido(email)) {
    return Response.json({ ok: false, erro: 'Confira o endereço de e-mail.' }, { status: 400 });
  }

  // Só agora conta contra a cota: quem digitou o endereço errado acima não
  // gastou envio nenhum, e não deve ficar de castigo por isso.
  const excedeu = limitarEnvio('newsletter', ip, TETO_ENVIOS);

  if (excedeu) {
    return Response.json({ ok: false, erro: excedeu.erro }, { status: excedeu.status });
  }

  const origem = typeof corpo.origem === 'string' ? corpo.origem.slice(0, 40) : 'site';
  const gravado = await assinarNewsletter(email, origem);

  if (!gravado.ok) {
    // 503 e não 500: é o WordPress ou a configuração, não defeito da rota. O
    // `detalhe` vai para o log do servidor e **não** para a resposta — ele
    // nomeia variáveis de ambiente, e isso não é assunto de quem visita.
    console.error('[newsletter] falha ao gravar:', gravado.motivo, gravado.detalhe);

    return Response.json(
      { ok: false, erro: 'Não foi possível assinar agora. Tente de novo em alguns minutos.' },
      { status: 503 },
    );
  }

  // Boas-vindas só para quem é novo. Reenviar para quem já assinava seria
  // confuso — e é o que aconteceria a cada vez que alguém preenchesse de novo.
  if (!gravado.dados.jaAssinava) {
    const envio = await enviarEmail(boasVindas(email, gravado.dados.token));

    if (!envio.ok) {
      // A assinatura **fica gravada** mesmo assim. Desfazer seria pior: a pessoa
      // veria erro, tentaria de novo e cairia no `jaAssinava`, sem nunca receber
      // o e-mail. O link de cancelamento vai em toda edição da newsletter, então
      // a revogação continua possível sem este primeiro e-mail.
      console.error('[newsletter] gravou mas não enviou boas-vindas:', envio.motivo, envio.detalhe);
    }
  }

  return Response.json({ ok: true, jaAssinava: gravado.dados.jaAssinava });
}

function boasVindas(email: string, token: string) {
  const cancelar = `${SITE.url}/cancelar-inscricao?token=${encodeURIComponent(token)}`;

  return {
    para: email,
    assunto: `Você assinou a newsletter do ${SITE.nome}`,
    texto: [
      `Pronto: você vai receber a newsletter do ${SITE.nome}.`,
      '',
      'Uma carta por semana, com o que vale ler e beber.',
      '',
      `Para cancelar quando quiser: ${cancelar}`,
      '',
      SITE.avisoLegal,
    ].join('\n'),
    // HTML mínimo de propósito: cliente de e-mail não é navegador, e layout
    // elaborado quebra em algum deles. O e-mail editorial é outro trabalho.
    html: [
      `<p>Pronto: você vai receber a newsletter do <strong>${SITE.nome}</strong>.</p>`,
      '<p>Uma carta por semana, com o que vale ler e beber.</p>',
      `<p><a href="${cancelar}">Cancelar a inscrição</a></p>`,
      `<p style="font-size:12px;color:#6A6975">${SITE.avisoLegal}</p>`,
    ].join(''),
  };
}
