"use server";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { projectQuickSchema } from "@/lib/validation/project";
import { slugifyValue } from "@/lib/utils";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const prisma = getPrisma() as PrismaClient;
  try {
    const body = await request.json();
    const parsed = projectQuickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid project" }, { status: 400 });
    }
    const slugBase = slugifyValue(parsed.data.name);
    const slug = slugBase.length ? slugBase : `project-${Date.now()}`;
    const created = await prisma.project.create({
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        slug,
      },
    });
    return NextResponse.json({ ok: true, project: { id: created.id, name: created.name } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to create project";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
