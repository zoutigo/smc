import { z } from "zod";

export const partFamilyQuickSchema = z.object({
  name: z.string().min(2, "Name is required"),
});

export type PartFamilyQuickInput = z.infer<typeof partFamilyQuickSchema>;
