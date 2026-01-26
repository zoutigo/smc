import type { Image, TransportMeanCategory } from "@prisma/client";

import TransportCatalogueClient from "./TransportCatalogueClient";
import { getTransportMeanCategories } from "./actions";

type Props = { baseHref: string; heading?: string; subheading?: string };

export default async function TransportCatalogueSharedPage({ baseHref, heading, subheading }: Props) {
  const categories = (await getTransportMeanCategories()) as Array<TransportMeanCategory & { image: Image | null }>;
  return <TransportCatalogueClient categories={categories} baseHref={baseHref} heading={heading} subheading={subheading} />;
}
