import { getPrisma } from "./prisma";

export async function getCountries() {
  const prisma = getPrisma();
  return prisma.country.findMany({ orderBy: { name: "asc" } });
}
