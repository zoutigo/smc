import { z } from "zod";

export const basePackagingMeanSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().int().min(0),
  width: z.coerce.number().int().min(0),
  length: z.coerce.number().int().min(0),
  height: z.coerce.number().int().min(0),
  numberOfPackagings: z.coerce.number().int().min(1),
  plantId: z.string().uuid(),
  flowId: z.string().uuid().optional().nullable(),
  supplierId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  accessories: z
    .array(
      z.object({
        accessoryId: z.string().uuid(),
        qty: z.coerce.number().int().min(1).optional(),
      })
    )
    .optional(),
  parts: z
    .array(
      z.object({
        name: z.string().min(2),
        projectId: z.string().uuid().optional().nullable(),
        partFamilyId: z.string().uuid(),
        partsPerPackaging: z.coerce.number().int().min(1).optional(),
        levelsPerPackaging: z.coerce.number().int().min(1).optional(),
        verticalPitch: z.coerce.number().int().min(0).optional(),
        horizontalPitch: z.coerce.number().int().min(0).optional(),
        accessories: z
          .array(
            z.object({
              accessoryId: z.string().uuid(),
              qtyPerPart: z.coerce.number().int().min(1).optional(),
            })
          )
          .optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

