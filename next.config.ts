import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  // Let Vercel handle output file tracing root; overriding can break path resolution in CI
  outputFileTracingRoot: path.join(__dirname, '..'),
  async redirects() {
    return [
      {
        source: '/messageboard',
        destination: '/connect',
        permanent: true,
      },
    ];
  },
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
      // Allow Reverb listing images (large/full photo CDN)
      {
        protocol: 'https',
        hostname: 'images.reverb.com',
      },
      // Some Reverb images are served via Cloudinary on this host
      {
        protocol: 'https',
        hostname: 'reverb-res.cloudinary.com',
      },
      // Reverb image CDN alias observed in production URLs
      {
        protocol: 'https',
        hostname: 'rvb-img.reverb.com',
      },
      // Allow logo.dev fallback logos
      {
        protocol: 'https',
        hostname: 'logo.dev',
      },
      // Allow img.logo.dev (API render host used by buildLogoDevImageUrl)
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
      },
    ],
    // Allow all local image paths (covers /branding/** and /api/* query images)
    // If you want to tighten later, restrict to specific subpaths.
    localPatterns: [
      { pathname: '/**' },
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
