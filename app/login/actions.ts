"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import { loginSchema } from "./schema";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: LoginState["fieldErrors"] = {};
    parsed.error.errors.forEach((err) => {
      const field = err.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] = err.message;
      }
    });
    return { status: "error", fieldErrors };
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    redirect("/");
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: "Invalid credentials. Please try again." };
    }
    return { status: "error", message: "Unable to sign in right now." };
  }
}
