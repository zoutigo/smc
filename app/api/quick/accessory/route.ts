"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { accessoryQuickSchema } from "@/lib/validation/accessory";
import { slugifyValue } from "@/lib/utils";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const prisma = getPrisma() as PrismaClient;
  try {
    const body = await request.json();
    const parsed = accessoryQuickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid accessory" }, { status: 400 });
    }

    const slugBase = slugifyValue(parsed.data.name);
    const slug = slugBase.length ? slugBase : `accessory-${Date.now()}`;
    const created = await prisma.accessory.create({
      data: {
        name: parsed.data.name,
        slug,
        plantId: parsed.data.plantId,
        supplierId: parsed.data.supplierId ?? null,
        unitPrice: parsed.data.unitPrice ?? 0,
      },
    });
    return NextResponse.json({ ok: true, accessory: { id: created.id, name: created.name } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create accessory";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
