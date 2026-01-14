import { z } from "zod";

const ALLOWED_DOMAIN = "@opmobility.com";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Invalid email.")
    .toLowerCase()
    .trim()
    .refine((val) => val.endsWith(ALLOWED_DOMAIN), {
      message: `Email must end with ${ALLOWED_DOMAIN}.`,
      path: ["email"],
    }),
  password: z.string().min(1, "Password is required.").min(1, "Password required."),
});

export type LoginInput = z.infer<typeof loginSchema>;
