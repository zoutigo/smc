import { z } from "zod";

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().uuid("Address ID must be a valid UUID").optional(),
);

export const plantBaseSchema = z.object({
  name: z.string().min(1, "Plant name is required"),
  addressId: optionalUuid,
  imageUrl: z.string().url("Image must be a valid URL").optional(),
});

export const createPlantSchema = plantBaseSchema;

export const updatePlantSchema = plantBaseSchema.extend({ id: z.string().uuid() }).partial();

export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;

export default createPlantSchema;
