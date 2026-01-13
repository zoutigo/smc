export const runtime = "nodejs";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";

const ALLOWED_DOMAIN = "@opmobility.com";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

type RegisterBody = {
  email?: string;
  password?: string;
  birthDate?: string;
  name?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const email = body.email?.toLowerCase().trim() ?? "";
    const password = body.password ?? "";
    const birthDateInput = body.birthDate;

    if (!email || !email.endsWith(ALLOWED_DOMAIN)) {
      return NextResponse.json(
        { error: "Email must end with @opmobility.com" },
        { status: 400 }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters with uppercase, lowercase, and digits.",
        },
        { status: 400 }
      );
    }

    const birthDate = birthDateInput ? new Date(birthDateInput) : null;
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { error: "Birth date is invalid." },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Account already exists for this email." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        birthDate,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 }
    );
  }
}
