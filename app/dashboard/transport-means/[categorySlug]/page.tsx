import { renderTransportCategoryDashboard } from "./page-server";

export const metadata = {
  title: "Transport category dashboard",
};

export default async function Page(props: Parameters<typeof renderTransportCategoryDashboard>[0]) {
  return renderTransportCategoryDashboard(props);
}
