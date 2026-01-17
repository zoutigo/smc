import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Image, StorageMeanCategory } from "@prisma/client";
import StorageMeanCategoriesPageClient, { STORAGE_MEAN_PAGE_SIZE } from "@/components/storage-means/StorageMeanCategoriesPageClient";
import { ConfirmProvider } from "@/components/ui/confirm-message";

const storageFormPropsMock = jest.fn();
const deleteStorageMeanCategoryActionMock = jest.fn().mockResolvedValue({ status: "success" });
const updateStorageMeanCategoryActionMock = jest.fn().mockResolvedValue({ status: "success" });

jest.mock("@/app/storage-means/actions", () => ({
  deleteStorageMeanCategoryAction: (...args: unknown[]) => deleteStorageMeanCategoryActionMock(...args),
  updateStorageMeanCategoryAction: (...args: unknown[]) => updateStorageMeanCategoryActionMock(...args),
}));

jest.mock("next/navigation", () => {
  const refresh = jest.fn();
  return {
    useRouter: () => ({ refresh }),
  };
});

jest.mock("@/components/storage-means/StorageCard", () => {
  const MockStorageCard = ({ name, id, onEdit, onDelete }: { name: string; id: string; onEdit?: (id: string) => void; onDelete?: (id: string) => void }) => (
    <div data-testid="storage-card">
      {name}
      <button type="button" aria-label={`edit-${name}`} onClick={() => onEdit?.(id)}>
        Edit
      </button>
      <button type="button" aria-label={`delete-${name}`} onClick={() => onDelete?.(id)}>
        Delete
      </button>
    </div>
  );
  MockStorageCard.displayName = "MockStorageCard";
  return { __esModule: true, default: MockStorageCard };
});

type MockStorageFormProps = Record<string, unknown> & { mode?: string; onClose?: () => void };

jest.mock("@/components/storage-means/StorageForm", () => {
  const MockStorageForm = (props: MockStorageFormProps) => {
    storageFormPropsMock(props);
    return (
      <div data-testid="storage-form">
        Storage Form ({props.mode ?? ""})
        <button type="button" onClick={() => props.onClose?.()}>Close</button>
      </div>
    );
  };
  MockStorageForm.displayName = "MockStorageForm";
  return { __esModule: true, default: MockStorageForm };
});

const timestamp = () => new Date("2024-02-01T00:00:00.000Z");
type StorageCategoryWithImage = StorageMeanCategory & { image: Image | null };

const createCategory = (index: number, overrides: Partial<StorageCategoryWithImage> = {}): StorageCategoryWithImage => ({
  id: overrides.id ?? `${index}`,
  name: overrides.name ?? `Storage ${index}`,
  description: overrides.description ?? `Description ${index}`,
  slug: overrides.slug ?? `storage-${index}`,
  image: overrides.image ?? null,
  createdAt: overrides.createdAt ?? timestamp(),
  updatedAt: overrides.updatedAt ?? timestamp(),
});

const categories: StorageCategoryWithImage[] = [
  createCategory(1, { id: "1", name: "Cold room" }),
  createCategory(2, { id: "2", name: "Dry warehouse" }),
  createCategory(3, { id: "3", name: "Outdoor" }),
];

const buildCategories = (count: number): StorageCategoryWithImage[] => Array.from({ length: count }, (_, idx) => createCategory(idx + 1));

describe("StorageMeanCategoriesPageClient", () => {
  beforeEach(() => {
    storageFormPropsMock.mockClear();
    deleteStorageMeanCategoryActionMock.mockClear();
    updateStorageMeanCategoryActionMock.mockClear();
  });

  const renderWithProvider = (ui: React.ReactNode) => render(<ConfirmProvider>{ui}</ConfirmProvider>);

  it("shows three columns when form is hidden", () => {
    renderWithProvider(<StorageMeanCategoriesPageClient categories={categories} />);
    const grid = screen.getByTestId("storage-cards-grid");
    expect(grid).toHaveClass("lg:grid-cols-3");
    expect(screen.queryByTestId("storage-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("storage-count-heading")).toHaveTextContent("3");
  });

  it("toggles form visibility and reduces grid columns", async () => {
    renderWithProvider(<StorageMeanCategoriesPageClient categories={categories} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Add storage category/i }));

    const grid = screen.getByTestId("storage-cards-grid");
    expect(grid).toHaveClass("lg:grid-cols-2");
    expect(screen.getByTestId("storage-form")).toBeInTheDocument();
  });

  it("enters edit mode with initial values", async () => {
    renderWithProvider(<StorageMeanCategoriesPageClient categories={categories} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("edit-Cold room"));

    expect(screen.getByTestId("storage-form")).toBeInTheDocument();
    expect(storageFormPropsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: "edit",
      initialValues: expect.objectContaining({ id: "1", name: "Cold room", description: "Description 1" }),
    }));
  });

  it("limits cards per page", () => {
    const many = buildCategories(STORAGE_MEAN_PAGE_SIZE + 2);
    renderWithProvider(<StorageMeanCategoriesPageClient categories={many} />);

    expect(screen.getAllByTestId("storage-card")).toHaveLength(STORAGE_MEAN_PAGE_SIZE);
  });

  it("navigates between pages", async () => {
    const many = buildCategories(STORAGE_MEAN_PAGE_SIZE + 3);
    renderWithProvider(<StorageMeanCategoriesPageClient categories={many} />);
    const user = userEvent.setup();

    expect(screen.getAllByTestId("storage-card")[0]).toHaveTextContent("Storage 1");
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getAllByTestId("storage-card")[0]).toHaveTextContent(`Storage ${STORAGE_MEAN_PAGE_SIZE + 1}`);
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getAllByTestId("storage-card")[0]).toHaveTextContent("Storage 1");
  });

  it("calls the delete action when a card requests deletion", async () => {
    renderWithProvider(<StorageMeanCategoriesPageClient categories={categories} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("delete-Cold room"));

    expect(deleteStorageMeanCategoryActionMock).toHaveBeenCalledWith({ status: "idle" }, "1");
  });
});
