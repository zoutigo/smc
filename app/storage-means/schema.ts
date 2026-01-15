import { z } from "zod";

export const storageMeanCategoryBaseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(5, "Description is required"),
  imageUrl: z.string().url("Image must be a valid URL").optional(),
});

export const createStorageMeanCategorySchema = storageMeanCategoryBaseSchema;

export const updateStorageMeanCategorySchema = storageMeanCategoryBaseSchema.extend({ id: z.string().uuid() }).partial();

export type CreateStorageMeanCategoryInput = z.infer<typeof createStorageMeanCategorySchema>;
export type UpdateStorageMeanCategoryInput = z.infer<typeof updateStorageMeanCategorySchema>;

export default createStorageMeanCategorySchema;
