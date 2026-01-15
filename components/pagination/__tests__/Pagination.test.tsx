import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination, { getPaginationRange } from "@/components/pagination/Pagination";

describe("Pagination component", () => {
  it("renders disabled controls when only one page exists", () => {
    render(<Pagination totalItems={5} pageSize={10} currentPage={1} onPageChange={jest.fn()} />);
    expect(screen.getByTestId("pagination-root")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Go to page 1/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("pagination-meta")).toHaveTextContent("10 per page");
    expect(screen.getByTestId("pagination-meta")).toHaveTextContent("Showing 1-5 of 5");
  });

  it("invokes onPageChange when navigating via controls", async () => {
    const onChange = jest.fn();
    render(<Pagination totalItems={50} pageSize={10} currentPage={2} onPageChange={onChange} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /previous/i }));
    await user.click(screen.getByRole("button", { name: /Next/i }));
    await user.click(screen.getByRole("button", { name: /Go to page 4/i }));

    expect(onChange).toHaveBeenNthCalledWith(1, 1);
    expect(onChange).toHaveBeenNthCalledWith(2, 3);
    expect(onChange).toHaveBeenNthCalledWith(3, 4);
  });

  it("shows ellipsis when the range is condensed", () => {
    render(<Pagination totalItems={200} pageSize={10} currentPage={8} siblingCount={1} onPageChange={jest.fn()} />);
    expect(screen.getAllByText("…")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Go to page 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Go to page 8/i })).toHaveAttribute("aria-current", "page");
  });
});

describe("getPaginationRange", () => {
  it("returns a full sequence when total pages fit", () => {
    expect(getPaginationRange(3, 1)).toEqual([1, 2, 3]);
  });

  it("returns a condensed sequence with dots", () => {
    expect(getPaginationRange(10, 5, 1)).toEqual([1, "dots", 4, 5, 6, "dots", 10]);
  });
});
