/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Prisma, TransportMeanCategory } from "@prisma/client";
import TransportCategoriesPageClient from "@/components/transport-means/TransportCategoriesPageClient";
import { ConfirmProvider } from "@/components/ui/confirm-message";

const updateTransportMeanCategoryActionMock = jest.fn();
const deleteTransportMeanCategoryActionMock = jest.fn();

jest.mock("@/app/transport-means/actions", () => ({
  deleteTransportMeanCategoryAction: (...args: unknown[]) => deleteTransportMeanCategoryActionMock(...args),
  updateTransportMeanCategoryAction: (...args: unknown[]) => updateTransportMeanCategoryActionMock(...args),
}));

jest.mock("next/navigation", () => {
  const refresh = jest.fn();
  return {
    useRouter: () => ({ refresh }),
  };
});

jest.mock("@/components/ui/CategoryCard", () => {
  const MockCategoryCard = ({ name, id, onEdit }: { name: string; id: string; onEdit?: (id: string) => void }) => (
    <div data-testid="transport-card">
      <span>{name}</span>
      <button type="button" aria-label="Edit transport category" onClick={() => onEdit?.(id)}>
        Edit
      </button>
    </div>
  );
  MockCategoryCard.displayName = "MockCategoryCard";
  return { __esModule: true, default: MockCategoryCard };
});

const createCategory = (overrides: Partial<TransportMeanCategory & { image: Prisma.ImageUncheckedCreateInput | null }> = {}) => ({
  id: "transport-1",
  name: "AGV",
  description: "Autonomous guided",
  slug: "agv",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  image: null,
  ...overrides,
});

const renderWithProvider = (categories: Array<TransportMeanCategory & { image: Prisma.ImageUncheckedCreateInput | null }>) =>
  render(
    <ConfirmProvider>
      <TransportCategoriesPageClient categories={categories} />
    </ConfirmProvider>
  );

describe("TransportCategoriesPageClient update flow", () => {
  beforeEach(() => {
    updateTransportMeanCategoryActionMock.mockReset();
    deleteTransportMeanCategoryActionMock.mockReset();
    global.URL.createObjectURL = jest.fn(() => "blob:mock");
    global.URL.revokeObjectURL = jest.fn();
  });

  it("opens the update form and shows zod validation errors", async () => {
    const user = userEvent.setup();
    renderWithProvider([createCategory()]);

    fireEvent.click(screen.getByRole("button", { name: /Edit transport category/i }));
    expect(screen.getByRole("heading", { name: /Update category/i })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "A");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "abc");

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(await screen.findByText("Description is required")).toBeInTheDocument();
    expect(updateTransportMeanCategoryActionMock).not.toHaveBeenCalled();
  });

  it("submits an update and closes the form on success", async () => {
    updateTransportMeanCategoryActionMock.mockResolvedValue({ status: "success" });
    const user = userEvent.setup();
    const { container } = renderWithProvider([createCategory()]);

    fireEvent.click(screen.getByRole("button", { name: /Edit transport category/i }));

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "AGV Updated");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Updated description for AGV");

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    expect(fileInput).toBeTruthy();
    if (fileInput) {
      const file = new File(["image"], "category.png", { type: "image/png" });
      await user.upload(fileInput, file);
    }

    const submitButton = screen.getByRole("button", { name: /Update category/i });
    await user.click(submitButton);

    await waitFor(() => expect(updateTransportMeanCategoryActionMock).toHaveBeenCalled());
    expect(await screen.findByText("Category updated")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("heading", { name: /Update category/i })).not.toBeInTheDocument());
  });

  it("keeps the form open and shows an error message when update fails", async () => {
    updateTransportMeanCategoryActionMock.mockResolvedValue({ status: "error", message: "Unable to update transport category" });
    const user = userEvent.setup();
    renderWithProvider([createCategory()]);

    fireEvent.click(screen.getByRole("button", { name: /Edit transport category/i }));

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "AGV Updated");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Updated description for AGV");

    await user.click(screen.getByRole("button", { name: /Update category/i }));

    expect(await screen.findByText("Unable to update transport category")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Update category/i })).toBeInTheDocument();
  });
});
