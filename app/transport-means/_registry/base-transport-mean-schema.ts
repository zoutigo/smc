import { z } from "zod";

export const baseTransportMeanSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  transportMeanCategoryId: z.string().uuid(),
  supplierId: z.string().uuid().optional().nullable(),
  plantId: z.string().uuid(),
  flowIds: z.array(z.string().uuid()).default([]),
  units: z.coerce.number().int().min(1).default(1),
  loadCapacityKg: z.coerce.number().int().min(0).default(0),
  cruiseSpeedKmh: z.coerce.number().int().min(0).default(0),
  maxSpeedKmh: z.coerce.number().int().min(0).default(0),
  sop: z.string().optional(),
  eop: z.string().optional(),
});
