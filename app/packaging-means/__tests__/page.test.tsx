/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import CategoryPage from "@/app/packaging-means/[slug]/page";

jest.mock("@/app/packaging-means/actions", () => ({
  getPackagingMeanCategories: jest.fn().mockResolvedValue([]),
  getPackagingMeanCategoryBySlug: jest.fn().mockResolvedValue({
    id: "cat-1",
    name: "Utility Cart",
    slug: "utility-cart",
    description: "desc",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    image: null,
  }),
}));

jest.mock("@/app/packaging-means/fallback-data", () => ({
  findPackagingMeanCategoryFallbackBySlug: jest.fn().mockReturnValue(null),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/packaging-means/utility-cart",
  useSearchParams: () => new URLSearchParams(""),
}));

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    plant: {
      findMany: jest.fn().mockResolvedValue([{ id: "plant-1", name: "Plant A" }]),
    },
    flow: {
      findMany: jest.fn().mockResolvedValue([{ id: "flow-1", slug: "flow-a" }]),
    },
    packagingMean: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "pkg-1",
          name: "Test cart",
          description: "desc",
          updatedAt: new Date("2024-01-02"),
          sop: new Date("2024-01-01"),
          eop: new Date("2024-12-31"),
          numberOfPackagings: 10,
          price: 1200,
          status: "ACTIVE",
          plant: { name: "Plant A" },
          flow: { slug: "flow-a" },
          parts: [{ id: "p1" }, { id: "p2" }],
        },
      ]),
    },
  }),
}));

describe("Packaging category page", () => {
  it("affiche le bouton de création vers /packaging-means/[slug]/new", async () => {
    render(await CategoryPage({ params: { slug: "utility-cart" } }));
    const ctas = screen.getAllByRole("link", { name: /create utility cart/i });
    expect(ctas[0]).toHaveAttribute("href", "/packaging-means/utility-cart/new");
  });

  it("affiche la liste des packaging means", async () => {
    render(await CategoryPage({ params: { slug: "utility-cart" } }));
    expect(screen.getByText(/test cart/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Plant A/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/flow-a/i).length).toBeGreaterThan(0);
  });
});
