/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";

import SharedStorageMeanForm from "@/app/storage-means/_registry/shared-storage-mean-form";
import { useCreateStorageMeanStore } from "@/app/storage-means/_registry/useCreateStorageMeanStore";

let globalDispatchMock: jest.Mock | null = null;

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useActionState: (_fn: unknown, initial: unknown) => [initial ?? { status: "idle" }, globalDispatchMock ?? jest.fn(), false],
  };
});

const pushMock = jest.fn();
const showMock = jest.fn();
const createStorageMeanActionMock = jest.fn();
let dispatchMock: jest.Mock;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: showMock }),
}));

jest.mock("@/components/forms/MeanMultistepForm", () => ({
  MeanMultistepForm: ({
    children,
    onSubmit,
  }: {
    children?: (step: { key: string }) => React.ReactNode;
    onSubmit: (fd: FormData) => void;
  }) => (
    <div>
      {children ? children({ key: "summary" }) : null}
      <button type="button" aria-label="submit-now" onClick={() => onSubmit(new FormData())}>
        Submit
      </button>
    </div>
  ),
}));

jest.mock("@/components/forms/PlantInput", () => ({
  PlantInput: ({ onChange }: { onChange: (ids: string[], newPlant?: { id: string; name: string }) => void }) => (
    <button type="button" aria-label="select plant" onClick={() => onChange(["plant-1"])}>
      Select plant
    </button>
  ),
}));

jest.mock("@/components/forms/FlowInput", () => ({
  FlowInput: ({ onChange }: { onChange: (ids: string[]) => void }) => (
    <button type="button" aria-label="select flow" onClick={() => onChange(["flow-1", "flow-2"])}>
      Select flow
    </button>
  ),
}));

jest.mock("@/components/forms/SupplierInput", () => ({
  SupplierInput: ({ onChange }: { onChange: (ids: string[]) => void }) => (
    <button type="button" aria-label="select supplier" onClick={() => onChange(["supplier-1"])}>
      Select supplier
    </button>
  ),
}));

