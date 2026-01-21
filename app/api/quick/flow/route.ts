"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { flowQuickSchema } from "@/lib/validation/flow";

export async function POST(request: Request) {
  const prisma = getPrisma() as PrismaClient;
  try {
    const body = await request.json();
    const parsed = flowQuickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid flow" }, { status: 400 });
    }
    const created = await prisma.flow.create({
      data: { from: parsed.data.from, to: parsed.data.to, slug: `${parsed.data.from.toLowerCase()}-${parsed.data.to.toLowerCase()}` },
    });
    return NextResponse.json({ ok: true, flow: { id: created.id, from: created.from, to: created.to, slug: created.slug } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create flow";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
