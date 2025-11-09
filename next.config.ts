import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  experimental: {
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
    optimizeCss: true,
    nextScriptWorkers: true,
  },
};

export default nextConfig;
