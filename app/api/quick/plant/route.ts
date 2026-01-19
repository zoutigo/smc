"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { plantQuickSchema } from "@/lib/validation/plant";

export async function POST(request: Request) {
  const prisma = getPrisma() as PrismaClient;
  try {
    const body = await request.json();
    const parsed = plantQuickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid plant" }, { status: 400 });
    }
    const address = await prisma.address.create({
      data: { city: parsed.data.city, countryId: parsed.data.countryId },
    });
    const created = await prisma.plant.create({ data: { name: parsed.data.name, addressId: address.id } });
    return NextResponse.json({ ok: true, plant: { id: created.id, name: created.name } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create plant";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
