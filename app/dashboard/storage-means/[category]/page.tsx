import { renderStorageCategoryDashboard } from "./page-server";

export const revalidate = 300;
export { generateStaticParams } from "./page-server";

export default async function Page(props: Parameters<typeof renderStorageCategoryDashboard>[0]) {
  return renderStorageCategoryDashboard(props);
}
