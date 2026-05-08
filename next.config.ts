import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/glitch',
  assetPrefix: '/glitch',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
