import { PackagingStatus } from "@prisma/client";

export const resolvePackagingMeanSlug = (slug: unknown) => (typeof slug === "string" ? slug : undefined);

export const defaultPackagingStatus = PackagingStatus.DRAFT;

