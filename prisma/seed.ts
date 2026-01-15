import { randomUUID } from "node:crypto";
import type { $Enums } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugifyValue } from "../lib/utils";
import { storageMeans, users } from "./service-seed-data.js";

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

const buildSlug = (name: string) => {
  const slug = slugifyValue(name);
  return slug.length ? slug : `packaging-${randomUUID().slice(0, 8)}`;
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
      slug: buildSlug(category.name),
    })),
  });
  console.info(`Seeded ${packagingCategoriesSeedData.length} packaging categories.`);
}

async function seedUsersAndStorage() {
  const userMap = new Map<string, string>();

  for (const user of users) {
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

  for (const storage of storageMeans) {
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
