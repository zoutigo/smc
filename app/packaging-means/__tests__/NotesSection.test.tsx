/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotesSection from "@/app/packaging-means/[slug]/[id]/NotesSection";

const mockCreateNote = jest.fn();

jest.mock("@/app/packaging-means/[slug]/actions", () => ({
  createPackagingMeanNoteAction: (...args: unknown[]) => mockCreateNote(...args),
}));

describe("NotesSection", () => {
  beforeEach(() => {
    mockCreateNote.mockReset();
  });

  const defaultProps = {
    packagingMeanId: "11111111-1111-1111-1111-111111111111",
    slug: "picking-cart",
    initialNotes: [
      { id: "n1", title: "Existing", content: "Previous note", createdAt: new Date("2024-01-01").toISOString() },
    ],
  };

  it("affiche les notes existantes", () => {
    render(<NotesSection {...defaultProps} />);
    expect(screen.getByText(/existing/i)).toBeInTheDocument();
    expect(screen.getByText(/previous note/i)).toBeInTheDocument();
  });

  it("valide avec zod quand le formulaire est vide", async () => {
    render(<NotesSection {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    await userEvent.click(screen.getByRole("button", { name: /save note/i }));

    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Note content is required/i)).toBeInTheDocument();
  });

  it("soumet et ajoute une note en succès", async () => {
    mockCreateNote.mockImplementation(async (_state, formData: FormData) => {
      return {
        status: "success",
        note: {
          id: "n2",
          title: formData.get("title"),
          content: formData.get("content"),
          createdAt: new Date("2024-02-01").toISOString(),
        },
      };
    });

    render(<NotesSection {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    await userEvent.type(screen.getByLabelText(/title/i), "New title");
    await userEvent.type(screen.getByLabelText(/^note$/i), "New content");
    await userEvent.click(screen.getByRole("button", { name: /save note/i }));

    await waitFor(() => expect(mockCreateNote).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/New title/i)).toBeInTheDocument();
    expect(screen.getAllByText(/new content/i).length).toBeGreaterThan(0);
  });

  it("affiche les erreurs serveur renvoyées par l'action", async () => {
    mockCreateNote.mockResolvedValue({
      status: "error",
      fieldErrors: { content: "Content is required" },
    });

    render(<NotesSection {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    await userEvent.type(screen.getByLabelText(/title/i), "New title");
    await userEvent.type(screen.getByLabelText(/^note$/i), "Ok");
    await userEvent.click(screen.getByRole("button", { name: /save note/i }));

    expect(await screen.findByText(/Content is required/i)).toBeInTheDocument();
  });
});
