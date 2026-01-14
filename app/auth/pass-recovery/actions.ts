"use server";

import bcrypt from "bcryptjs";

import { getPrisma } from "@/lib/prisma";
import { passRecoveryResetSchema, passRecoveryVerifySchema } from "./schema";

function toUtcDateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type PassRecoveryVerifyState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "birthDate", string>>;
};

export type PassRecoveryResetState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "birthDate" | "password" | "confirmPassword", string>>;
};

export async function verifyPassRecoveryAction(
  _: PassRecoveryVerifyState,
  formData: FormData
): Promise<PassRecoveryVerifyState> {
  const parsed = passRecoveryVerifySchema.safeParse({
    email: formData.get("email"),
    birthDate: formData.get("birthDate"),
  });

  if (!parsed.success) {
    const fieldErrors: PassRecoveryVerifyState["fieldErrors"] = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field === "email" || field === "birthDate") fieldErrors[field] = issue.message;
    });
    return { status: "error", fieldErrors };
  }

  const { email, birthDate } = parsed.data;
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { status: "error", message: "Unable to verify details." };
  }

  const inputKey = toUtcDateKey(new Date(birthDate));
  const storedKey = toUtcDateKey(user.birthDate);
  if (inputKey !== storedKey) {
    return { status: "error", message: "Unable to verify details." };
  }

  return { status: "success" };
}

export async function resetPasswordAction(
  _: PassRecoveryResetState,
  formData: FormData
): Promise<PassRecoveryResetState> {
  const parsed = passRecoveryResetSchema.safeParse({
    email: formData.get("email"),
    birthDate: formData.get("birthDate"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: PassRecoveryResetState["fieldErrors"] = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (
        field === "email" ||
        field === "birthDate" ||
        field === "password" ||
        field === "confirmPassword"
      ) {
        fieldErrors[field] = issue.message;
      }
    });
    return { status: "error", fieldErrors };
  }

  const { email, birthDate, password } = parsed.data;
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { status: "error", message: "Unable to reset password." };
  }

  const inputKey = toUtcDateKey(new Date(birthDate));
  const storedKey = toUtcDateKey(user.birthDate);
  if (inputKey !== storedKey) {
    return { status: "error", message: "Unable to reset password." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { status: "success" };
}

