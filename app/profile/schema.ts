import { z } from "zod";

const ALLOWED_DOMAIN = "@opmobility.com";

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Invalid email.")
      .toLowerCase()
      .trim()
      .refine((val) => val.endsWith(ALLOWED_DOMAIN), {
        message: `Email must end with ${ALLOWED_DOMAIN}.`,
      }),
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required."),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required."),
    password: z
      .string()
      .min(1, "Password is required.")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
        message: "At least 8 chars with uppercase, lowercase, and numbers.",
      }),
    confirmPassword: z
      .string()
      .min(1, "Confirm your password.")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
        message: "At least 8 chars with uppercase, lowercase, and numbers.",
      }),
    birthDate: z
      .string()
      .min(1, "Birth date is required.")
      .refine((val) => !Number.isNaN(new Date(val).getTime()), {
        message: "Birth date is invalid.",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;
