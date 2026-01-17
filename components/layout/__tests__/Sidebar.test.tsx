import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import SidebarClient from "../SidebarClient";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("@/lib/stores/ui-store", () => ({
  useUIStore: () => ({ sidebarCollapsed: false }),
}));

const storageCategories = [
  { id: "cat-1", name: "Cold room", slug: "cold-room" },
  { id: "cat-2", name: "Dry warehouse", slug: "dry-warehouse" },
];

const packagingCategories = [
  { id: "pkg-1", name: "Trolley", slug: "trolley" },
  { id: "pkg-2", name: "Tallboy", slug: "tallboy" },
];

describe("Sidebar navigation", () => {
  it("renders the Packaging means link inside the aside", () => {
    render(<SidebarClient storageCategories={storageCategories} packagingCategories={packagingCategories} />);

    const sidebar = screen.getByRole("complementary");
    const packagingLink = within(sidebar).getByRole("link", { name: /packaging means/i });

    expect(packagingLink).toBeInTheDocument();
    expect(packagingLink).toHaveAttribute("href", "/packaging-means");
  });

  it("toggles storage categories when the caret button is clicked", async () => {
    render(<SidebarClient storageCategories={storageCategories} packagingCategories={packagingCategories} />);
    const user = userEvent.setup();

    const toggleButton = screen.getByRole("button", { name: /show storage mean categories/i });
    await user.click(toggleButton);

    const submenuLink = screen.getByRole("link", { name: /cold room/i });
    expect(submenuLink).toHaveAttribute("href", "/storage-means/cold-room");

    await user.click(toggleButton);
    expect(screen.queryByRole("link", { name: /cold room/i })).not.toBeInTheDocument();
  });
  it("toggles packaging categories when the caret button is clicked", async () => {
    render(<SidebarClient storageCategories={storageCategories} packagingCategories={packagingCategories} />);
    const user = userEvent.setup();

    const toggleButton = screen.getByRole("button", { name: /show packaging categories/i });
    await user.click(toggleButton);

    const submenuLink = screen.getByRole("link", { name: /trolley/i });
    expect(submenuLink).toHaveAttribute("href", "/packaging-means/trolley");

    await user.click(toggleButton);
    expect(screen.queryByRole("link", { name: /trolley/i })).not.toBeInTheDocument();
  });

  it("shows all storage category links when expanded", async () => {
    render(<SidebarClient storageCategories={storageCategories} packagingCategories={packagingCategories} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /show storage mean categories/i }));

    storageCategories.forEach((category) => {
      const link = screen.getByRole("link", { name: category.name });
      expect(link).toHaveAttribute("href", `/storage-means/${category.slug}`);
    });
  });

  it("shows all packaging category links when expanded", async () => {
    render(<SidebarClient storageCategories={storageCategories} packagingCategories={packagingCategories} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /show packaging categories/i }));

    packagingCategories.forEach((category) => {
      const link = screen.getByRole("link", { name: category.name });
      expect(link).toHaveAttribute("href", `/packaging-means/${category.slug}`);
    });
  });
});
