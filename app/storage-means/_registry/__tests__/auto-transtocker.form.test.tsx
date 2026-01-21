/**
 * @jest-environment jsdom
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import AutoTranstockerForm from "@/app/storage-means/_registry/auto-transtocker.form";
import { useCreateStorageMeanStore } from "@/app/storage-means/_registry/useCreateStorageMeanStore";

const pushMock = jest.fn();
const showMock = jest.fn();
const createStorageMeanActionMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: showMock }),
}));

jest.mock("@/components/forms/PlantInput", () => ({
  PlantInput: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" aria-label="select plant" onClick={() => onChange("plant-1")}>Select plant</button>
  ),
}));

jest.mock("@/components/forms/FlowInput", () => ({
  FlowInput: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" aria-label="select flow" onClick={() => onChange("flow-1")}>Select flow</button>
  ),
}));

jest.mock("@/components/forms/SupplierInput", () => ({
  SupplierInput: ({ onChange }: { onChange: (id: string) => void }) => (
    <button type="button" aria-label="select supplier" onClick={() => onChange("supplier-1")}>Select supplier</button>
  ),
}));

jest.mock("@/components/forms/ImageInput", () => ({
  ImageInput: ({ files, onChange, error }: { files: File[]; onChange: (files: File[]) => void; error?: string | null }) => (
    <div>
      <input
        aria-label="image-input"
        type="file"
        multiple
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
      <div data-testid="image-count">{files.length}</div>
      {files.map((file, idx) => (
        <button key={file.name} type="button" onClick={() => onChange(files.filter((_, i) => i !== idx))}>
          Remove {file.name}
        </button>
      ))}
      {error ? <p>{error}</p> : null}
    </div>
  ),
}));

jest.mock("@/app/storage-means/[slug]/actions", () => ({
  createStorageMeanAction: (...args: unknown[]) => createStorageMeanActionMock(...args),
  updateStorageMeanAction: jest.fn(),
}));

const baseProps = {
  mode: "create" as const,
  categoryId: "11111111-1111-4111-8111-111111111111",
  categorySlug: "auto-transtocker",
  plants: [{ id: "22222222-2222-4222-8222-222222222222", name: "Plant A" }],
  flows: [{ id: "33333333-3333-4333-8333-333333333333", from: "INJECTION", to: "ASSEMBLY", slug: "inj-ass" }],
  countries: [{ id: "country-1", name: "France" }],
  suppliers: [{ id: "44444444-4444-4444-8444-444444444444", name: "Supplier A" }],
};

const fillBasics = () => {
  fireEvent.click(screen.getByRole("button", { name: /start/i }));

  fireEvent.change(screen.getByPlaceholderText(/storage mean name/i), { target: { value: "Auto transtocker" } });
  fireEvent.change(screen.getByPlaceholderText(/^0$/), { target: { value: 120 } });
  fireEvent.change(screen.getByPlaceholderText(/what makes this storage mean unique/i), {
    target: { value: "A robust auto transtocker" },
  });
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. siemens/i), { target: { value: "Siemens" } });
  act(() => useCreateStorageMeanStore.getState().updateField("sop", "2025-01-01"));
  fireEvent.click(screen.getByRole("button", { name: /select plant/i }));
  fireEvent.click(screen.getByRole("button", { name: /select flow/i }));
  act(() => {
    const store = useCreateStorageMeanStore.getState();
    store.updateField("plantId", "22222222-2222-4222-8222-222222222222");
    store.updateField("flowId", "33333333-3333-4333-8333-333333333333");
  });

  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
};

const addValidLane = () => {
  fireEvent.click(screen.getByRole("button", { name: /add lane/i }));

  fireEvent.change(screen.getByLabelText(/Length in millimeters/i), { target: { value: 1200 } });
  fireEvent.change(screen.getByLabelText(/Width in millimeters/i), { target: { value: 800 } });
  fireEvent.change(screen.getByLabelText(/Height in millimeters/i), { target: { value: 600 } });
  fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: 2 } });

  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
};

const attachImage = (fileName = "auto.png") => {
  const file = new File([new Uint8Array([1, 2, 3])], fileName, { type: "image/png" });
  const input = screen.getByLabelText("image-input");
  fireEvent.change(input, { target: { files: [file] } });
  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
  return file;
};

describe("AutoTranstockerForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useCreateStorageMeanStore.getState().reset());
  });

  it("shows validation errors across steps", async () => {
    render(<AutoTranstockerForm {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(await screen.findAllByText(/name is required/i)).toHaveLength(2);
    expect(await screen.findByText(/plc brand is required/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/storage mean name/i), { target: { value: "Auto transtocker" } });
    fireEvent.change(screen.getByPlaceholderText(/what makes this storage mean unique/i), {
      target: { value: "some description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/^0$/), { target: { value: 10 } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. siemens/i), { target: { value: "Siemens" } });
    act(() => useCreateStorageMeanStore.getState().updateField("sop", "2025-02-02"));
    fireEvent.click(screen.getByRole("button", { name: /select plant/i }));
    act(() => {
      const store = useCreateStorageMeanStore.getState();
      store.updateField("plantId", "22222222-2222-4222-8222-222222222222");
      store.updateField("flowId", "33333333-3333-4333-8333-333333333333");
    });

    const nextButtonToSummary = screen.queryByRole("button", { name: /^next$/i });
    if (nextButtonToSummary) {
      fireEvent.click(nextButtonToSummary);
    }

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(await screen.findByText(/add at least one lane/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add lane/i }));
    fireEvent.change(screen.getByLabelText(/Length in millimeters/i), { target: { value: 100 } });
    fireEvent.change(screen.getByLabelText(/Width in millimeters/i), { target: { value: 50 } });
    fireEvent.change(screen.getByLabelText(/Height in millimeters/i), { target: { value: 60 } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: 1 } });

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/add at least one image/i)).toBeInTheDocument();
      expect(createStorageMeanActionMock).not.toHaveBeenCalled();
    });
  });

  it("submits successfully and redirects", async () => {
    createStorageMeanActionMock.mockResolvedValue({ status: "success" });
    render(<AutoTranstockerForm {...baseProps} />);

    fillBasics();
    addValidLane();
    const file = attachImage();

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createStorageMeanActionMock).toHaveBeenCalledTimes(1));
    const formData = createStorageMeanActionMock.mock.calls[0]?.[1] as FormData;
    expect(formData.get("categoryId")).toBe(baseProps.categoryId);
    expect(formData.get("name")).toBe("Auto transtocker");
    expect(formData.get("plcType")).toBe("Siemens");
    expect(formData.get("lanes")).toBe(JSON.stringify([{ length: 1200, width: 800, height: 600, quantity: 2 }]));
    expect(formData.get("imageFile_0")).toEqual(file);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/storage-means/auto-transtocker"));
    expect(showMock).toHaveBeenCalledWith("Storage mean created.", "success");
  });

  it("removes lanes and updates summary", async () => {
    createStorageMeanActionMock.mockResolvedValue({ status: "success" });
    render(<AutoTranstockerForm {...baseProps} />);

    fillBasics();

    fireEvent.click(screen.getByRole("button", { name: /add lane/i }));
    fireEvent.change(screen.getAllByLabelText(/length in millimeters/i)[0], { target: { value: 100 } });
    fireEvent.change(screen.getAllByLabelText(/width in millimeters/i)[0], { target: { value: 50 } });
    fireEvent.change(screen.getAllByLabelText(/height in millimeters/i)[0], { target: { value: 60 } });
    fireEvent.change(screen.getAllByLabelText(/quantity/i)[0], { target: { value: 1 } });

    fireEvent.click(screen.getByRole("button", { name: /add lane/i }));
    fireEvent.change(screen.getAllByLabelText(/length in millimeters/i)[1], { target: { value: 200 } });
    fireEvent.change(screen.getAllByLabelText(/width in millimeters/i)[1], { target: { value: 80 } });
    fireEvent.change(screen.getAllByLabelText(/height in millimeters/i)[1], { target: { value: 90 } });
    fireEvent.change(screen.getAllByLabelText(/quantity/i)[1], { target: { value: 3 } });

    const removeButtons = screen.getAllByRole("button", { name: /remove lane/i });
    fireEvent.click(removeButtons[0]);

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));

    attachImage();

    expect(screen.getByText(/#1: 200 x 80 x 90 mm — qty 3/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createStorageMeanActionMock).toHaveBeenCalled());
  });

  it("allows removing images before submit", async () => {
    createStorageMeanActionMock.mockResolvedValue({ status: "success" });
    render(<AutoTranstockerForm {...baseProps} />);

    fillBasics();
    addValidLane();

    const input = screen.getByLabelText("image-input");
    const fileOne = new File([new Uint8Array([1])], "one.png", { type: "image/png" });
    const fileTwo = new File([new Uint8Array([2])], "two.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [fileOne, fileTwo] } });
    expect(screen.getByTestId("image-count").textContent).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: /remove one.png/i }));
    expect(screen.getByTestId("image-count").textContent).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createStorageMeanActionMock).toHaveBeenCalled());
    const formData = createStorageMeanActionMock.mock.calls[0]?.[1] as FormData;
    expect((formData.get("imageFile_0") as File).name).toBe("two.png");
  });

  it("surfaces server errors", async () => {
    createStorageMeanActionMock.mockResolvedValue({ status: "error", message: "Backend down" });
    render(<AutoTranstockerForm {...baseProps} />);

    fillBasics();
    addValidLane();
    attachImage("broken.png");

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(createStorageMeanActionMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(/backend down/i)).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
  });
});
