"use client";

import { startTransition, useActionState, useMemo } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { registerAction, type RegisterState } from "./actions";
import { registerSchema, type RegisterInput } from "./schema";

const initialState: RegisterState = { status: "idle" };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const {
    register,
    handleSubmit,
    getValues,
    formState: {
      errors,
      dirtyFields,
      touchedFields,
      isDirty,
      isValid,
      isSubmitting,
      submitCount,
    },
    clearErrors,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      birthDate: "",
    },
  });

  const zodFieldErrors = (() => {
    const {
      email: emailValue,
      firstName: firstNameValue,
      lastName: lastNameValue,
      password: passwordValue,
      confirmPassword: confirmPasswordValue,
      birthDate: birthDateValue,
    } = getValues();

    const parsed = registerSchema.safeParse({
      email: emailValue,
      firstName: firstNameValue,
      lastName: lastNameValue,
      password: passwordValue,
      confirmPassword: confirmPasswordValue,
      birthDate: birthDateValue,
    });
    return parsed.success ? {} : parsed.error.flatten().fieldErrors;
  })();

  const combinedErrors = useMemo(
    () => ({
      email:
        (dirtyFields.email || touchedFields.email || submitCount > 0) &&
        (errors.email?.message ?? zodFieldErrors.email?.[0] ?? state.fieldErrors?.email),
      firstName:
        (dirtyFields.firstName || touchedFields.firstName || submitCount > 0) &&
        (errors.firstName?.message ?? zodFieldErrors.firstName?.[0] ?? state.fieldErrors?.firstName),
      lastName:
        (dirtyFields.lastName || touchedFields.lastName || submitCount > 0) &&
        (errors.lastName?.message ?? zodFieldErrors.lastName?.[0] ?? state.fieldErrors?.lastName),
      password:
        (dirtyFields.password || touchedFields.password || submitCount > 0) &&
        (errors.password?.message ?? zodFieldErrors.password?.[0] ?? state.fieldErrors?.password),
      confirmPassword:
        (dirtyFields.confirmPassword || touchedFields.confirmPassword || submitCount > 0) &&
        (errors.confirmPassword?.message ??
          zodFieldErrors.confirmPassword?.[0] ??
          state.fieldErrors?.confirmPassword),
      birthDate:
        (dirtyFields.birthDate || touchedFields.birthDate || submitCount > 0) &&
        (errors.birthDate?.message ?? zodFieldErrors.birthDate?.[0] ?? state.fieldErrors?.birthDate),
    }),
    [
      dirtyFields.email,
      touchedFields.email,
      submitCount,
      errors.email?.message,
      zodFieldErrors.email,
      state.fieldErrors?.email,
      dirtyFields.firstName,
      touchedFields.firstName,
      errors.firstName?.message,
      zodFieldErrors.firstName,
      state.fieldErrors?.firstName,
      dirtyFields.lastName,
      touchedFields.lastName,
      errors.lastName?.message,
      zodFieldErrors.lastName,
      state.fieldErrors?.lastName,
      dirtyFields.password,
      touchedFields.password,
      errors.password?.message,
      zodFieldErrors.password,
      state.fieldErrors?.password,
      dirtyFields.confirmPassword,
      touchedFields.confirmPassword,
      errors.confirmPassword?.message,
      zodFieldErrors.confirmPassword,
      state.fieldErrors?.confirmPassword,
      dirtyFields.birthDate,
      touchedFields.birthDate,
      errors.birthDate?.message,
      zodFieldErrors.birthDate,
      state.fieldErrors?.birthDate,
    ]
  );

  const onSubmit = (data: RegisterInput) => {
    clearErrors();
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-smc-bg px-6 py-6">
      <div className="w-full max-w-6xl mt-6">
        <div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.1fr,1fr]"
          data-testid="register-two-column"
        >
          <section className="relative overflow-hidden rounded-[var(--smc-radius-lg)] bg-gradient-to-br from-[#0E3571] via-[#0B2F64] to-[#005D70] text-white shadow-card px-8 py-10 min-h-[520px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.16),transparent_30%)]" />
            <div className="relative z-10 space-y-6">
              <Badge variant="active" className="w-fit bg-white/20 text-white">
                Access
              </Badge>
              <div className="space-y-2">
                <h1 className="heading-1 text-white">
                  Create your access.
                  <br />
                  Manage infrastructure with precision.
                </h1>
                <p className="body-text text-white/90">
                  Control who can read or modify storage and packaging means. Permissions
                  can be scoped by factory and country for secure collaboration.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <div className="text-base font-semibold text-white">RBAC</div>
                  <p className="text-small text-white/80">Roles & grades</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <div className="text-base font-semibold text-white">Scopes</div>
                  <p className="text-small text-white/80">Factory / Country</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                  <div className="text-base font-semibold text-white">Audit</div>
                  <p className="text-small text-white/80">Traceable changes</p>
                </div>
              </div>
              <ul className="space-y-2 text-base text-white/90">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                  Engineers can edit only assigned factories.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white/80" />
                  Specialists can edit only assigned countries.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white/70" />
                  Experts can manage all entities.
                </li>
              </ul>
            </div>
          </section>

          <Card className="bg-white shadow-card border border-smc-border">
            <CardHeader className="flex flex-col gap-2 pb-2">
              <CardTitle className="heading-2">Create account</CardTitle>
              <CardDescription className="body-text">
                Use your work email. Birth date is used only for password recovery.
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
                    aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
                  />
                  {combinedErrors.email ? (
                    <p id="email-error" className="text-caption text-destructive">
                      {combinedErrors.email}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      className="text-base font-semibold text-smc-primary"
                      htmlFor="firstName"
                    >
                      First name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Valery"
                      {...register("firstName")}
                      aria-describedby={
                        combinedErrors.firstName ? "firstName-error" : undefined
                      }
                    />
                    {combinedErrors.firstName ? (
                      <p id="firstName-error" className="text-caption text-destructive">
                        {combinedErrors.firstName}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-base font-semibold text-smc-primary"
                      htmlFor="lastName"
                    >
                      Last name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Dupont"
                      {...register("lastName")}
                      aria-describedby={
                        combinedErrors.lastName ? "lastName-error" : undefined
                      }
                    />
                    {combinedErrors.lastName ? (
                      <p id="lastName-error" className="text-caption text-destructive">
                        {combinedErrors.lastName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      className="text-base font-semibold text-smc-primary"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="At least 8 chars, upper/lower/numbers"
                      aria-describedby={
                        combinedErrors.password ? "password-error" : undefined
                      }
                    />
                    {combinedErrors.password ? (
                      <p id="password-error" className="text-caption text-destructive">
                        {combinedErrors.password}
                      </p>
                    ) : (
                      <p className="text-caption text-muted-foreground">
                        8+ characters with uppercase, lowercase, and numbers.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      className="text-base font-semibold text-smc-primary"
                      htmlFor="confirmPassword"
                    >
                      Confirm password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      placeholder="Repeat your password"
                      aria-describedby={
                        combinedErrors.confirmPassword ? "confirm-error" : undefined
                      }
                    />
                    {combinedErrors.confirmPassword ? (
                      <p id="confirm-error" className="text-caption text-destructive">
                        {combinedErrors.confirmPassword}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold text-smc-primary" htmlFor="birthDate">
                    Birth date (recovery)
                  </label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register("birthDate")}
                    aria-describedby={
                      combinedErrors.birthDate ? "birthdate-error" : undefined
                    }
                  />
                  {combinedErrors.birthDate ? (
                    <p id="birthdate-error" className="text-caption text-destructive">
                      {combinedErrors.birthDate}
                    </p>
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      Used only to secure password resets.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={pending || isSubmitting || !isDirty || !isValid}
                    className="h-12 text-base"
                  >
                    {pending ? "Creating account..." : "Create account"}
                  </Button>
                  <p className="text-small text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/" className="text-smc-primary underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
