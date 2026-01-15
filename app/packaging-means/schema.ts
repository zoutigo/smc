import { z } from "zod";

export const packagingCategoryBaseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
  imageUrl: z.string().url("Image must be a valid URL").optional(),
});

export const createPackagingCategorySchema = packagingCategoryBaseSchema;

export const updatePackagingCategorySchema = packagingCategoryBaseSchema.extend({ id: z.string().uuid() }).partial();

export type CreatePackagingCategoryInput = z.infer<typeof createPackagingCategorySchema>;
export type UpdatePackagingCategoryInput = z.infer<typeof updatePackagingCategorySchema>;

export default createPackagingCategorySchema;
