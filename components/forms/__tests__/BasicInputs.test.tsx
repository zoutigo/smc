/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";

import { NameInput } from "@/components/forms/NameInput";
import { DescriptionInput } from "@/components/forms/DescriptionInput";
import { SopInput } from "@/components/forms/SopInput";
import { PriceInput } from "@/components/forms/PriceInput";

describe("Basic form inputs", () => {
  it("updates name and shows error", () => {
    const handleChange = jest.fn();
    render(<NameInput value="" onChange={handleChange} error="Required" />);

    const input = screen.getByPlaceholderText(/storage mean name/i);
    fireEvent.change(input, { target: { value: "New storage" } });

    expect(handleChange).toHaveBeenCalledWith("New storage");
    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  it("updates description and shows error", () => {
    const handleChange = jest.fn();
    render(<DescriptionInput value="" onChange={handleChange} error="Too short" />);

    const textarea = screen.getByPlaceholderText(/what makes this storage mean unique/i);
    fireEvent.change(textarea, { target: { value: "Longer description" } });

    expect(handleChange).toHaveBeenCalledWith("Longer description");
    expect(screen.getByText(/too short/i)).toBeInTheDocument();
  });

  it("updates sop date", () => {
    const handleChange = jest.fn();
    render(<SopInput value="2026-01-01" onChange={handleChange} />);

    const input = screen.getByDisplayValue("2026-01-01");
    fireEvent.change(input, { target: { value: "2026-12-31" } });

    expect(handleChange).toHaveBeenCalledWith("2026-12-31");
  });

  it("updates price and coerces invalid numbers to 0", () => {
    const handleChange = jest.fn();
    const { rerender } = render(<PriceInput value={100} onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/^0$/);
    fireEvent.change(input, { target: { value: "250" } });
    expect(handleChange).toHaveBeenCalledWith(250);

    handleChange.mockClear();
    rerender(<PriceInput value={0} onChange={handleChange} error="Invalid price" />);
    fireEvent.change(screen.getByPlaceholderText(/^0$/), { target: { value: "" } });
    expect(handleChange).toHaveBeenCalledWith(0);
    expect(screen.getByText(/invalid price/i)).toBeInTheDocument();
  });
});
