import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? undefined;
  const excludeId = url.searchParams.get("excludeId") ?? undefined;

  if (!name) return NextResponse.json({ exists: false });

  const prisma = getPrisma();
  const where: Record<string, unknown> = { name };
  if (excludeId) where.NOT = { id: excludeId };
  const found = await prisma.packagingCategory.findFirst({ where });
  return NextResponse.json({ exists: !!found });
}
