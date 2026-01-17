/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";

const mockCreatePlantAction = jest.fn<Promise<{ status: "success" }>, unknown[]>(async () => ({ status: "success" }));

jest.mock("@/app/plants/actions", () => ({
  __esModule: true,
  createPlantAction: (...args: unknown[]) => mockCreatePlantAction(...args),
}));

import PlantForm from "@/components/plants/PlantForm";
import { ConfirmProvider } from "@/components/ui/confirm-message";

describe("Plant form", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalFetch = global.fetch;

  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("enables submit when required fields are filled", async () => {
    await act(async () => {
      render(<ConfirmProvider><PlantForm /></ConfirmProvider>);
    });

    const button = screen.getByRole("button", { name: /save plant/i });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/plant name/i), { target: { value: "Plant A" } });
      const file = new File(["dummy"], "a.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/image upload/i) as HTMLInputElement;
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);
    });

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("shows server fieldErrors when action returns errors", async () => {
    // ensure the action returned to the component resolves with fieldErrors
    const fakeAction = jest.fn().mockResolvedValueOnce({ status: "error", fieldErrors: { name: "bad name" } });

    render(<ConfirmProvider><PlantForm actionOverride={(fd: FormData) => fakeAction(fd)} /></ConfirmProvider>);
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/plant name/i), { target: { value: "Plant A" } });
    });

    const button = screen.getByRole("button", { name: /save plant/i });
    await act(async () => fireEvent.submit(button.closest("form") as HTMLFormElement));

    expect(await screen.findByText(/bad name/i)).toBeInTheDocument();
  });
});
