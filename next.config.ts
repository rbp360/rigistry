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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
    optimizeCss: true,
    // Removed nextScriptWorkers: true because Partytown is not installed.
    // Re-add this flag and run `npm i -D @builder.io/partytown` if you want to offload third-party scripts.
  },
};

export default nextConfig;
