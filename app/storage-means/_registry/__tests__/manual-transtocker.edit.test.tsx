/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TextDecoder, TextEncoder } from "util";
import { StorageStatus } from "@prisma/client";
import ManualTranstockerForm from "@/app/storage-means/_registry/manual-transtocker.form";
import { useCreateStorageMeanStore } from "../useCreateStorageMeanStore";

Object.assign(global, { TextEncoder, TextDecoder });

const pushMock = jest.fn();
const showMock = jest.fn();
const updateStorageMeanActionMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: showMock }),
}));

jest.mock("@/components/forms/PlantInput", () => ({
  PlantInput: ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
    <div>
      <div data-testid="plant-value">{value}</div>
      <button type="button" onClick={() => onChange("66666666-6666-4666-8666-666666666666")}>Pick plant</button>
      <label>
        <input aria-label="plant not in the list" type="checkbox" /> Inline
      </label>
      <button type="button" aria-label="add-inline-plant" onClick={() => onChange("00000000-0000-0000-0000-000000000001")}>
        Add inline plant
      </button>
    </div>
  ),
}));

jest.mock("@/components/forms/FlowInput", () => ({
  FlowInput: ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
    <div>
      <div data-testid="flow-value">{value}</div>
      <button type="button" onClick={() => onChange("77777777-7777-4777-8777-777777777777")}>Pick flow</button>
      <label>
        <input aria-label="flow not in the list" type="checkbox" /> Inline
      </label>
      <button type="button" aria-label="add-inline-flow" onClick={() => onChange("00000000-0000-0000-0000-000000000002")}>
        Add inline flow
      </button>
    </div>
  ),
}));

jest.mock("@/components/forms/SupplierInput", () => ({
  SupplierInput: ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
    <div>
      <div data-testid="supplier-value">{value}</div>
      <button type="button" onClick={() => onChange("88888888-8888-4888-8888-888888888888")}>Pick supplier</button>
      <label>
        <input aria-label="supplier not in the list" type="checkbox" /> Inline
      </label>
      <button type="button" aria-label="add-inline-supplier" onClick={() => onChange("00000000-0000-0000-0000-000000000003")}>
        Add inline supplier
      </button>
    </div>
  ),
}));

jest.mock("@/app/storage-means/[slug]/actions", () => ({
  createStorageMeanAction: jest.fn(),
  updateStorageMeanAction: (...args: unknown[]) => updateStorageMeanActionMock(...args),
}));

const storageMean = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Existing manual transtocker",
  description: "Existing description",
  price: 1234,
  status: StorageStatus.ACTIVE,
  sop: new Date("2025-06-15"),
  eop: new Date("2026-06-15"),
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-06-01"),
  plantId: "22222222-2222-4222-8222-222222222222",
  flowId: "33333333-3333-4333-8333-333333333333",
  supplierId: "44444444-4444-4444-8444-444444444444",
  storageMeanCategoryId: "category-uuid",
  manualTranstocker: {
    lanes: [
      {
        lane: { length: 100, width: 50, height: 60 },
        quantity: 2,
      },
    ],
  },
  images: [
    {
      imageId: "img-1",
      image: { imageUrl: "https://example.com/image.png" },
    },
  ],
};

const baseProps = {
  mode: "edit" as const,
  categoryId: "category-uuid",
  categorySlug: "manual-transtocker",
  storageMean,
  plants: [
    { id: "22222222-2222-4222-8222-222222222222", name: "Plant A" },
    { id: "99999999-9999-4999-8999-999999999999", name: "Plant B" },
  ],
  flows: [
    { id: "33333333-3333-4333-8333-333333333333", from: "INJECTION", to: "ASSEMBLY", slug: "inj-ass" },
    { id: "55555555-5555-4555-8555-555555555555", from: "PAINT", to: "ASSEMBLY", slug: "paint-ass" },
  ],
  countries: [{ id: "country-uuid", name: "France" }],
  suppliers: [{ id: "44444444-4444-4444-8444-444444444444", name: "Supplier A" }],
};

