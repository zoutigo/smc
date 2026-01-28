import { PrismaClient } from "@prisma/client";

// Provide a lazy initializer so PrismaClient is created only when first needed.
// This avoids issues where bundlers or Next's runtime evaluate modules
// before runtime env vars or adapters are available.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  // Ensure engine env vars are set before instantiating the client.
  process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || "binary";
  process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = process.env.PRISMA_CLI_QUERY_ENGINE_TYPE || "binary";
  process.env.PRISMA_QUERY_ENGINE_TYPE = process.env.PRISMA_QUERY_ENGINE_TYPE || "binary";

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Cache client in all environments to avoid opening a new connection per request
  // (production was previously instantiating a fresh client and exhausting MySQL).
  globalForPrisma.prisma = client;

  return client;
}
