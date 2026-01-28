import path from "path";
import type { NextConfig } from "next";
import { MAX_IMAGE_UPLOAD_LABEL } from "./lib/constants/uploads";

// Ensure Prisma picks a compatible engine before any server code loads.
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary";
process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = process.env.PRISMA_CLI_QUERY_ENGINE_TYPE || "binary";
process.env.PRISMA_QUERY_ENGINE_TYPE = process.env.PRISMA_QUERY_ENGINE_TYPE || "binary";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // Pin TurboPack root to the repo so it doesn't mis-detect /app as workspace root
    // (fixes ENOENT build-manifest issues when running dev/build with turbopack).
    // @ts-expect-error Turbopack config not yet in Next.js type definitions
    turbopack: {
      root: path.resolve(__dirname),
    },
    serverActions: {
      bodySizeLimit: MAX_IMAGE_UPLOAD_LABEL,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
