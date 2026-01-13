import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { storageMeans, users } from "./service-seed-data.js";

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
