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
   * Categorias, tags e autores — o **mesmo** valor do conteúdo.
   *
   * Ficou em 3600 por um tempo, com o raciocínio de que taxonomia muda pouco e
   * é consultada em toda página. O raciocínio estava errado no ponto que
   * importa: **o cache de fetch do Next é indexado pela URL e compartilhado
   * entre todas as páginas**, então 3600 economizava 11 requisições por hora, e
   * não uma por página. Em troca, renomear uma editoria levava até uma hora para
   * aparecer no menu — o mu-plugin revalida por caminho no save de post, e não
   * mexe em termo.
   *
   * Onze requisições por hora não pagam uma hora de menu errado. Um valor só,
   * comportamento previsível.
   */
  taxonomia: 300,
} as const;

/** Teto do `per_page` da REST API do WordPress. Acima disso ela responde 400. */
export const MAXIMO_POR_PAGINA = 100;
