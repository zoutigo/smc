import { z } from "zod";

export const packagingMeanCategoryBaseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
  imageUrl: z.string().url("Image must be a valid URL").optional(),
});

export const createPackagingMeanCategorySchema = packagingMeanCategoryBaseSchema;

export const updatePackagingMeanCategorySchema = packagingMeanCategoryBaseSchema.extend({ id: z.string().uuid() }).partial();

export type CreatePackagingMeanCategoryInput = z.infer<typeof createPackagingMeanCategorySchema>;
export type UpdatePackagingMeanCategoryInput = z.infer<typeof updatePackagingMeanCategorySchema>;

export default createPackagingMeanCategorySchema;
