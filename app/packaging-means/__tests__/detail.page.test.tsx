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
        accessories: [{ accessoryId: "acc-1", qtyPerPackaging: 1, accessory: { name: "Cover" } }],
        parts: [
          {
            partId: "part-1",
            partsPerPackaging: 3,
            part: { name: "Part A", partFamily: { name: "Family A" }, project: { name: "Proj A" } },
          },
        ],
      }),
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
  it("affiche parts et accessories", async () => {
    render(await DetailPage({ params: { slug: "utility-cart", id: "pkg-1" } }));
    expect(screen.getByText(/Part A/)).toBeInTheDocument();
    expect(screen.getByText(/Family A/)).toBeInTheDocument();
    expect(screen.getByText(/Cover/)).toBeInTheDocument();
  });
});
