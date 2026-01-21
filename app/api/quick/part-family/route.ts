"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { partFamilyQuickSchema } from "@/lib/validation/part-family";

export async function POST(request: Request) {
  const prisma = getPrisma() as PrismaClient;
  try {
    const body = await request.json();
    const parsed = partFamilyQuickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid part family" }, { status: 400 });
    }
    const slug = `${parsed.data.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const created = await prisma.partFamily.create({ data: { name: parsed.data.name, slug } });
    return NextResponse.json({ ok: true, partFamily: { id: created.id, name: created.name } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create part family";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
