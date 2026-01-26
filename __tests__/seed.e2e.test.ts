/**
 * @jest-environment node
 */

import { execSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load test environment if present
loadEnv({ path: ".env.test" });

const prisma = new PrismaClient();
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const shouldRunSeedTests = process.env.RUN_DB_SEED_TESTS === "true" && hasDatabaseUrl;

jest.setTimeout(120_000);

const describeDb = shouldRunSeedTests ? describe : describe.skip;

describeDb("database seed", () => {
  beforeAll(() => {
    // Run seed to ensure a fresh, consistent dataset for assertions
    execSync("npx prisma db seed", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("core reference data are present", async () => {
    const [
      countries,
      plants,
      suppliers,
      flows,
      projects,
      partFamilies,
      accessories,
      packagingCategories,
      storageCategories,
      transportCategories,
    ] = await Promise.all([
      prisma.country.count(),
      prisma.plant.count(),
      prisma.supplier.count(),
      prisma.flow.count(),
      prisma.project.count(),
      prisma.partFamily.count(),
      prisma.accessory.count(),
      prisma.packagingMeanCategory.count(),
      prisma.storageMeanCategory.count(),
      prisma.transportMeanCategory.count(),
    ]);

    expect(countries).toBeGreaterThanOrEqual(200);
    expect(plants).toBeGreaterThanOrEqual(15);
    expect(suppliers).toBeGreaterThanOrEqual(20);
    expect(flows).toBeGreaterThanOrEqual(3);
    expect(projects).toBeGreaterThanOrEqual(20);
    expect(partFamilies).toBeGreaterThanOrEqual(10);
    expect(accessories).toBeGreaterThanOrEqual(10);
    expect(packagingCategories).toBe(9);
    expect(storageCategories).toBe(7);
    expect(transportCategories).toBe(3);
  });

  test("assets are seeded with heterogeneity and links", async () => {
    const [packagingMeans, storageMeans, transportMeans, packagingImages, partLinks] = await Promise.all([
      prisma.packagingMean.count(),
      prisma.storageMean.count(),
      prisma.transportMean.count(),
      prisma.packagingMeanImage.count(),
      prisma.packagingMeanPart.count(),
    ]);

    expect(packagingMeans).toBeGreaterThanOrEqual(300);
    expect(storageMeans).toBeGreaterThanOrEqual(20);
    expect(transportMeans).toBeGreaterThanOrEqual(20);
    expect(packagingImages).toBeGreaterThanOrEqual(packagingMeans); // each packaging gets multiple images
    expect(partLinks).toBeGreaterThanOrEqual(packagingMeans); // each packaging links to parts
  });

  test("composite uniqueness is preserved (no duplicate rows)", async () => {
    const duplicatePackaging = await prisma.$queryRaw<
      Array<{ plantId: string; name: string; packagingMeanCategoryId: string; c: bigint }>
    >`SELECT plantId, name, packagingMeanCategoryId, COUNT(*) AS c FROM PackagingMean GROUP BY plantId, name, packagingMeanCategoryId HAVING c > 1`;

    const duplicateParts = await prisma.$queryRaw<Array<{ projectId: string | null; slug: string; c: bigint }>>`
      SELECT projectId, slug, COUNT(*) AS c FROM Part GROUP BY projectId, slug HAVING c > 1
    `;

    const duplicateLinks = await prisma.$queryRaw<
      Array<{ packagingMeanId: string; partId: string; c: bigint }>
    >`SELECT packagingMeanId, partId, COUNT(*) AS c FROM PackagingMeanPart GROUP BY packagingMeanId, partId HAVING c > 1`;

    expect(duplicatePackaging.length).toBe(0);
    expect(duplicateParts.length).toBe(0);
    expect(duplicateLinks.length).toBe(0);
  });
});
