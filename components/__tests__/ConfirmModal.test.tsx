/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmModal from "@/components/ConfirmModal";

describe("ConfirmModal", () => {
  it("opens when trigger is clicked", () => {
    render(
      <ConfirmModal
        trigger={<button>Trigger</button>}
        title="Delete item"
        description="This action cannot be undone"
        onConfirm={jest.fn()}
      />
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(screen.getByText(/trigger/i));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/delete item/i)).toBeInTheDocument();
  });

  it("calls onConfirm and closes", async () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmModal
        trigger={<button>Delete</button>}
        title="Confirm"
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByText(/delete/i));
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("closes when clicking overlay", async () => {
    render(
      <ConfirmModal
        trigger={<button>Toggle</button>}
        title="Confirm"
        onConfirm={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText(/toggle/i));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("confirm-modal-overlay"));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });
});
