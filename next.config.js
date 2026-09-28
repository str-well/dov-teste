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
     * durante o deploy. Quatro por vez alonga o build e é o preço certo.
     */
    staticGenerationMaxConcurrency: 4,

    /**
     * Uma segunda tentativa antes de desistir. O 500 do WordPress sob carga é
     * intermitente, e sem isto uma única página azarada derruba o deploy
     * inteiro — foi assim que o build morreu em `/almanaque/australia`.
     */
    staticGenerationRetryCount: 2,
  },
};

module.exports = nextConfig;
