import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/glitch',
  assetPrefix: '/glitch',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.219.102', 'localhost:3000'],
};

export default nextConfig;
