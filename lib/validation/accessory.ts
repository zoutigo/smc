import { z } from "zod";

export const accessoryQuickSchema = z.object({
  name: z.string().min(2, "Name is required"),
  plantId: z.string().uuid("Plant is required"),
  supplierId: z.string().uuid().optional().nullable(),
  unitPrice: z.number().int().min(0).optional(),
});

export type AccessoryQuickInput = z.infer<typeof accessoryQuickSchema>;
