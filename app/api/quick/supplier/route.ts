"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { supplierQuickSchema } from "@/lib/validation/supplier";

export async function POST(request: Request) {
  const prisma = getPrisma() as PrismaClient;
  try {
    const body = await request.json();
    const parsed = supplierQuickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid supplier" }, { status: 400 });
    }
    const address = await prisma.address.create({
      data: { city: parsed.data.city, countryId: parsed.data.countryId },
    });
    const created = await prisma.supplier.create({ data: { name: parsed.data.name, addressId: address.id } });
    return NextResponse.json({ ok: true, supplier: { id: created.id, name: created.name } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create supplier";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
