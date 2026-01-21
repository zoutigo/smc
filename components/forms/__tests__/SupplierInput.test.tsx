/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SupplierInput } from "@/components/forms/SupplierInput";

describe("SupplierInput", () => {
  const baseProps = {
    value: "",
    onChange: jest.fn(),
    suppliers: [
      { id: "s1", name: "Supplier 1" },
      { id: "s2", name: "Supplier 2" },
    ],
    countries: [
      { id: "11111111-1111-4111-8111-111111111111", name: "France" },
      { id: "22222222-2222-4222-8222-222222222222", name: "Canada" },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      json: async () => ({ ok: true, supplier: { id: "s3", name: "New Supplier" } }),
    })) as unknown as typeof fetch;
  });

  it("does not submit parent form when adding inline supplier", async () => {
    const onChange = jest.fn();
    const submitSpy = jest.fn((e: React.FormEvent) => e.preventDefault());

    render(
      <form onSubmit={submitSpy}>
        <SupplierInput {...baseProps} onChange={onChange} />
      </form>
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /not in the list/i }));
    fireEvent.input(screen.getByPlaceholderText(/new supplier name/i), { target: { value: " New Supplier " } });
    fireEvent.input(screen.getByPlaceholderText(/city/i), { target: { value: " Vigo " } });
    const countrySelect = screen.getAllByRole("combobox").slice(-1)[0];
    fireEvent.change(countrySelect, { target: { value: "11111111-1111-4111-8111-111111111111" } });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("s3"));
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
