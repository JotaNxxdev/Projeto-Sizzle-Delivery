import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Padrão é 1mb — fotos de perfil/loja enviadas como data URL (base64)
      // passam disso fácil. Ainda vale orientar a escolher fotos leves.
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
