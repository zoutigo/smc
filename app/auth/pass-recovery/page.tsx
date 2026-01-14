import type { Metadata } from "next";

import { PassRecoveryForm } from "./pass-recovery-form";

export const metadata: Metadata = {
  title: "Password recovery",
  description: "Verify your birth date and reset your password.",
};

export default function PassRecoveryPage() {
  return <PassRecoveryForm />;
}

