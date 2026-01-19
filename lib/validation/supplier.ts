import { z } from "zod";

export const supplierQuickSchema = z.object({
  name: z.string().min(2, "Name is required"),
  city: z.string().min(2, "City is required"),
  countryId: z.string().uuid({ message: "Country is required" }),
});

export type SupplierQuickInput = z.infer<typeof supplierQuickSchema>;
