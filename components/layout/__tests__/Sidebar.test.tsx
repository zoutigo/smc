import { render, screen, within } from "@testing-library/react";
import React from "react";

import Sidebar from "../Sidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("@/lib/stores/ui-store", () => ({
  useUIStore: () => ({ sidebarCollapsed: false }),
}));

describe("Sidebar navigation", () => {
  it("renders the Packaging means link inside the aside", () => {
    render(<Sidebar />);

    const sidebar = screen.getByRole("complementary");
    const packagingLink = within(sidebar).getByRole("link", { name: /packaging means/i });

    expect(packagingLink).toBeInTheDocument();
    expect(packagingLink).toHaveAttribute("href", "/packaging-means");
  });
});
