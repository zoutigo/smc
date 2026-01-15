import { z } from "zod";

export const plantBaseSchema = z.object({
  plantName: z.string().min(1, "Plant name is required"),
  address: z.string().optional(),
  city: z.string().min(1, "City is required"),
  zipcode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  image: z.string().url("Image must be a valid URL").optional(),
});

export const createPlantSchema = plantBaseSchema;

export const updatePlantSchema = plantBaseSchema.extend({ id: z.string().uuid() }).partial();

export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;

export default createPlantSchema;
