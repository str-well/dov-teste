import type { MetadataRoute } from 'next';

import { PERMITIR_INDEXACAO, SITE } from '@/lib/site';

/**
 * `robots.txt` — gerado, não arquivo em `public/`.
 *
 * Assim ele nasce do mesmo `PERMITIR_INDEXACAO` que decide o `noindex` do
 * layout: **um interruptor de lançamento, não dois.** Um `robots.txt` estático
 * em `public/` divergiria do `metadata` do layout no primeiro esquecimento, e o
 * sintoma seria silencioso.
 *
 * Antes do lançamento é `Disallow: /`. O `noindex` do layout já impediria a
 * indexação sozinho, mas ele só age depois de a página ser baixada — e o plano é
 * compartilhado com o WordPress e outros 6 sites. Barrar no `robots.txt` evita o
 * rastreamento inteiro, que é o custo que importa aqui.
 */
export default function robots(): MetadataRoute.Robots {
  if (!PERMITIR_INDEXACAO) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      // O sitemap fica anunciado mesmo assim: quem for conferir a saída à mão
      // acha o caminho, e buscador nenhum vai lê-lo com `Disallow: /` no ar.
      sitemap: `${SITE.url}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Cada termo digitado geraria uma URL rasa e duplicada. A rota também
        // manda `noindex` no próprio `metadata`; isto poupa o rastreamento.
        '/busca',
        '/api/',
        // Ferramentas internas. Saem antes do lançamento, mas enquanto existirem
        // não devem ser rastreadas.
        '/componentes',
        '/diagnostico',
      ],
      // O Google ignora `Crawl-delay`, o Bing e o Yandex respeitam. Não é
      // firula: o processo Node divide CPU com o WordPress e outros 6 sites do
      // mesmo plano, e uma varredura em rajada aparece como lentidão em todos.
      crawlDelay: 2,
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
