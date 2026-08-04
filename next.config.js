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
};

module.exports = nextConfig;
