import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PackagingForm from "@/components/packaging-means/PackagingForm";

const showMock = jest.fn();
const objectUrlMock = jest.fn((blob: Blob | MediaSource) => {
  void blob;
  return "blob:preview";
}) as jest.MockedFunction<typeof URL.createObjectURL>;
const revokeUrlMock = jest.fn((url: string) => {
  void url;
  return undefined;
}) as jest.MockedFunction<typeof URL.revokeObjectURL>;

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: showMock }),
}));

jest.mock("@/app/packaging-means/actions", () => ({
  createPackagingCategoryAction: jest.fn(),
}));

describe("PackagingForm", () => {
  const actionOverride = jest.fn().mockResolvedValue({ status: "success" });

  beforeEach(() => {
    actionOverride.mockClear();
    showMock.mockClear();
    global.URL.createObjectURL = objectUrlMock;
    global.URL.revokeObjectURL = revokeUrlMock;
    objectUrlMock.mockClear();
    revokeUrlMock.mockClear();
  });

  it("submits the selected file", async () => {
    render(<PackagingForm actionOverride={actionOverride} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Category name/i), "Reusable bins");
    await user.type(screen.getByLabelText(/Description/i), "Durable bins for daily shipments");

    const fileInput = screen.getByLabelText(/Image upload/i) as HTMLInputElement;
    const file = new File([Buffer.from("file")], "bins.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Save category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    const submitted = actionOverride.mock.calls[0][0] as FormData;
    const submittedFile = submitted.get("imageFile") as File;
    expect(submittedFile).toBeInstanceOf(File);
    expect(submittedFile.name).toBe("bins.png");
    expect(submitted.get("name")).toBe("Reusable bins");
  });

  it("resets on success and closes the form", async () => {
    const onClose = jest.fn();
    actionOverride.mockResolvedValue({ status: "success" });

    render(<PackagingForm actionOverride={actionOverride} onClose={onClose} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Category name/i), "Bubble wrap");
    await user.type(screen.getByLabelText(/Description/i), "Classic bubble protection");
    await user.click(screen.getByRole("button", { name: /Save category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
    expect(showMock).toHaveBeenCalledWith("Category created", "success");
    expect((screen.getByLabelText(/Category name/i) as HTMLInputElement).value).toBe("");
  });

  it("surfaces errors returned by the server action", async () => {
    actionOverride.mockResolvedValue({ status: "error", message: "Upload failed", fieldErrors: { name: "Duplicate" } });

    render(<PackagingForm actionOverride={actionOverride} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Category name/i), "Foam");
    await user.type(screen.getByLabelText(/Description/i), "Foam wraps");
    await user.click(screen.getByRole("button", { name: /Save category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(showMock).toHaveBeenCalledWith("Upload failed", "error");
    expect(screen.getByText(/Duplicate/)).toBeInTheDocument();
  });

  it("prefills edit mode and restores original image", async () => {
    const onSuccess = jest.fn();
    actionOverride.mockResolvedValue({ status: "success" });

    render(
      <PackagingForm
        mode="edit"
        actionOverride={actionOverride}
        onSuccess={onSuccess}
        initialValues={{
          id: "cat-1",
          name: "Existing",
          description: "Already defined",
          imageUrl: "https://example.com/old.png",
        }}
      />,
    );

    const user = userEvent.setup();
    expect(screen.getByLabelText(/Category name/i)).toHaveValue("Existing");

    await user.click(screen.getByRole("button", { name: /Remove current image/i }));
    await user.click(screen.getByRole("button", { name: /Restore original/i }));
    await user.click(screen.getByRole("button", { name: /Update category/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(showMock).toHaveBeenCalledWith("Category updated", "success");
    expect(onSuccess).toHaveBeenCalled();
  });
});
