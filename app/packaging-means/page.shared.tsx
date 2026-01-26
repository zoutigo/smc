import type { Image, PackagingMeanCategory } from "@prisma/client";

import PackagingCatalogueClient from "./PackagingCatalogueClient";
import { getPackagingMeanCategories } from "./actions";

type Props = { baseHref: string; heading?: string; subheading?: string };

export default async function PackagingCatalogueSharedPage({ baseHref, heading, subheading }: Props) {
  const categories = (await getPackagingMeanCategories()) as Array<PackagingMeanCategory & { image: Image | null }>;
  return <PackagingCatalogueClient categories={categories} baseHref={baseHref} heading={heading} subheading={subheading} />;
}
