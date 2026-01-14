"use server";

import { redirect } from "next/navigation";

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
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        fieldErrors[field] = issue.message;
      }
    });
    return { status: "error", fieldErrors };
  }

  const { email, password } = parsed.data;

  try {
    const credentialsSignIn =
      signIn as
        | ((
            provider: "credentials",
            options: { email: string; password: string; redirectTo?: string }
          ) => Promise<unknown>)
        | undefined;

    if (!credentialsSignIn) {
      return { status: "error", message: "Unable to sign in right now." };
    }

    await credentialsSignIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    redirect("/");
  } catch (error: unknown) {
    const e = error as { name?: string; code?: string } | null;
    if (e && (e.name === "AuthError" || e.name === "Error" || e.code === "CredentialsSignin")) {
      return { status: "error", message: "Invalid credentials. Please try again." };
    }
    return { status: "error", message: "Unable to sign in right now." };
  }
}
