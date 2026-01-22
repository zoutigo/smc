/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotesSection from "@/app/transport-means/[slug]/[id]/NotesSection";

const mockCreate = jest.fn();

jest.mock("@/app/transport-means/[slug]/actions", () => ({
  createTransportMeanNoteAction: (...args: unknown[]) => mockCreate(...args),
}));

jest.mock("@/components/ui/confirm-message", () => ({
  useConfirmMessage: () => ({ show: jest.fn() }),
}));

describe("TransportMean NotesSection", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("disables submit until form is dirty and valid", async () => {
    const user = userEvent.setup();
    render(<NotesSection transportMeanId="tm-1" slug="agv-amr" initialNotes={[]} />);

    await user.click(screen.getByRole("button", { name: /add note/i }));
    const saveBtn = screen.getByRole("button", { name: /save note/i });
    expect(saveBtn).toBeDisabled();

    await user.type(screen.getByLabelText(/title/i), "Title");
    await waitFor(() => expect(saveBtn).toBeEnabled());

    await user.type(screen.getByLabelText(/^note/i), "Content");
    expect(saveBtn).toBeEnabled();
  });

  it("shows title error when submitting without title", async () => {
    const user = userEvent.setup();
    render(<NotesSection transportMeanId="tm-1" slug="agv-amr" initialNotes={[]} />);

    await user.click(screen.getByRole("button", { name: /add note/i }));
    await user.type(screen.getByLabelText(/^note/i), "Content");
    await user.click(screen.getByRole("button", { name: /save note/i }));

    expect(mockCreate).not.toHaveBeenCalled();
    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
  });

  it("adds note on success", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValue({
      status: "success",
      note: { id: "n1", title: "Title", content: "Content", createdAt: new Date("2024-01-01").toISOString() },
    });

    render(<NotesSection transportMeanId="tm-1" slug="agv-amr" initialNotes={[]} />);

    await user.click(screen.getByRole("button", { name: /add note/i }));
    await user.type(screen.getByLabelText(/title/i), "Title");
    await user.type(screen.getByLabelText(/^note/i), "Content");
    await waitFor(() => expect(screen.getByRole("button", { name: /save note/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /save note/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(await screen.findByText("Title", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Content", { selector: "p" })).toBeInTheDocument();
  });
});
