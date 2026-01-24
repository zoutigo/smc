import { ConfirmProvider } from "@/components/ui/confirm-message";
import TransportCategoriesPageClient from "@/components/transport-means/TransportCategoriesPageClient";
import { getTransportMeanCategories } from "./actions";

export const dynamic = "force-dynamic";

export default async function TransportMeansPage() {
  const categories = await getTransportMeanCategories();

  return (
    <ConfirmProvider>
      <TransportCategoriesPageClient categories={categories} />
    </ConfirmProvider>
  );
}
