import { StorageMeansDashboardClient } from "./storage-means-dashboard-client";
import { getStorageDashboardData } from "@/lib/storage-dashboard-data";

export const revalidate = 300;
export const metadata = {
  title: "Storage means dashboard",
  description: "Surfaces, lanes, workforce, and value for storage means.",
};

export default async function StorageMeansDashboardPage() {
  const data = await getStorageDashboardData();

  return (
    <main className="min-h-screen bg-smc-bg px-6 pb-10 pt-6">
      <StorageMeansDashboardClient {...data} />
    </main>
  );
}
