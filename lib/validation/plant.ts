import { z } from "zod";

export const plantQuickSchema = z.object({
  name: z.string().min(2, "Name is required"),
  city: z.string().min(2, "City is required"),
  countryId: z.string().uuid({ message: "Country is required" }),
});

export type PlantQuickInput = z.infer<typeof plantQuickSchema>;
