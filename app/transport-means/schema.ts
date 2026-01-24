import { z } from "zod";

export const transportMeanCategoryBaseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
  imageUrl: z.string().url("Image must be a valid URL").optional(),
});

export const createTransportMeanCategorySchema = transportMeanCategoryBaseSchema;

export const updateTransportMeanCategorySchema = transportMeanCategoryBaseSchema.extend({ id: z.string().uuid() }).partial();

export type CreateTransportMeanCategoryInput = z.infer<typeof createTransportMeanCategorySchema>;
export type UpdateTransportMeanCategoryInput = z.infer<typeof updateTransportMeanCategorySchema>;

export default createTransportMeanCategorySchema;
