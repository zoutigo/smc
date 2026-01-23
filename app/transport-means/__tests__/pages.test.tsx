/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import * as actions from "../actions";
import { getPrisma } from "@/lib/prisma";

jest.mock("../actions");
jest.mock("@/lib/prisma");

const mockedActions = actions as jest.Mocked<typeof actions>;

describe("TransportMeans pages", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders category list with cards and actions", async () => {
    const Page = (await import("../[slug]/page")).default;
    mockedActions.getTransportMeanCategoryBySlug.mockResolvedValue({
      id: "cat-1",
      name: "AGV-AMR",
      slug: "agv-amr",
      description: "desc",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
    } as unknown as Awaited<ReturnType<typeof actions.getTransportMeanCategoryBySlug>>);
    mockedActions.getTransportMeansByCategorySlug.mockResolvedValue([
      {
        id: "tm-1",
        name: "AMR Alpha",
        description: "desc",
        units: 2,
        loadCapacityKg: 800,
        plant: { name: "Plant A" },
        supplier: { name: "Supplier A" },
        flow: { slug: "injection-to-paint" },
        sop: new Date("2025-01-01"),
        eop: new Date("2026-01-01"),
        updatedAt: new Date("2025-01-02"),
      } as unknown as Awaited<ReturnType<typeof actions.getTransportMeansByCategorySlug>>[number],
    ]);
    (getPrisma as jest.Mock).mockReturnValue({
      plant: { findMany: jest.fn().mockResolvedValue([{ id: "p1", name: "Plant A" }]) },
      flow: { findMany: jest.fn().mockResolvedValue([{ id: "f1", slug: "injection-to-paint" }]) },
    } as unknown);

    const ui = await Page({ params: { slug: "agv-amr" }, searchParams: {} });
    render(ui);

    expect(await screen.findByText(/AGV-AMR's list/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create AGV-AMR/i })).toBeInTheDocument();
    expect(screen.getByText("AMR Alpha")).toBeInTheDocument();
    expect(screen.getByText(/Load capacity/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit/i })).toBeInTheDocument();
  });

  it("renders detail page with metrics and actions", async () => {
    const Page = (await import("../[slug]/[id]/page")).default;
    mockedActions.getTransportMeanById.mockResolvedValue({
      id: "tm-1",
      name: "AMR Alpha",
      description: "desc",
      units: 2,
      loadCapacityKg: 800,
      cruiseSpeedKmh: 6,
      maxSpeedKmh: 12,
      sop: new Date("2025-01-01"),
      eop: new Date("2026-01-01"),
      updatedAt: new Date("2025-01-02"),
      plant: { name: "Plant A" },
      supplier: { name: "Supplier A" },
      transportMeanCategory: { name: "AGV-AMR" },
      flow: { slug: "injection-to-paint" },
      packagingLinks: [{ packagingMeanId: "pm-1", maxQty: 2, packagingMean: { name: "Picking Cart 01" } }],
      images: [],
    } as unknown as Awaited<ReturnType<typeof actions.getTransportMeanById>>);

    (getPrisma as jest.Mock).mockReturnValue({
      noteLink: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown);

    const ui = await Page({ params: { slug: "agv-amr", id: "tm-1" } });
    render(ui);

    expect(await screen.findByText("AMR Alpha")).toBeInTheDocument();
    expect(screen.getByText(/Load capacity/)).toBeInTheDocument();
    expect(screen.getByText(/SOP/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Edit/i })).toBeInTheDocument();
    expect(screen.getByText("Picking Cart 01")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Notes/i })).toBeInTheDocument();
  });
});
