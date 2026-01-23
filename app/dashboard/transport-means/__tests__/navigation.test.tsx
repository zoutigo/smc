"use client";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SidebarClient, { type SidebarClientCategory } from "@/components/layout/SidebarClient";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("@/lib/stores/ui-store", () => ({
  useUIStore: () => ({ sidebarCollapsed: false }),
}));

const transportCategories: SidebarClientCategory[] = [
  { id: "tmc-1", name: "AGV-AMR", slug: "agv-amr" },
  { id: "tmc-2", name: "Forklift", slug: "forklift" },
];

describe("Sidebar dashboard links for transport means", () => {
  it("shows transport dashboard link and subcategories", async () => {
    const user = userEvent.setup();
    render(
      <SidebarClient storageCategories={[]} packagingCategories={[]} transportCategories={transportCategories} />
    );

    const sidebar = screen.getByRole("complementary");
    const dashboardToggle = within(sidebar).getByRole("button", { name: /show dashboard links/i });
    await user.click(dashboardToggle);
    const dashboardGroup = await within(sidebar).findByRole("group", { name: /dashboard links/i });
    const dashboardLink = within(dashboardGroup).getByRole("link", { name: /transport means/i });
    expect(dashboardLink).toHaveAttribute("href", "/dashboard/transport-means");
  });
});