describe("ManualTranstockerForm edit mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefills existing values", () => {
    render(<ManualTranstockerForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    expect(screen.getByDisplayValue(/Existing manual transtocker/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("1234")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Existing description/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(storageMean.sop.toISOString().slice(0, 10))).toBeInTheDocument();
    expect(screen.getByTestId("plant-value").textContent).toBe("22222222-2222-4222-8222-222222222222");
    expect(screen.getByTestId("flow-value").textContent).toBe("33333333-3333-4333-8333-333333333333");
  });

  it("submits updates and redirects on success", async () => {
    updateStorageMeanActionMock.mockResolvedValue({ status: "success" });
    render(<ManualTranstockerForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    fireEvent.change(screen.getByPlaceholderText(/storage mean name/i), { target: { value: "Updated name" } });
    fireEvent.change(screen.getByPlaceholderText(/what makes this storage mean unique/i), {
      target: { value: "Updated desc" },
    });
    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: 999 } });
    fireEvent.click(screen.getByText(/Pick plant/i));
    fireEvent.click(screen.getByText(/Pick flow/i));

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /update/i }));
    });

    await waitFor(() => expect(updateStorageMeanActionMock).toHaveBeenCalled());
    const formData = updateStorageMeanActionMock.mock.calls[0]?.[1] as FormData;
    expect(formData.get("name")).toBe("Updated name");
    expect(formData.get("description")).toBe("Updated desc");
    expect(formData.get("price")).toBe("999");
    expect(formData.get("plantId")).toBe("66666666-6666-4666-8666-666666666666");
    expect(formData.get("flowId")).toBe("77777777-7777-4777-8777-777777777777");

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith(`/storage-means/manual-transtocker/${storageMean.id}`));
    expect(showMock).toHaveBeenCalledWith("Storage mean updated.", "success");
  });

  it("shows server error on failure", async () => {
    updateStorageMeanActionMock.mockResolvedValue({ status: "error", message: "Update failed" });
    render(<ManualTranstockerForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /update/i }));
    });

    await waitFor(() => expect(screen.getByText(/update failed/i)).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not submit when adding inline plant/flow/supplier and only submits on final action", async () => {
    updateStorageMeanActionMock.mockResolvedValue({ status: "success" });
    render(<ManualTranstockerForm {...baseProps} />);

    // basics
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    await screen.findByDisplayValue("Existing manual transtocker");
    await screen.findByTestId("plant-value");
    fireEvent.click(screen.getByLabelText(/plant not in the list/i));
    fireEvent.click(screen.getByRole("button", { name: /add-inline-plant/i }));
    fireEvent.click(screen.getByLabelText(/flow not in the list/i));
    fireEvent.click(screen.getByRole("button", { name: /add-inline-flow/i }));
    fireEvent.click(screen.getByLabelText(/supplier not in the list/i));
    fireEvent.click(screen.getByRole("button", { name: /add-inline-supplier/i }));

    // simulate inline creations resolving and field values being set
    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.updateField("plantId", "00000000-0000-0000-0000-000000000001");
      store.updateField("flowId", "00000000-0000-0000-0000-000000000002");
      store.updateField("supplierId", "00000000-0000-0000-0000-000000000003");
    });

    // go to lanes
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    // add one lane minimally via store
    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.addLane({ length: 1, width: 1, height: 1, quantity: 1 });
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // images step: bypass with store data
    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.setImages([new File([new Uint8Array([1])], "one.png", { type: "image/png" })]);
      store.setStep(5);
    });

    // At summary, no submit yet
    expect(updateStorageMeanActionMock).not.toHaveBeenCalled();

    // Navigate to summary and ensure submit happens only when we explicitly click update text
    const actionButton = screen.getByRole("button", { name: /update/i });
    await act(async () => {
      fireEvent.click(actionButton);
    });

    expect(updateStorageMeanActionMock).toHaveBeenCalledTimes(1);
  });
});
