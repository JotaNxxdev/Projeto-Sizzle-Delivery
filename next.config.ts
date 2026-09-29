import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão é 1mb — fotos de perfil/loja enviadas como data URL (base64)
      // passam disso fácil. Ainda vale orientar a escolher fotos leves.
      bodySizeLimit: '4mb',
    },
  },
  async redirects() {
    return [
      // Rotas que não existem mas seriam a expectativa natural de quem
      // navega direto pela URL — a lista de pedidos do dono mora na raiz
      // do painel, e o dashboard do admin idem.
      { source: '/restaurant/orders', destination: '/restaurant', permanent: false },
      { source: '/admin/dashboard', destination: '/admin', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Impede o site de ser carregado num <iframe> de outro domínio
          // (clickjacking) e alguns comportamentos de sniffing de MIME.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
