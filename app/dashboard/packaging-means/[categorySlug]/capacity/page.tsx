import { renderCategoryDashboard } from "../page-server";

export const metadata = {
  title: "Packaging category capacity dashboard",
};

export default async function Page(props: Parameters<typeof renderCategoryDashboard>[0]) {
  return renderCategoryDashboard(props);
}
