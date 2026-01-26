"use strict";

/**
 * Safe data purge for MySQL: disable FK checks, truncate user tables, re-enable FK checks.
 * Use this in CI instead of `prisma migrate reset` to keep the schema but clear data.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Order matters only if FK checks were on; we disable them for speed/safety.
// Keep `_prisma_migrations` intact so Prisma can track applied migrations.
const TABLES = [
  "NoteLink",
  "Note",
  "StorageMeanPackagingMean",
  "TransportMeanPackagingMean",
  "PackagingMeanImage",
  "StorageMeanImage",
  "TransportMeanImage",
  "PlantImage",
  "PackagingMeanCategoryImage",
  "StorageMeanCategoryImage",
  "TransportMeanCategoryImage",
  "PackagingMeanAccessory",
  "PartAccessory",
  "PackagingMeanPart",
  "Accessory",
  "TransportMeanFlow",
  "StorageMeanFlow",
  "TransportMean",
  "TransportMeanCategory",
  "StorageMean",
  "StorageMeanCategory",
  "PackagingMean",
  "PackagingMeanCategory",
  "Lane",
  "LaneGroup",
  "HighBayRackSpec",
  "StaffingLine",
  "Image",
  "Flow",
  "Supplier",
  "Plant",
  "Address",
  "Country",
  "Project",
  "PartFamily",
  "Part",
  "User",
  "Account",
  "Session",
  "VerificationToken",
];

async function truncateAll() {
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of TABLES) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\``);
  }
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
}

truncateAll()
  .then(() => {
    console.info(`Truncated ${TABLES.length} tables (FK checks off/on).`);
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error("Failed to truncate tables", err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
