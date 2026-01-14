"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  resetPasswordAction,
  type PassRecoveryResetState,
  verifyPassRecoveryAction,
  type PassRecoveryVerifyState,
} from "./actions";
import {
  passRecoveryResetSchema,
  passRecoveryVerifySchema,
  type PassRecoveryResetInput,
} from "./schema";

const initialVerifyState: PassRecoveryVerifyState = { status: "idle" };
const initialResetState: PassRecoveryResetState = { status: "idle" };

export function PassRecoveryForm() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [verifyState, setVerifyState] = useState<PassRecoveryVerifyState>(initialVerifyState);
  const [resetState, setResetState] = useState<PassRecoveryResetState>(initialResetState);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, dirtyFields, touchedFields, isDirty, isValid, isSubmitting, submitCount },
    clearErrors,
  } = useForm<PassRecoveryResetInput>({
    // For step 1 we validate only email/birthDate; step 2 validates full schema.
    // The resolver type is compatible at runtime but TS cannot express the conditional.
    // @ts-expect-error Mixed schemas for multi-step recovery flow
    resolver: zodResolver(verified ? passRecoveryResetSchema : passRecoveryVerifySchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      birthDate: "",
      password: "",
      confirmPassword: "",
    },
  });

  const zodFieldErrors = (() => {
    const values = getValues();
    const schema = verified ? passRecoveryResetSchema : passRecoveryVerifySchema;
    const parsed = schema.safeParse(values);
    if (parsed.success) {
      return {} as Partial<Record<keyof PassRecoveryResetInput, string[]>>;
    }
    return parsed.error.flatten().fieldErrors as Partial<
      Record<keyof PassRecoveryResetInput, string[]>
    >;
  })();

  const combinedErrors = useMemo(
    () => ({
      email:
        (dirtyFields.email || touchedFields.email || submitCount > 0) &&
        (errors.email?.message ??
          zodFieldErrors.email?.[0] ??
          verifyState.fieldErrors?.email ??
          resetState.fieldErrors?.email),
      birthDate:
        (dirtyFields.birthDate || touchedFields.birthDate || submitCount > 0) &&
        (errors.birthDate?.message ??
          zodFieldErrors.birthDate?.[0] ??
          verifyState.fieldErrors?.birthDate ??
          resetState.fieldErrors?.birthDate),
      password:
        (dirtyFields.password || touchedFields.password || submitCount > 0) &&
        (errors.password?.message ??
          zodFieldErrors.password?.[0] ??
          resetState.fieldErrors?.password),
      confirmPassword:
        (dirtyFields.confirmPassword || touchedFields.confirmPassword || submitCount > 0) &&
        (errors.confirmPassword?.message ??
          zodFieldErrors.confirmPassword?.[0] ??
          resetState.fieldErrors?.confirmPassword),
    }),
    [
      dirtyFields.email,
      dirtyFields.birthDate,
      dirtyFields.password,
      dirtyFields.confirmPassword,
      touchedFields.email,
      touchedFields.birthDate,
      touchedFields.password,
      touchedFields.confirmPassword,
      submitCount,
      errors.email?.message,
      errors.birthDate?.message,
      errors.password?.message,
      errors.confirmPassword?.message,
      zodFieldErrors.email,
      zodFieldErrors.birthDate,
      zodFieldErrors.password,
      zodFieldErrors.confirmPassword,
      verifyState.fieldErrors?.email,
      verifyState.fieldErrors?.birthDate,
      resetState.fieldErrors?.email,
      resetState.fieldErrors?.birthDate,
      resetState.fieldErrors?.password,
      resetState.fieldErrors?.confirmPassword,
    ]
  );

  const onSubmit = (data: PassRecoveryResetInput) => {
    clearErrors();
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("birthDate", data.birthDate);

    if (!verified) {
      setPending(true);
      setVerifyState({ status: "idle" });
      startTransition(async () => {
        const res = await verifyPassRecoveryAction(initialVerifyState, formData);
        setVerifyState(res);
        if (res.status === "success") setVerified(true);
        setPending(false);
      });
      return;
    }

    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);
    setPending(true);
    setResetState({ status: "idle" });
    startTransition(async () => {
      const res = await resetPasswordAction(initialResetState, formData);
      setResetState(res);
      setPending(false);
      if (res.status === "success") router.push("/auth/login");
    });
  };

  const isPending = pending || isSubmitting;

  return (
    <div className="flex min-h-screen items-start justify-center bg-smc-bg px-6 py-10">
      <div className="w-full max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2" data-testid="recovery-two-column">
          <section className="relative overflow-hidden rounded-[var(--smc-radius-lg)] bg-gradient-to-br from-[#0E3571] via-[#0B2F64] to-[#005D70] text-white shadow-card px-8 py-10 min-h-[480px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.16),transparent_30%)]" />
            <div className="relative z-10 space-y-6">
              <Badge variant="active" className="w-fit bg-white/20 text-white">
                Recovery
              </Badge>
              <div className="space-y-3">
                <h1 className="heading-1 text-white">Reset your password.</h1>
                <p className="body-text text-white/90 max-w-xl">
                  For security, we verify your birth date before allowing a password reset.
                </p>
              </div>
              <ul className="space-y-2 text-base text-white/90">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white" />
                  Step 1: verify email + birth date
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white/80" />
                  Step 2: set a new password
                </li>
              </ul>
            </div>
          </section>

          <Card className="bg-white shadow-card border border-smc-border">
            <CardHeader className="flex flex-col gap-3 pb-1">
              <CardTitle className="heading-2">Password recovery</CardTitle>
              <CardDescription className="body-text">
                {verified
                  ? "Create a new password for your account."
                  : "Enter your work email and birth date to verify your identity."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verifyState.status === "error" && verifyState.message ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-base text-destructive">
                  {verifyState.message}
                </div>
              ) : null}
              {resetState.status === "error" && resetState.message ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-base text-destructive">
                  {resetState.message}
                </div>
              ) : null}

              {/* @ts-expect-error React Hook Form generic inference is too loose for this multi-step schema */}
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
                    disabled={verified}
                    aria-describedby={combinedErrors.email ? "recovery-email-error" : undefined}
                  />
                  {combinedErrors.email ? (
                    <p id="recovery-email-error" className="text-caption text-destructive">
                      {combinedErrors.email}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-base font-semibold text-smc-primary" htmlFor="birthDate">
                    Birth date
                  </label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register("birthDate")}
                    disabled={verified}
                    aria-describedby={combinedErrors.birthDate ? "recovery-birthdate-error" : undefined}
                  />
                  {combinedErrors.birthDate ? (
                    <p id="recovery-birthdate-error" className="text-caption text-destructive">
                      {combinedErrors.birthDate}
                    </p>
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      Used only to secure password resets.
                    </p>
                  )}
                </div>

                {verified ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-base font-semibold text-smc-primary" htmlFor="password">
                        New password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 8 chars, upper/lower/numbers"
                        {...register("password")}
                        aria-describedby={
                          combinedErrors.password ? "recovery-password-error" : undefined
                        }
                      />
                      {combinedErrors.password ? (
                        <p id="recovery-password-error" className="text-caption text-destructive">
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
                        placeholder="Repeat your password"
                        {...register("confirmPassword")}
                        aria-describedby={
                          combinedErrors.confirmPassword
                            ? "recovery-confirm-password-error"
                            : undefined
                        }
                      />
                      {combinedErrors.confirmPassword ? (
                        <p
                          id="recovery-confirm-password-error"
                          className="text-caption text-destructive"
                        >
                          {combinedErrors.confirmPassword}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={isPending || !isDirty || !isValid}
                    className="h-12 text-base"
                  >
                    {verified
                      ? isPending
                        ? "Resetting..."
                        : "Reset password"
                      : isPending
                        ? "Verifying..."
                        : "Verify"}
                  </Button>
                  <p className="text-small text-muted-foreground">
                    Back to{" "}
                    <Link href="/auth/login" className="cursor-pointer text-smc-primary underline">
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
