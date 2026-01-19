import { z } from "zod";

export const storageMeanNameSchema = z.string().min(2, "Name is required");
export const storageMeanDescriptionSchema = z.string().min(2, "Description is required");
export const storageMeanPriceSchema = z.coerce.number().int().min(0, "Price must be positive");
export const storageMeanSopSchema = z.string().min(4, "SOP is required");

export const storageMeanBasicsSchema = z.object({
  name: storageMeanNameSchema,
  description: storageMeanDescriptionSchema,
  plantId: z.string().uuid({ message: "Plant is required" }),
  price: storageMeanPriceSchema,
  sop: storageMeanSopSchema,
  flowId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  exists: z.enum(["existing", "project"]),
});
