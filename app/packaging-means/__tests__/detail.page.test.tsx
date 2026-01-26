/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import DetailPage from "@/app/packaging-means/[slug]/[id]/page";

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    packagingMean: {
      findUnique: jest.fn().mockResolvedValue({
        id: "pkg-1",
        name: "My Packaging",
        description: "desc",
        length: 100,
        width: 200,
        height: 300,
        numberOfPackagings: 2,
        price: 10,
        sop: new Date("2024-01-01"),
        eop: new Date("2025-01-01"),
        status: "ACTIVE",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        packagingMeanCategory: { name: "Utility Cart" },
        plant: { name: "Plant A" },
        flow: { slug: "flow-a" },
        supplier: { name: "Supplier A" },
        images: [],
        accessories: [
          { accessoryId: "acc-1", qtyPerPackaging: 1, accessory: { name: "Cover", supplier: { name: "AccSupplier" } } },
        ],
        parts: [
          {
            partId: "part-1",
            partsPerPackaging: 3,
            levelsPerPackaging: 2,
            verticalPitch: 10,
            horizontalPitch: 11,
            part: {
              name: "Part A",
              partFamily: { name: "Family A" },
              project: { name: "Proj A" },
              accessories: [
                { accessoryId: "acc-2", qtyPerPart: 5, accessory: { name: "Bolt", supplier: { name: "BoltCo" } } },
              ],
            },
          },
        ],
      }),
    },
    noteLink: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  }),
}));

jest.mock("@/app/packaging-means/_registry/packagingMean.registry", () => ({
  resolvePackagingMeanSlug: () => "utility-cart",
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

describe("Packaging detail page", () => {
  it("affiche le header, les métriques et les sections Parts/Accessories", async () => {
    render(await DetailPage({ params: { slug: "utility-cart", id: "pkg-1" } }));

    // Header titles
    expect(screen.getByText(/My Packaging/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Utility Cart/i).length).toBeGreaterThan(0);

    // Metrics
    expect(screen.getByText(/Dimensions/i)).toBeInTheDocument();
    expect(screen.getByText(/100 × 200 × 300/)).toBeInTheDocument();
    expect(screen.getByText(/Units/i)).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText(/Price/i)).toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(screen.getByText(/Plant A/)).toBeInTheDocument();
    expect(screen.getAllByText(/flow-a/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Supplier A/)).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
    expect(screen.getByText(/SOP/)).toBeInTheDocument();
    expect(screen.getByText(/EOP/)).toBeInTheDocument();

    // Parts section
    expect(screen.getByText(/Parts/)).toBeInTheDocument();
    expect(screen.getAllByText(/Part A/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Family A/)).toBeInTheDocument();
    expect(screen.getByText(/Proj A/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument(); // qty/pack
    expect(screen.getAllByText("2").length).toBeGreaterThan(1); // levels present
    expect(screen.getByText("10")).toBeInTheDocument(); // V pitch
    expect(screen.getByText("11")).toBeInTheDocument(); // H pitch

    // Packaging accessories
    expect(screen.getByText(/Packaging Accessories/)).toBeInTheDocument();
    expect(screen.getByText(/Cover/)).toBeInTheDocument();
    expect(screen.getByText(/AccSupplier/)).toBeInTheDocument();
    expect(screen.getAllByText(/Qty\/pack/i).length).toBeGreaterThan(0);

  });
});
