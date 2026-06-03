import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Vercel supports full Next.js features (SSR, API Routes, etc.)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
