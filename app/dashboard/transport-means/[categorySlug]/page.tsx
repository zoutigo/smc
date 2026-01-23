import { renderTransportCategoryDashboard } from "./page-server";

export const dynamic = "force-dynamic";

export default async function Page(props: Parameters<typeof renderTransportCategoryDashboard>[0]) {
  return renderTransportCategoryDashboard(props);
}
