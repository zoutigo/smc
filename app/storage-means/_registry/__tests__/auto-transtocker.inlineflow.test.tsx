/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextDecoder, TextEncoder } from "util";
import { StorageStatus } from "@prisma/client";
import AutoTranstockerForm from "@/app/storage-means/_registry/auto-transtocker.form";

Object.assign(global, { TextEncoder, TextDecoder });

global.fetch = jest.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
  if (url === "/api/quick/plant") {
    return { json: async () => ({ ok: true, plant: { id: "plant-new-uuid", name: "Inline Plant" } }) } as unknown as Response;
  }
  if (url === "/api/quick/flow") {
    const body = JSON.parse((options?.body as string | undefined) ?? "{}");
    return { json: async () => ({ ok: true, flow: { id: "flow-new-uuid", from: body.from, to: body.to, slug: "injection-paint" } }) } as unknown as Response;
  }
  if (url === "/api/quick/supplier") {
    return { json: async () => ({ ok: true, supplier: { id: "supplier-new-uuid", name: "Inline Supplier" } }) } as unknown as Response;
  }
  return { json: async () => ({ ok: false, error: "Unknown" }) } as unknown as Response;
}) as unknown as typeof fetch;

const pushMock = jest.fn();
const showMock = jest.fn();
const updateStorageMeanActionMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: showMock }),
}));

jest.mock("@/app/storage-means/[slug]/actions", () => ({
  createStorageMeanAction: jest.fn(),
  updateStorageMeanAction: (...args: unknown[]) => updateStorageMeanActionMock(...args),
}));

jest.mock("@/lib/validation/flow", () => ({
  flowQuickSchema: {
    safeParse: ({ from, to }: { from: string; to: string }) =>
      from && to
        ? { success: true, data: { from, to } }
        : { success: false, error: { issues: [{ message: "Invalid flow" }] } },
  },
}));

const baseProps = {
  mode: "edit" as const,
  categoryId: "category-uuid",
  categorySlug: "auto-transtocker",
  storageMean: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Existing auto transtocker",
    description: "Existing description",
    price: 1234,
    status: StorageStatus.DRAFT,
    sop: new Date("2025-06-15"),
    eop: new Date("2026-06-15"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-06-01"),
    plantId: "22222222-2222-4222-8222-222222222222",
    flowId: "33333333-3333-4333-8333-333333333333",
    supplierId: "44444444-4444-4444-8444-444444444444",
    storageMeanCategoryId: "category-uuid",
    autoTranstocker: { plcType: "Siemens", lanes: [] },
    images: [],
  },
  plants: [
    { id: "22222222-2222-4222-8222-222222222222", name: "Plant A" },
    { id: "99999999-9999-4999-8999-999999999999", name: "Plant B" },
  ],
  flows: [
    { id: "33333333-3333-4333-8333-333333333333", from: "INJECTION", to: "ASSEMBLY", slug: "inj-ass" },
    { id: "55555555-5555-4555-8555-555555555555", from: "PAINT", to: "ASSEMBLY", slug: "paint-ass" },
  ],
  suppliers: [{ id: "44444444-4444-4444-8444-444444444444", name: "Supplier A" }],
  countries: [{ id: "country-uuid", name: "France" }],
};

describe("AutoTranstockerForm inline user flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps form on basics/lanes without submitting when using inline plant/flow/supplier", async () => {
    render(<AutoTranstockerForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    fireEvent.click(screen.getByLabelText(/plant not in the list/i));
    fireEvent.change(screen.getByPlaceholderText(/new plant name/i), { target: { value: "Inline Plant" } });
    fireEvent.change(screen.getAllByPlaceholderText(/city/i)[0], { target: { value: "Paris" } });
    const allCombosAfterPlant = screen.getAllByRole("combobox");
    const plantCountrySelect = allCombosAfterPlant[allCombosAfterPlant.length - 1];
    fireEvent.change(plantCountrySelect, { target: { value: "country-uuid" } });
    const addButtonsAfterPlant = screen.getAllByRole("button", { name: /^add$/i });
    const plantAddButton = addButtonsAfterPlant[0];
    await act(async () => {
      fireEvent.click(plantAddButton);
    });

    fireEvent.click(screen.getByLabelText(/flow not in the list/i));
    const flowCombos = screen.getAllByRole("combobox");
    const flowFrom = flowCombos[flowCombos.length - 2];
    const flowTo = flowCombos[flowCombos.length - 1];
    fireEvent.change(flowFrom, { target: { value: "INJECTION" } });
    fireEvent.change(flowTo, { target: { value: "PAINT" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add flow/i }));
    });

    fireEvent.click(screen.getByLabelText(/supplier not in the list/i));
    fireEvent.change(screen.getByPlaceholderText(/new supplier name/i), { target: { value: "Inline Supplier" } });
    fireEvent.change(screen.getAllByPlaceholderText(/city/i)[1], { target: { value: "Lyon" } });
    const combosAfterSupplier = screen.getAllByRole("combobox");
    const supplierCountrySelect = combosAfterSupplier[combosAfterSupplier.length - 1];
    fireEvent.change(supplierCountrySelect, { target: { value: "country-uuid" } });
    const addButtonsAfterSupplier = screen.getAllByRole("button", { name: /^add$/i });
    const supplierAddButton = addButtonsAfterSupplier[addButtonsAfterSupplier.length - 1];
    await act(async () => {
      fireEvent.click(supplierAddButton);
    });

    expect(updateStorageMeanActionMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByText(/lanes/i)).toBeInTheDocument();
    });
    expect(updateStorageMeanActionMock).not.toHaveBeenCalled();
  });
});
