import { z } from "zod";

export const projectQuickSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().max(5).optional(),
});

export type ProjectQuickInput = z.infer<typeof projectQuickSchema>;
