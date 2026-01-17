/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";

const mockCreatePackagingMeanCategoryAction = jest.fn<Promise<{ status: "success" }>, unknown[]>(async () => ({ status: "success" }));

jest.mock("@/app/packaging-means/actions", () => ({
  __esModule: true,
  createPackagingMeanCategoryAction: (...args: unknown[]) => mockCreatePackagingMeanCategoryAction(...args),
}));

import PackagingForm from "@/components/packaging-means/PackagingForm";
import { ConfirmProvider } from "@/components/ui/confirm-message";

describe("Packaging category form", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("enables submit when required fields are filled", async () => {
    await act(async () => {
      render(<ConfirmProvider><PackagingForm /></ConfirmProvider>);
    });

    const button = screen.getByRole("button", { name: /save category/i });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/category name/i), { target: { value: "Boxes" } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Reusable boxes" } });
      const file = new File(["dummy"], "a.jpg", { type: "image/jpeg" });
      const input = screen.getByLabelText(/image upload/i) as HTMLInputElement;
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);
    });

    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("shows server fieldErrors when action returns errors", async () => {
    const fakeAction = jest.fn().mockResolvedValueOnce({ status: "error", fieldErrors: { name: "bad name" } });

    render(<ConfirmProvider><PackagingForm actionOverride={(fd: FormData) => fakeAction(fd)} /></ConfirmProvider>);
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/category name/i), { target: { value: "Boxes" } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Reusable" } });
    });

    const button = screen.getByRole("button", { name: /save category/i });
    await act(async () => fireEvent.submit(button.closest("form") as HTMLFormElement));

    expect(await screen.findByText(/bad name/i)).toBeInTheDocument();
  });

});
