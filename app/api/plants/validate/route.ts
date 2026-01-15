import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city") ?? undefined;
  const country = url.searchParams.get("country") ?? undefined;
  const excludeId = url.searchParams.get("excludeId") ?? undefined;

  if (!city || !country) return NextResponse.json({ exists: false });

  const prisma = getPrisma();
  const where: Record<string, unknown> = { city, country };
  if (excludeId) where.NOT = { id: excludeId };
  const found = await prisma.plant.findFirst({ where });
  return NextResponse.json({ exists: !!found });
}
