"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { registerSchema } from "./schema";

import { getPrisma } from "@/lib/prisma";

export type RegisterState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<
    Record<
      "email" | "password" | "confirmPassword" | "birthDate" | "firstName" | "lastName",
      string
    >
  >;
};

export async function registerAction(
  _: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
  });

  if (!parsed.success) {
    const fieldErrors: RegisterState["fieldErrors"] = {};
    parsed.error.errors.forEach((err) => {
      const field = err.path[0];
      if (
        field === "email" ||
        field === "password" ||
        field === "confirmPassword" ||
        field === "birthDate" ||
        field === "firstName" ||
        field === "lastName"
      ) {
        fieldErrors[field] = err.message;
      }
    });
    return { status: "error", fieldErrors };
  }

  const { email, password, birthDate, firstName, lastName } = parsed.data;

  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      status: "error",
      message: "An account already exists for this email.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name: `${firstName} ${lastName}`.trim(),
      passwordHash,
      birthDate: new Date(birthDate),
    },
  });

  redirect("/"); // Registration successful, go back to dashboard
}
