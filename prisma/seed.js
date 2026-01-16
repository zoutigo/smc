import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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

const slugifyValue = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/[\s-]+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");

async function seedPackagingCategories() {
  const existingCount = await prisma.packagingCategory.count();
  if (existingCount > 0) {
    console.info(`Skipping packaging category seed: ${existingCount} record(s) already present.`);
    return;
  }

  await Promise.all(packagingCategoriesSeedData.map(async (category, index) => {
    const slug = slugifyValue(category.name) || `packaging-${randomUUID().slice(0, 8)}`;
    const imageId = `seed-packaging-image-${index + 1}`;
    await prisma.packagingCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug,
        image: {
          create: {
            id: imageId,
            imageUrl: category.imageUrl,
          },
        },
      },
    });
  }));
  console.info(`Seeded ${packagingCategoriesSeedData.length} packaging categories.`);
}

async function seedStorageMeanCategories() {
  const existingCount = await prisma.storageMeanCategory.count();
  if (existingCount > 0) {
    console.info(`Skipping storage mean category seed: ${existingCount} record(s) already present.`);
    return;
  }

  await Promise.all(storageMeanCategoriesSeedData.map(async (category, index) => {
    const slug = slugifyValue(category.name) || `storage-${randomUUID().slice(0, 8)}`;
    const imageId = `seed-storage-image-${index + 1}`;
    await prisma.storageMeanCategory.create({
      data: {
        name: category.name,
        description: category.description,
        slug,
        image: {
          create: {
            id: imageId,
            imageUrl: category.imageUrl,
          },
        },
      },
    });
  }));
  console.info(`Seeded ${storageMeanCategoriesSeedData.length} storage mean categories.`);
}

async function main() {
  const userMap = new Map();

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
    const ownerId = storage.ownerEmail ? userMap.get(storage.ownerEmail) : null;
    await prisma.storageMean.upsert({
      where: { name: storage.name },
      update: {
        description: storage.description,
        status: storage.status,
        ownerId,
      },
      create: {
        name: storage.name,
        description: storage.description,
        status: storage.status,
        ownerId,
      },
    });
  }

  await seedPackagingCategories();
  await seedStorageMeanCategories();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