jest.mock("@/components/forms/ImageInput", () => ({
  ImageInput: ({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) => (
    <div>
      <input
        aria-label="image-input"
        type="file"
        multiple
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
      <div data-testid="image-count">{files.length}</div>
    </div>
  ),
}));

jest.mock("@/app/storage-means/[slug]/actions", () => ({
  createStorageMeanAction: (...args: unknown[]) => createStorageMeanActionMock(...args),
  updateStorageMeanAction: jest.fn(),
}));

const baseProps = {
  mode: "create" as const,
  categoryId: "cat-uuid",
  categorySlug: "manual-transtocker",
  plants: [{ id: "plant-1", name: "Plant One" }],
  flows: [
    { id: "flow-1", from: "INJECTION", to: "ASSEMBLY", slug: "inj-ass" },
    { id: "flow-2", from: "ASSEMBLY", to: "CUSTOMER", slug: "ass-cust" },
  ],
  suppliers: [{ id: "supplier-1", name: "Supplier One" }],
  countries: [{ id: "country-1", name: "France" }],
};

describe("SharedStorageMeanForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useCreateStorageMeanStore.getState().reset());
    dispatchMock = jest.fn(async (fd: FormData) => {
      createStorageMeanActionMock({}, fd);
      return { status: "success" };
    });
    globalDispatchMock = dispatchMock;
  });

  it("submits lane-based storage means", async () => {
    render(<SharedStorageMeanForm {...baseProps} specType="lanes" />);

    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.updateField("name", "Manual transtocker");
      store.updateField("description", "lane spec");
      store.updateField("price", 100);
      store.updateField("sop", "2025-01-01");
      store.updateField("plantId", "plant-1");
      store.updateField("flowIds", ["flow-1"]);
      store.updateField("supplierId", "supplier-1");
      store.updateField("heightMm", 1200);
      store.updateField("usefulSurfaceM2", 10);
      store.updateField("grossSurfaceM2", 12);
      store.addLane({ lengthMm: 500, widthMm: 300, heightMm: 200, numberOfLanes: 1 });
      store.setStep(6);
    });
    const file = new File([new Uint8Array([1, 2, 3])], "lane.png", { type: "image/png" });
    act(() => useCreateStorageMeanStore.getState().updateField("images", [file]));

    fireEvent.click(screen.getByLabelText("submit-now"));

    await waitFor(() => expect(dispatchMock).toHaveBeenCalled());
    const formData = dispatchMock.mock.calls[0]?.[0] as FormData;
    expect(formData.get("specType")).toBe("lanes");
    expect(formData.get("flowIds")).toBe(JSON.stringify(["flow-1"]));
    expect(formData.get("lanes")).toBe(JSON.stringify([{ lengthMm: 500, widthMm: 300, heightMm: 200, numberOfLanes: 1 }]));
    expect(formData.get("imageFile_0")).toEqual(file);
  });

  it("submits high-bay storage means", async () => {
    render(<SharedStorageMeanForm {...baseProps} specType="highbay" />);

    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.updateField("name", "ASRS");
      store.updateField("description", "high bay spec");
      store.updateField("price", 500);
      store.updateField("sop", "2025-02-02");
      store.updateField("plantId", "plant-1");
      store.updateField("flowIds", ["flow-2"]);
      store.updateField("supplierId", "supplier-1");
      store.updateField("heightMm", 2000);
      store.updateField("usefulSurfaceM2", 20);
      store.updateField("grossSurfaceM2", 25);
      store.updateField("highBaySpec", {
        numberOfLevels: 5,
        numberOfBays: 3,
        slotLengthMm: 400,
        slotWidthMm: 300,
        slotHeightMm: 250,
        numberOfSlots: 60,
      });
      store.setStep(6);
    });
    const file = new File([new Uint8Array([4, 5, 6])], "highbay.png", { type: "image/png" });
    act(() => useCreateStorageMeanStore.getState().updateField("images", [file]));

    fireEvent.click(screen.getByLabelText("submit-now"));

    await waitFor(() => expect(dispatchMock).toHaveBeenCalled());
    const formData = dispatchMock.mock.calls[0]?.[0] as FormData;
    expect(formData.get("specType")).toBe("highbay");
    expect(formData.get("flowIds")).toBe(JSON.stringify(["flow-2"]));
    expect(formData.get("highBaySpec")).toBe(
      JSON.stringify({
        numberOfLevels: 5,
        numberOfBays: 3,
        slotLengthMm: 400,
        slotWidthMm: 300,
        slotHeightMm: 250,
        numberOfSlots: 60,
      })
    );
    expect(formData.get("imageFile_0")).toEqual(file);
  });

  it("includes staffing lines for lanes spec", async () => {
    render(<SharedStorageMeanForm {...baseProps} specType="lanes" />);

    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.updateField("name", "CRM");
      store.updateField("price", 50);
      store.updateField("sop", "2025-03-03");
      store.updateField("plantId", "plant-1");
      store.updateField("flowIds", ["flow-1"]);
      store.updateField("heightMm", 800);
      store.updateField("usefulSurfaceM2", 8);
      store.updateField("grossSurfaceM2", 9);
      store.addLane({ lengthMm: 300, widthMm: 200, heightMm: 150, numberOfLanes: 1 });
      store.setStaffingLines([
        { shift: "SHIFT_2", workforceType: "INDIRECT", qty: 3, role: "Maintenance", description: "Night shift" },
      ]);
      store.setStep(6);
    });
    const file = new File([new Uint8Array([7, 8, 9])], "staff.png", { type: "image/png" });
    act(() => useCreateStorageMeanStore.getState().updateField("images", [file]));

    fireEvent.click(screen.getByLabelText("submit-now"));

    await waitFor(() => expect(dispatchMock).toHaveBeenCalled());
    const formData = dispatchMock.mock.calls[0]?.[0] as FormData;
    expect(formData.get("staffingLines")).toBe(
      JSON.stringify([{ shift: "SHIFT_2", workforceType: "INDIRECT", qty: 3, role: "Maintenance", description: "Night shift" }])
    );
    expect(formData.get("imageFile_0")).toEqual(file);
  });

  it("adds removed existing images to payload for highbay spec", async () => {
    render(<SharedStorageMeanForm {...baseProps} specType="highbay" />);

    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.updateField("name", "ASRS with cleanup");
      store.updateField("price", 999);
      store.updateField("sop", "2025-04-04");
      store.updateField("plantId", "plant-1");
      store.updateField("flowIds", ["flow-2"]);
      store.updateField("heightMm", 1000);
      store.updateField("usefulSurfaceM2", 11);
      store.updateField("grossSurfaceM2", 13);
      store.updateField("highBaySpec", {
        numberOfLevels: 2,
        numberOfBays: 2,
        slotLengthMm: 100,
        slotWidthMm: 90,
        slotHeightMm: 80,
        numberOfSlots: 10,
      });
      store.updateField("existingImages", [{ id: "img-old", url: "/old.png" }]);
      store.updateField("removedImageIds", ["img-old"]);
      store.setStep(6);
    });
    const file = new File([new Uint8Array([10, 11])], "new.png", { type: "image/png" });
    act(() => useCreateStorageMeanStore.getState().updateField("images", [file]));

    fireEvent.click(screen.getByLabelText("submit-now"));

    await waitFor(() => expect(dispatchMock).toHaveBeenCalled());
    const formData = dispatchMock.mock.calls[0]?.[0] as FormData;
    expect(formData.get("removeImageIds")).toBe(JSON.stringify(["img-old"]));
    expect(formData.get("imageFile_0")).toEqual(file);
  });
});
