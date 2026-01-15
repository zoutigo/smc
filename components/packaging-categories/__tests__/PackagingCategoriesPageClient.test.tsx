import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PackagingCategory } from "@prisma/client";
import PackagingCategoriesPageClient, { PACKAGING_CATEGORIES_PAGE_SIZE } from "@/components/packaging-categories/PackagingCategoriesPageClient";

const packagingFormPropsMock = jest.fn();

jest.mock("@/app/packaging-categories/actions", () => ({
  deletePackagingCategoryAction: jest.fn().mockResolvedValue({ status: "success" }),
  updatePackagingCategoryAction: jest.fn().mockResolvedValue({ status: "success" }),
}));

jest.mock("next/navigation", () => {
  const refresh = jest.fn();
  return {
    useRouter: () => ({ refresh }),
  };
});

jest.mock("@/components/packaging-categories/PackagingCard", () => {
  const MockPackagingCard = ({ name, id, onEdit }: { name: string; id: string; onEdit?: (id: string) => void }) => (
    <div data-testid="packaging-card">
      {name}
      <button type="button" aria-label={`edit-${name}`} onClick={() => onEdit?.(id)}>
        Edit
      </button>
    </div>
  );
  MockPackagingCard.displayName = "MockPackagingCard";
  return { __esModule: true, default: MockPackagingCard };
});

type MockPackagingFormProps = Record<string, unknown> & { mode?: string; onClose?: () => void };

jest.mock("@/components/packaging-categories/PackagingForm", () => {
  const MockPackagingForm = (props: MockPackagingFormProps) => {
    packagingFormPropsMock(props);
    return (
      <div data-testid="packaging-form">
        Packaging Form ({props.mode ?? ""})
        <button type="button" onClick={() => props.onClose?.()}>Close</button>
      </div>
    );
  };
  MockPackagingForm.displayName = "MockPackagingForm";
  return { __esModule: true, default: MockPackagingForm };
});

const timestamp = () => new Date("2024-01-01T00:00:00.000Z");
const createCategory = (index: number, overrides: Partial<PackagingCategory> = {}): PackagingCategory => ({
  id: overrides.id ?? `${index}`,
  name: overrides.name ?? `Category ${index}`,
  description: overrides.description ?? `Description ${index}`,
  imageUrl: overrides.imageUrl ?? null,
  createdAt: overrides.createdAt ?? timestamp(),
  updatedAt: overrides.updatedAt ?? timestamp(),
});

const categories: PackagingCategory[] = [
  createCategory(1, { id: "1", name: "Boxes" }),
  createCategory(2, { id: "2", name: "Bags" }),
  createCategory(3, { id: "3", name: "Wrapping" }),
];

const buildCategories = (count: number): PackagingCategory[] => Array.from({ length: count }, (_, idx) => createCategory(idx + 1));

describe("PackagingCategoriesPageClient", () => {
  beforeEach(() => {
    packagingFormPropsMock.mockClear();
  });

  it("shows three columns when form hidden", () => {
    render(<PackagingCategoriesPageClient categories={categories} />);
    const grid = screen.getByTestId("packaging-cards-grid");
    expect(grid).toHaveClass("lg:grid-cols-3");
    expect(screen.queryByTestId("packaging-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("packaging-pagination")).toBeInTheDocument();
    expect(screen.getByTestId("packaging-count-heading")).toHaveTextContent("3");
  });

  it("reduces columns when form visible", async () => {
    render(<PackagingCategoriesPageClient categories={categories} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Add category/i }));

    const grid = screen.getByTestId("packaging-cards-grid");
    expect(grid).toHaveClass("lg:grid-cols-2");
    expect(screen.getByTestId("packaging-form")).toBeInTheDocument();
  });

  it("enters edit mode with initial values", async () => {
    render(<PackagingCategoriesPageClient categories={categories} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("edit-Boxes"));

    expect(screen.getByTestId("packaging-form")).toBeInTheDocument();
    expect(packagingFormPropsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: "edit",
      initialValues: expect.objectContaining({ id: "1", name: "Boxes", description: "Description 1" }),
    }));
  });

  it("shows pagination controls and limits cards", () => {
    const many = buildCategories(PACKAGING_CATEGORIES_PAGE_SIZE + 2);
    render(<PackagingCategoriesPageClient categories={many} />);

    expect(screen.getAllByTestId("packaging-card")).toHaveLength(PACKAGING_CATEGORIES_PAGE_SIZE);
  });

  it("navigates between pages", async () => {
    const many = buildCategories(PACKAGING_CATEGORIES_PAGE_SIZE + 3);
    render(<PackagingCategoriesPageClient categories={many} />);
    const user = userEvent.setup();

    expect(screen.getAllByTestId("packaging-card")[0]).toHaveTextContent("Category 1");
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getAllByTestId("packaging-card")[0]).toHaveTextContent(`Category ${PACKAGING_CATEGORIES_PAGE_SIZE + 1}`);
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getAllByTestId("packaging-card")[0]).toHaveTextContent("Category 1");
  });
});
