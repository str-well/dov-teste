/**
 * As duas escritas no WordPress: assinar a newsletter e cancelar.
 *
 * Todo o resto do módulo lê. Este arquivo é o único que grava, e por isso segue
 * regras próprias:
 *
 * - **Não passa pelo `http.ts`.** Aquele arquivo põe `next: { revalidate }` em
 *   toda requisição, e cachear um POST é errado de um jeito difícil de perceber:
 *   duas pessoas assinando com o mesmo e-mail no mesmo intervalo receberiam a
 *   mesma resposta cacheada.
 * - **Namespace `dov/v1`, não `wp/v2`.** As rotas são próprias do mu-plugin,
 *   autenticadas por segredo em header, e abrem exatamente duas operações. A
 *   alternativa era senha de aplicativo na REST API padrão, que daria ao
 *   portador tudo que o usuário pode fazer no WordPress.
 * - **Sem `ErroWordPress`.** Aquele erro sobe para o `error.tsx` e vira tela de
 *   falha. Aqui quem chama é uma rota de API que precisa responder JSON com
 *   status próprio, então o resultado é um objeto discriminado.
 */

import { urlBase } from './config';

/**
 * O resultado de uma escrita.
 *
 * Discriminado em vez de exceção porque a rota de API precisa distinguir "não
 * configurado" de "e-mail inválido" de "WordPress fora do ar" — três status HTTP
 * diferentes, e um `try/catch` os achataria em 500.
 */
export type ResultadoEscrita<T> =
  | { ok: true; dados: T }
  | { ok: false; motivo: 'desconfigurado' | 'nao_encontrado' | 'falha'; detalhe: string };

export type Assinatura = {
  /** `true` quando o e-mail já estava na lista. Não é erro. */
  jaAssinava: boolean;
  /** O token que monta o link de cancelamento. */
  token: string;
};

/**
 * A base do namespace próprio.
 *
 * `WORDPRESS_API_URL` aponta para `/wp-json/wp/v2`, e as rotas de escrita vivem
 * em `/wp-json/dov/v1`. Derivar daqui evita uma segunda variável de ambiente
 * apontando para o mesmo servidor — duas variáveis para um endereço divergem no
 * dia em que o domínio do WordPress mudar.
 */
function urlDov(caminho: string): string {
  return `${urlBase().replace(/\/wp\/v2$/, '/dov/v1')}${caminho}`;
}

async function escrever<T>(
  caminho: string,
  corpo: Record<string, unknown>,
): Promise<ResultadoEscrita<T>> {
  const segredo = process.env.WP_ASSINANTES_SECRET;

  if (!segredo) {
    return {
      ok: false,
      motivo: 'desconfigurado',
      detalhe:
        'WP_ASSINANTES_SECRET não está definida. Cadastre no painel da Hostinger, ' +
        'com o mesmo valor de DOV_ASSINANTES_SECRET no wp-config.php.',
    };
  }

  let resposta: Response;

  try {
    resposta = await fetch(urlDov(caminho), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Header, nunca query string: query string entra em log de servidor e
        // de proxy, e este segredo dá permissão de escrita.
        'X-Dov-Segredo': segredo,
      },
      body: JSON.stringify(corpo),
      // Escrita não se cacheia, e o `fetch` do Next cacheia por padrão em
      // algumas rotas. Explícito para não depender do padrão da versão.
      cache: 'no-store',
    });
  } catch (erro) {
    return {
      ok: false,
      motivo: 'falha',
      detalhe: erro instanceof Error ? erro.message : 'falha de rede',
    };
  }

  if (resposta.status === 404) {
    return { ok: false, motivo: 'nao_encontrado', detalhe: 'Registro não encontrado.' };
  }

  if (!resposta.ok) {
    const corpoErro = (await resposta.json().catch(() => null)) as { message?: string } | null;

    return {
      ok: false,
      motivo: 'falha',
      detalhe: corpoErro?.message ?? `O WordPress respondeu ${resposta.status}.`,
    };
  }

  const dados = (await resposta.json().catch(() => null)) as T | null;

  if (dados === null) {
    return { ok: false, motivo: 'falha', detalhe: 'O WordPress devolveu JSON inválido.' };
  }

  return { ok: true, dados };
}

/**
 * Grava um assinante. Idempotente: o mesmo e-mail duas vezes devolve
 * `jaAssinava: true` e o token que já existia, em vez de duplicar a linha.
 */
export async function assinarNewsletter(
  email: string,
  origem: string,
): Promise<ResultadoEscrita<Assinatura>> {
  const resultado = await escrever<{ ja_assinava: boolean; token: string }>('/assinantes', {
    email,
    origem,
  });

  if (!resultado.ok) return resultado;

  return {
    ok: true,
    dados: { jaAssinava: resultado.dados.ja_assinava, token: resultado.dados.token },
  };
}

/**
 * Cancela pelo token do link.
 *
 * O mu-plugin muda o status para rascunho em vez de apagar: a LGPD pede que se
 * possa comprovar que o consentimento foi revogado, e registro apagado não
 * comprova nada. Eliminação de verdade é outro direito, e é pedida pelo contato.
 */
export async function cancelarInscricao(token: string): Promise<ResultadoEscrita<true>> {
  const resultado = await escrever<{ cancelado: boolean }>('/assinantes/cancelar', { token });

  return resultado.ok ? { ok: true, dados: true } : resultado;
}
