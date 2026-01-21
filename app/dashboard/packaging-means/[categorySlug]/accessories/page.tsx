import { renderCategoryDashboard } from "../page-server";

export const metadata = {
  title: "Packaging category accessories dashboard",
};

export default async function Page(props: Parameters<typeof renderCategoryDashboard>[0]) {
  return renderCategoryDashboard(props);
}
