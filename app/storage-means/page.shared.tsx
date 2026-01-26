import type { Image, StorageMeanCategory } from "@prisma/client";

import StorageCatalogueClient from "./StorageCatalogueClient";
import { getStorageMeanCategories } from "./actions";

type Props = { baseHref: string; heading?: string; subheading?: string };

export default async function StorageCatalogueSharedPage({ baseHref, heading, subheading }: Props) {
  const categories = (await getStorageMeanCategories()) as Array<StorageMeanCategory & { image: Image | null }>;
  return <StorageCatalogueClient categories={categories} baseHref={baseHref} heading={heading} subheading={subheading} />;
}
