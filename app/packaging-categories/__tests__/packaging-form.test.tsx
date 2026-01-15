/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";

const mockCreatePackagingCategoryAction = jest.fn<Promise<{ status: "success" }>, unknown[]>(async () => ({ status: "success" }));

jest.mock("@/app/packaging-categories/actions", () => ({
  __esModule: true,
  createPackagingCategoryAction: (...args: unknown[]) => mockCreatePackagingCategoryAction(...args),
}));

import PackagingForm from "@/components/packaging-categories/PackagingForm";
import { ConfirmProvider } from "@/components/ui/confirm-message";

describe("Packaging category form", () => {
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

  it("shows duplication error when validate API returns exists", async () => {
    const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(() => (
      Promise.resolve({
        ok: true,
        json: async () => ({ exists: true }),
      } as unknown as Response)
    ));
    global.fetch = mockFetch as unknown as typeof fetch;
    render(<ConfirmProvider><PackagingForm debounceMs={10} /></ConfirmProvider>);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/category name/i), { target: { value: "Boxes" } });
      fireEvent.change(screen.getByLabelText(/description/i), { target: { value: "Reusable" } });
      await new Promise((r) => setTimeout(r, 30));
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(/already exists/i)).toBeInTheDocument());
  });
});
