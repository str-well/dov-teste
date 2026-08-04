/**
 * Configuração da camada de dados.
 *
 * A URL base não é lida no topo do módulo de propósito: se faltar no ambiente,
 * o erro precisa acontecer na chamada — não no import — para não derrubar o
 * `next build` inteiro por causa de uma variável ausente.
 */

export function urlBase(): string {
  const base = process.env.WORDPRESS_API_URL;

  if (!base) {
    throw new Error(
      'WORDPRESS_API_URL não está definida. Em desenvolvimento, copie .env.example ' +
        'para .env.local; em produção, cadastre no painel da Hostinger.',
    );
  }

  return base.replace(/\/+$/, '');
}

/**
 * Segundos de cache do ISR.
 *
 * O cache real é a revalidação por caminho que o mu-plugin dispara no
 * `transition_post_status`. Estes números são a rede de segurança para o caso
 * de o webhook falhar silenciosamente — que é o modo de falha esperado.
 */
export const REVALIDAR = {
  /** Listagens e itens de conteúdo. Valor definido em docs/BACKEND.md. */
  conteudo: 300,

  /**
   * Categorias, tags e autores. Mudam raramente e são consultados em quase
   * toda página; um intervalo curto aqui só gera consulta a mais num plano
   * compartilhado com outros 6 sites.
   */
  taxonomia: 3600,
} as const;

/** Teto do `per_page` da REST API do WordPress. Acima disso ela responde 400. */
export const MAXIMO_POR_PAGINA = 100;
