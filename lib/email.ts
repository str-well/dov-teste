/**
 * Envio de e-mail pelo Resend, por `fetch` — sem o SDK.
 *
 * O SDK oficial embrulha um POST em JSON e traz uma dependência que precisaria
 * subir de versão para sempre. O projeto já resolve HTTP com `fetch` em
 * `lib/wp/http.ts`, e o mesmo gosto vale aqui. Também mantém a saída de
 * emergência limpa: nada de dependência que amarre o host.
 *
 * **Nunca lança.** Quem chama são rotas de API que precisam distinguir "não
 * configurado" de "o Resend recusou" — três status HTTP diferentes, e uma
 * exceção os achataria em 500.
 */

const ENDPOINT = 'https://api.resend.com/emails';

export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; motivo: 'desconfigurado' | 'falha'; detalhe: string };

export type Mensagem = {
  para: string;
  assunto: string;
  /** Corpo em HTML. */
  html: string;
  /** Corpo em texto puro. Sempre enviar: filtro de spam pune HTML sozinho. */
  texto: string;
  /**
   * Onde a resposta deve cair, quando é diferente do remetente.
   *
   * É o que faz o formulário de contato funcionar de verdade: o e-mail sai do
   * domínio do site, mas responder na caixa de entrada precisa escrever para
   * quem mandou a mensagem, não para o próprio site.
   */
  responderPara?: string;
};

/**
 * O remetente.
 *
 * Tem de ser um domínio verificado no Resend, senão a API recusa. Fica em
 * variável porque o subdomínio escolhido é decisão de quem configura o DNS, e
 * chumbar `contato@descubraovinho.com.br` aqui daria erro silencioso se a
 * verificação tiver sido feita em outro endereço.
 */
function remetente(): string | null {
  return process.env.EMAIL_REMETENTE ?? null;
}

export async function enviarEmail(mensagem: Mensagem): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  const de = remetente();

  if (!chave || !de) {
    return {
      ok: false,
      motivo: 'desconfigurado',
      detalhe: [
        !chave && 'RESEND_API_KEY',
        !de && 'EMAIL_REMETENTE',
      ]
        .filter(Boolean)
        .join(' e ') + ' não está definida no painel da Hostinger.',
    };
  }

  let resposta: Response;

  try {
    resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: de,
        to: [mensagem.para],
        subject: mensagem.assunto,
        html: mensagem.html,
        text: mensagem.texto,
        ...(mensagem.responderPara ? { reply_to: mensagem.responderPara } : {}),
      }),
      cache: 'no-store',
    });
  } catch (erro) {
    return {
      ok: false,
      motivo: 'falha',
      detalhe: erro instanceof Error ? erro.message : 'falha de rede',
    };
  }

  const corpo = (await resposta.json().catch(() => null)) as
    | { id?: string; message?: string }
    | null;

  if (!resposta.ok) {
    return {
      ok: false,
      motivo: 'falha',
      detalhe: corpo?.message ?? `O Resend respondeu ${resposta.status}.`,
    };
  }

  return { ok: true, id: corpo?.id ?? '' };
}

/**
 * Escapa texto que o leitor digitou antes de pôr em HTML de e-mail.
 *
 * O corpo do e-mail de contato é montado com a mensagem de um desconhecido. Sem
 * isto, `<script>` ou `<img onerror>` viaja até a caixa de entrada de quem lê —
 * e cliente de e-mail que renderiza HTML é o alvo, não o navegador.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
