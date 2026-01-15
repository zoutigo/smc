import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StorageForm from "@/components/storage-means/StorageForm";

const showMock = jest.fn();
const objectUrlMock = jest.fn((blob: Blob | MediaSource) => {
  void blob;
  return "blob:storage-preview";
}) as jest.MockedFunction<typeof URL.createObjectURL>;
const revokeUrlMock = jest.fn((url: string) => {
  void url;
  return undefined;
}) as jest.MockedFunction<typeof URL.revokeObjectURL>;

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: showMock }),
}));

jest.mock("@/app/storage-means/actions", () => ({
  createStorageMeanCategoryAction: jest.fn(),
}));

describe("StorageForm", () => {
  const actionOverride = jest.fn().mockResolvedValue({ status: "success" });

  beforeEach(() => {
    actionOverride.mockClear();
    showMock.mockClear();
    global.URL.createObjectURL = objectUrlMock;
    global.URL.revokeObjectURL = revokeUrlMock;
    objectUrlMock.mockClear();
    revokeUrlMock.mockClear();
  });

  it("uploads a file and submits form data", async () => {
    render(<StorageForm actionOverride={actionOverride} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Storage category name/i), "Cold storage");
    await user.type(screen.getByLabelText(/Description/i), "Chilled rooms for produce");

    const fileInput = screen.getByLabelText(/Image upload/i) as HTMLInputElement;
    const file = new File([Buffer.from("storage")], "storage.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Save storage category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    const submitted = actionOverride.mock.calls[0][0] as FormData;
    expect(submitted.get("name")).toBe("Cold storage");
    const submittedFile = submitted.get("imageFile") as File;
    expect(submittedFile).toBeInstanceOf(File);
    expect(submittedFile.name).toBe("storage.png");
  });

  it("resets after success and notifies user", async () => {
    const onClose = jest.fn();
    actionOverride.mockResolvedValue({ status: "success" });

    render(<StorageForm actionOverride={actionOverride} onClose={onClose} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Storage category name/i), "Dry room");
    await user.type(screen.getByLabelText(/Description/i), "Low humidity storage");
    await user.click(screen.getByRole("button", { name: /Save storage category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
    expect(showMock).toHaveBeenCalledWith("Storage category created", "success");
    expect((screen.getByLabelText(/Storage category name/i) as HTMLInputElement).value).toBe("");
  });

  it("displays server errors", async () => {
    actionOverride.mockResolvedValue({ status: "error", message: "Upload failed", fieldErrors: { name: "Duplicate" } });

    render(<StorageForm actionOverride={actionOverride} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Storage category name/i), "Ambient room");
    await user.type(screen.getByLabelText(/Description/i), "Ambient storage");
    await user.click(screen.getByRole("button", { name: /Save storage category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(showMock).toHaveBeenCalledWith("Upload failed", "error");
    expect(screen.getByText(/Duplicate/)).toBeInTheDocument();
  });

  it("supports edit mode and image restoration", async () => {
    const onSuccess = jest.fn();
    actionOverride.mockResolvedValue({ status: "success" });

    render(
      <StorageForm
        mode="edit"
        actionOverride={actionOverride}
        onSuccess={onSuccess}
        initialValues={{
          id: "storage-3",
          name: "Freezer",
          description: "Sub-zero storage",
          imageUrl: "https://example.com/freezer.png",
        }}
      />,
    );

    const user = userEvent.setup();
    expect(screen.getByLabelText(/Storage category name/i)).toHaveValue("Freezer");

    await user.click(screen.getByRole("button", { name: /Remove current image/i }));
    await user.click(screen.getByRole("button", { name: /Restore original/i }));
    await user.click(screen.getByRole("button", { name: /Update storage category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(showMock).toHaveBeenCalledWith("Storage category updated", "success");
    expect(onSuccess).toHaveBeenCalled();
  });
});
