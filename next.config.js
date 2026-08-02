/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera uma pasta .next/standalone com o servidor Node embutido.
  // É o formato que a Hostinger espera para Node.js Web App.
  output: 'standalone',

  env: {
    // Carimbado no momento do build. Se este valor mudar, houve rebuild.
    BUILD_TIME: new Date().toISOString(),
  },
};

module.exports = nextConfig;
