import { renderCategoryDashboard } from "./page-server";

export const metadata = {
  title: "Packaging category dashboard",
};

export const dynamic = "force-dynamic";

export default async function Page(props: Parameters<typeof renderCategoryDashboard>[0]) {
  return renderCategoryDashboard(props);
}
