/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import CategoryPage from "@/app/packaging-means/[slug]/page";

const pushMock = jest.fn();

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
  useRouter: () => ({ push: pushMock, replace: jest.fn() }),
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
          width: 100,
          length: 200,
          height: 300,
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

  it("affiche les champs clés de la card (dimensions, totals, dates, actions)", async () => {
    render(await CategoryPage({ params: { slug: "utility-cart" } }));
    expect(screen.getByText("100x200x300 mm")).toBeInTheDocument();
    expect(screen.getByText("Total packaging")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument(); // numberOfPackagings
    expect(screen.getByText("Part variants")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // parts length
    expect(screen.getByText(/Updated:/i)).toBeInTheDocument();
    expect(screen.getByText(/SOP:/i)).toBeInTheDocument();
    expect(screen.getByText(/EOP:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/edit test cart/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/view test cart/i)).toBeInTheDocument();
  });

  it("affiche le header et les filtres (back, show hero, plant, flow)", async () => {
    render(await CategoryPage({ params: { slug: "utility-cart" } }));
    expect(screen.getByRole("link", { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show hero/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Plant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Flow/i)).toBeInTheDocument();
    expect(screen.getByText(/Utility Cart's list/i)).toBeInTheDocument();
  });
});
