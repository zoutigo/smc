import { randomUUID } from "node:crypto";
import type { $Enums } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugifyValue } from "../lib/utils";

const prisma = new PrismaClient();

const packagingCategoriesSeedData = [
  {
    name: "Trolley",
    description: "Multipurpose trolley designed for quick moves between inbound docks and kitting cells.",
    imageUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  },
  {
    name: "Kitting Trolley",
    description: "Ergonomic trolley optimized for staging components near assembly lines.",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    name: "Picking Trolley",
    description: "Narrow footprint trolley used for high-frequency picking runs.",
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  },
  {
    name: "Shopstock Hook",
    description: "Heavy-duty hook system that keeps frequently used parts within reach.",
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
  },
  {
    name: "Transtocker Hook",
    description: "Overhead hook compatible with automatic transtockers for fast swaps.",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
  },
  {
    name: "Tallboy",
    description: "Vertical storage tower maximizing cubic efficiency in tight aisles.",
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
  },
  {
    name: "HD Rack",
    description: "High-density racking unit supporting palletized and loose packaging.",
    imageUrl: "https://images.unsplash.com/photo-1560464024-54c5c887c1bf",
  },
  {
    name: "Plastic box",
    description: "Durable plastic totes for closed-loop shuttles between suppliers and plant.",
    imageUrl: "https://images.unsplash.com/photo-1454165205744-3b78555e5572",
  },
  {
    name: "High density Tower",
    description: "Automated tower providing dense storage for small packaging assets.",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
  },
];

const storageMeanCategoriesSeedData = [
  {
    name: "Automated Hanging Shopstock",
    description: "Robot-managed hanging aisles buffering painted subassemblies with real-time inventory tracking.",
    imageUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a",
  },
  {
    name: "Manual Hanging Shopstock",
    description: "Operator-friendly hanging rails that keep bulky trim sets within reach of assembly teams.",
    imageUrl: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
  },
  {
    name: "Automated Transtocker",
    description: "High-throughput transtockers feeding cells with sequenced components under automated control.",
    imageUrl: "https://images.unsplash.com/photo-1489515215877-9227ee91edef",
  },
  {
    name: "Manual Transtocker",
    description: "Manually dispatched transtockers supporting flexible replenishment during short runs.",
    imageUrl: "https://images.unsplash.com/photo-1452698325353-b89e0069974b",
  },
  {
    name: "High Bay Rack",
    description: "High-bay rack structure maximizing cubic density for pallets and oversized loads.",
    imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606",
  },
  {
    name: "ARSR (automated Storage and Retrieval Systems)",
    description: "Automated storage and retrieval grid orchestrating deep-lane buffering for fast movers.",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
  },
  {
    name: "CRM (conveyor on rail Motorized)",
    description: "Powered conveyor-on-rail network routing totes across mezzanines and paint shops.",
    imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
  },
];

const usersSeedData = [
  {
    email: "valery@opmobility.com",
    name: "Valery",
    password: "ChangeMe123",
    birthDate: new Date("1990-05-10"),
  },
  {
    email: "ops@opmobility.com",
    name: "Ops Team",
    password: "ChangeMe123",
    birthDate: new Date("1988-09-15"),
  },
];

const storageMeansSeedData = [
  {
    name: "Cold room A1",
    description: "Primary refrigerated storage zone",
    status: "ACTIVE",
    ownerEmail: "valery@example.com",
  },
  {
    name: "Dry warehouse B4",
    description: "Ambient storage for packaging",
    status: "ACTIVE",
    ownerEmail: "ops@example.com",
  },
  {
    name: "Overflow zone C2",
    description: "Temporary holding area",
    status: "DRAFT",
    ownerEmail: "ops@example.com",
  },
] as const;

const buildSlug = (name: string, fallbackPrefix: string) => {
  const slug = slugifyValue(name);
  return slug.length ? slug : `${fallbackPrefix}-${randomUUID().slice(0, 8)}`;
};

async function seedPackagingCategories() {
  const existingCount = await prisma.packagingCategory.count();
  if (existingCount > 0) {
    console.info(`Skipping packaging category seed: ${existingCount} record(s) already present.`);
    return;
  }

  await prisma.packagingCategory.createMany({
    data: packagingCategoriesSeedData.map((category) => ({
      ...category,
      slug: buildSlug(category.name, "packaging"),
    })),
  });
  console.info(`Seeded ${packagingCategoriesSeedData.length} packaging categories.`);
}

async function seedStorageMeanCategories() {
  const existingCount = await prisma.storageMeanCategory.count();
  if (existingCount > 0) {
    console.info(`Skipping storage mean category seed: ${existingCount} record(s) already present.`);
    return;
  }

  await prisma.storageMeanCategory.createMany({
    data: storageMeanCategoriesSeedData.map((category) => ({
      ...category,
      slug: buildSlug(category.name, "storage"),
    })),
  });
  console.info(`Seeded ${storageMeanCategoriesSeedData.length} storage mean categories.`);
}

async function seedUsersAndStorage() {
  const userMap = new Map<string, string>();

  for (const user of usersSeedData) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash, birthDate: user.birthDate },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        birthDate: user.birthDate,
      },
    });
    userMap.set(user.email, created.id);
  }

  for (const storage of storageMeansSeedData) {
    const ownerId = storage.ownerEmail ? userMap.get(storage.ownerEmail) ?? null : null;
    const status = storage.status as $Enums.StorageStatus;
    await prisma.storageMean.upsert({
      where: { name: storage.name },
      update: {
        description: storage.description,
        status,
        ownerId,
      },
      create: {
        name: storage.name,
        description: storage.description,
        status,
        ownerId,
      },
    });
  }
}

async function main() {
  await seedUsersAndStorage();
  await seedPackagingCategories();
  await seedStorageMeanCategories();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
