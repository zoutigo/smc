#!/usr/bin/env node

/**
 * Lightweight seed runner for environments without TypeScript/tsx preinstalled.
 * It will invoke `npx -y tsx prisma/seed.ts`, so npx downloads tsx on the fly if absent.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawnSync } = require("node:child_process");

const result = spawnSync("npx", ["-y", "tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("Failed to run seed via tsx:", result.error);
  process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
