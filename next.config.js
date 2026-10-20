/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera uma pasta .next/standalone com o servidor Node embutido.
  // É o formato que a Hostinger espera para Node.js Web App.
  output: 'standalone',

  images: {
    // Os tamanhos são gerados no WordPress (dov_hero, dov_card etc.) e servidos
    // prontos. Otimizar de novo em runtime gastaria CPU do mesmo plano que roda
    // o WordPress, para reprocessar imagem que já está no tamanho certo.
    //
    // `remotePatterns` fica declarado mesmo assim: sem ele, tirar o `unoptimized`
    // um dia quebra em produção com "hostname not configured", não em dev.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wp.descubraovinho.com.br',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },

  env: {
    // Carimbado no momento do build. Se este valor mudar, houve rebuild.
    BUILD_TIME: new Date().toISOString(),
  },

  /**
   * Cache dos estáticos da marca — logos e blobs.
   *
   * **Eles não vinham com `Cache-Control` nenhum**, e isso mordeu: a correção de
   * cor do logo subiu e continuou aparecendo o antigo. Sem o cabeçalho, o
   * navegador decide por heurística a partir do `Last-Modified` — e como os SVGs
   * estavam no repositório havia meses, a janela de frescor calculada era longa.
   * Quem já tinha visitado o site ficou com o logo velho preso no cache, sem
   * nada quebrar e sem nada avisar.
   *
   * Arquivo em `public/` mantém o caminho exato, sem hash de conteúdo — ao
   * contrário do JS e do CSS, que o Next versiona sozinho. Então a URL nunca muda
   * e o cache nunca é invalidado por si.
   *
   * `max-age=0` faz o navegador revalidar a cada carga: a resposta é um 304 de
   * algumas centenas de bytes, não o arquivo inteiro. `s-maxage=300` segura isso
   * na borda por cinco minutos — o mesmo número do ISR — para a revalidação não
   * chegar ao processo Node a cada visita, num plano dividido com outros 6 sites.
   * O `stale-while-revalidate` de um dia é a rede de segurança: se a origem cair,
   * a borda serve a cópia que tem em vez de devolver erro.
   */
  async headers() {
    return [
      {
        source: '/:pasta(logos|blobs)/:arquivo*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },

  experimental: {
    /**
     * O build não pode atropelar o WordPress.
     *
     * A geração estática roda 8 páginas em paralelo por padrão. Com 191 páginas
     * — 141 delas de verbete, cada uma disparando um `search=` no `/posts`, que
     * no WordPress é `LIKE` sobre o corpo do texto — isso derrubou a API em
     * 500 e matou o build. Antes da importação eram 22 verbetes e passava.
     *
     * O plano é dividido com o WordPress e outros 6 sites de clientes, então
     * um build que satura a API não é só problema nosso: é lentidão nos outros
     * durante o deploy.
     *
     * **Começou em 4 e caiu para 2**, porque 4 não bastou: um deploy morreu com
     * a API respondendo 500 em `posts`, `verbetes`, `pages` e `eventos` ao mesmo
     * tempo. O build do servidor clona do zero, então o cache de fetch nasce
     * vazio e a rajada inicial é a pior. O outro lado da correção é a repetição
     * com espera crescente em `lib/wp/http.ts` — nenhum dos dois resolve
     * sozinho.
     */
    staticGenerationMaxConcurrency: 2,

    /**
     * Uma segunda tentativa antes de desistir. O 500 do WordPress sob carga é
     * intermitente, e sem isto uma única página azarada derruba o deploy
     * inteiro — foi assim que o build morreu em `/almanaque/australia`.
     */
    staticGenerationRetryCount: 2,
  },
};

module.exports = nextConfig;
