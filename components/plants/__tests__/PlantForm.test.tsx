import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlantForm from "@/components/plants/PlantForm";

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

jest.mock("@/app/plants/actions", () => ({
  createPlantAction: jest.fn(),
}));

describe("PlantForm", () => {
  const actionOverride = jest.fn().mockResolvedValue({ status: "success" });

  beforeEach(() => {
    actionOverride.mockClear();
    showMock.mockClear();
    global.URL.createObjectURL = objectUrlMock;
    global.URL.revokeObjectURL = revokeUrlMock;
    objectUrlMock.mockClear();
    revokeUrlMock.mockClear();
  });

  it("passes the selected file to the server action", async () => {
    render(<PlantForm actionOverride={actionOverride} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Plant name/i), "Berlin Plant");

    const fileInput = screen.getByLabelText(/Image upload/i) as HTMLInputElement;
    const file = new File([Buffer.from("file-content")], "berlin.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Save plant/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    const submittedFormData = actionOverride.mock.calls[0][0] as FormData;
    const submittedFile = submittedFormData.get("imageFile") as File;

    expect(submittedFile).toBeInstanceOf(File);
    expect(submittedFile.name).toBe("berlin.png");
    expect(submittedFormData.get("name")).toBe("Berlin Plant");
  });

  it("resets and closes the form on success", async () => {
    const onClose = jest.fn();
    actionOverride.mockResolvedValue({ status: "success" });

    render(<PlantForm actionOverride={actionOverride} onClose={onClose} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Plant name/i), "Madrid Plant");

    const fileInput = screen.getByLabelText(/Image upload/i) as HTMLInputElement;
    const file = new File([Buffer.from("file-content")], "madrid.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Save plant/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
    expect(showMock).toHaveBeenCalledWith("Plant created", "success");
    expect((screen.getByLabelText(/Plant name/i) as HTMLInputElement).value).toBe("");
  });

  it("shows errors returned from the server action", async () => {
    actionOverride.mockResolvedValue({
      status: "error",
      message: "Upload failed",
      fieldErrors: { name: "Duplicate name" },
    });

    render(<PlantForm actionOverride={actionOverride} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Plant name/i), "Rome Plant");

    await user.click(screen.getByRole("button", { name: /Save plant/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(showMock).toHaveBeenCalledWith("Upload failed", "error");
    expect(screen.getByText("Duplicate name")).toBeInTheDocument();
  });

  it("prefills values and updates in edit mode", async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    actionOverride.mockResolvedValue({ status: "success" });

    render(
      <PlantForm
        mode="edit"
        initialValues={{
          id: "plant-1",
          name: "Existing Plant",
          addressId: "11111111-1111-4111-8111-111111111112",
        }}
        actionOverride={actionOverride}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    const user = userEvent.setup();
    expect(screen.getByLabelText(/Plant name/i)).toHaveValue("Existing Plant");
    expect(screen.getByLabelText(/Address ID/i)).toHaveValue("11111111-1111-4111-8111-111111111112");

    await user.clear(screen.getByLabelText(/Plant name/i));
    await user.type(screen.getByLabelText(/Plant name/i), "Updated Plant");
    await user.clear(screen.getByLabelText(/Address ID/i));

    await user.click(screen.getByRole("button", { name: /Update plant/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    expect(showMock).toHaveBeenCalledWith("Plant updated", "success");
    expect(onClose).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    const submittedFormData = actionOverride.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("clearAddress")).toBe("true");
  });

  it("shows the existing image preview and allows removing it", async () => {
    actionOverride.mockResolvedValue({ status: "success" });

    render(
      <PlantForm
        mode="edit"
        initialValues={{
          id: "plant-99",
          name: "Existing Plant",
          imageUrl: "https://example.com/plant.jpg",
        }}
        actionOverride={actionOverride}
      />,
    );

    const user = userEvent.setup();
    expect(screen.getByTestId("plant-image-avatar")).toHaveAttribute(
      "src",
      expect.stringContaining(encodeURIComponent("https://example.com/plant.jpg")),
    );

    await user.click(screen.getByRole("button", { name: /Remove current image/i }));
    await user.click(screen.getByRole("button", { name: /Update plant/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    const submittedFormData = actionOverride.mock.calls[0][0] as FormData;
    expect(submittedFormData.get("removeImage")).toBe("true");
  });

  it("attaches existing image metadata when uploading a replacement", async () => {
    actionOverride.mockResolvedValue({ status: "success" });

    render(
      <PlantForm
        mode="edit"
        initialValues={{
          id: "plant-101",
          name: "Existing Plant",
          imageUrl: "https://example.com/old.jpg",
        }}
        actionOverride={actionOverride}
      />,
    );

    const user = userEvent.setup();
    const fileInput = screen.getByLabelText(/Image upload/i) as HTMLInputElement;
    const file = new File([Buffer.from("file-content")], "replacement.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Update plant/i }));

    await waitFor(() => expect(actionOverride).toHaveBeenCalledTimes(1));
    const submittedFormData = actionOverride.mock.calls[0][0] as FormData;
    const submittedFile = submittedFormData.get("imageFile") as File;
    expect(submittedFile).toBeInstanceOf(File);
    expect(submittedFile.name).toBe("replacement.png");
    expect(submittedFormData.get("removeImage")).toBe("false");
  });
});
