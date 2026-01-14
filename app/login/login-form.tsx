"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LoginState } from "./actions";
import { loginSchema, type LoginInput } from "./schema";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, setState] = useState<LoginState>(initialState);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: {
      errors,
      isSubmitting,
      dirtyFields,
      touchedFields,
      isDirty,
      isValid,
      submitCount,
    },
    clearErrors,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const pending = isSubmitting;

  const zodFieldErrors = (() => {
    const { email: emailValue, password: passwordValue } = getValues();
    const parsed = loginSchema.safeParse({ email: emailValue, password: passwordValue });
    return parsed.success ? {} : parsed.error.flatten().fieldErrors;
  })();

  const combinedErrors = useMemo(
    () => ({
      email:
        (dirtyFields.email || touchedFields.email || submitCount > 0) &&
        (errors.email?.message ?? zodFieldErrors.email?.[0] ?? state.fieldErrors?.email),
      password:
        (dirtyFields.password || touchedFields.password || submitCount > 0) &&
        (errors.password?.message ??
          zodFieldErrors.password?.[0] ??
          state.fieldErrors?.password),
    }),
    [
      dirtyFields.email,
      touchedFields.email,
      submitCount,
      errors.email?.message,
      zodFieldErrors.email,
      state.fieldErrors?.email,
      dirtyFields.password,
      touchedFields.password,
      errors.password?.message,
      zodFieldErrors.password,
      state.fieldErrors?.password,
    ]
  );

  const onSubmit = async (data: LoginInput) => {
    clearErrors();
    setState({ status: "idle" });
    startTransition(async () => {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl: "/",
      });
      if (res && "error" in res && res.error) {
        setState({ status: "error", message: "Invalid credentials. Please try again." });
        return;
      }
      router.push("/");
    });
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-smc-bg px-6 py-10">
      <div className="w-full max-w-6xl">
        <div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-2"
          data-testid="login-two-column"
        >
          <section className="relative overflow-hidden rounded-[var(--smc-radius-lg)] bg-gradient-to-br from-[#0E3571] via-[#0B2F64] to-[#005D70] text-white shadow-card px-8 py-10 min-h-[480px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.16),transparent_30%)]" />
            <div className="relative z-10 space-y-6">
              <Badge variant="active" className="w-fit bg-white/20 text-white">
                Access
              </Badge>
              <div className="space-y-3">
                <h1 className="heading-1 text-white">Welcome back.</h1>
                <p className="body-text text-white/90 max-w-xl">
                  Keep infrastructure under control. Centralize storage, packaging, and
                  handling means securely, with scoped permissions per factory and country.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <div className="text-base font-semibold text-white">Audit</div>
                  <p className="text-small text-white/80">Fast search & updates</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <div className="text-base font-semibold text-white">RBAC</div>
                  <p className="text-small text-white/80">Role-based controls</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <div className="text-base font-semibold text-white">Scopes</div>
                  <p className="text-small text-white/80">Factory / Country</p>
                </div>
              </div>
              <Card className="border border-white/20 bg-white/10 text-white">
                <CardContent className="grid grid-cols-4 gap-3 py-4">
                  <div>
                    <div className="text-lg font-semibold">128</div>
                    <p className="text-small text-white/80">Contributors</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">4,520</div>
                    <p className="text-small text-white/80">Packaging</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">1,180</div>
                    <p className="text-small text-white/80">Handling means</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">27</div>
                    <p className="text-small text-white/80">Plants covered</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <Card className="bg-white shadow-card border border-smc-border">
            <CardHeader className="flex flex-col gap-3 pb-1">
              <CardTitle className="heading-2">Sign in</CardTitle>
              <CardDescription className="body-text">
                Use your work email. Birth date stays private for recovery.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.status === "error" && state.message ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-base text-destructive">
                  {state.message}
                </div>
              ) : null}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <label className="text-base font-semibold text-smc-primary" htmlFor="email">
                    Work email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="firstname.lastname@opmobility.com"
                    {...register("email")}
                    aria-describedby={combinedErrors.email ? "login-email-error" : undefined}
                  />
                  {combinedErrors.email ? (
                    <p
                      id="login-email-error"
                      data-testid="login-email-error"
                      className="text-caption text-destructive"
                    >
                      {combinedErrors.email}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold text-smc-primary" htmlFor="password">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password")}
                      aria-describedby={
                        combinedErrors.password ? "login-password-error" : undefined
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-w-[80px]"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </Button>
                  </div>
                  {combinedErrors.password ? (
                    <p
                      id="login-password-error"
                      data-testid="login-password-error"
                      className="text-caption text-destructive"
                    >
                      {combinedErrors.password}
                    </p>
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      Uppercase + lowercase + numbers.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={pending || isSubmitting || !isDirty || !isValid}
                    className="h-12 text-base"
                  >
                    {pending ? "Signing in..." : "Sign in"}
                  </Button>
                  <div className="flex items-center justify-between text-small text-muted-foreground">
                    <Link
                      href="/auth/pass-recovery"
                      className="cursor-pointer text-smc-primary underline-offset-2 hover:underline"
                    >
                      Forgot password?
                    </Link>
                    <span>
                      Don&apos;t have an account?{" "}
                      <Link href="/profile" className="text-smc-primary underline">
                        Create account
                      </Link>
                    </span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
