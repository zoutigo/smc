import type { NextConfig } from "next";
import { MAX_IMAGE_UPLOAD_LABEL } from "./lib/constants/uploads";

// Ensure Prisma picks a compatible engine before any server code loads.
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary";
process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = process.env.PRISMA_CLI_QUERY_ENGINE_TYPE || "binary";
process.env.PRISMA_QUERY_ENGINE_TYPE = process.env.PRISMA_QUERY_ENGINE_TYPE || "binary";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: MAX_IMAGE_UPLOAD_LABEL,
    },
  },
};

export default nextConfig;
