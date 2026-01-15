import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Plant } from "@prisma/client";
import PlantsPageClient, { PLANTS_PAGE_SIZE } from "@/components/plants/PlantsPageClient";

const plantFormPropsMock = jest.fn();

jest.mock("@/app/plants/actions", () => ({
  deletePlantAction: jest.fn().mockResolvedValue({ status: "success" }),
  updatePlantAction: jest.fn().mockResolvedValue({ status: "success" }),
}));

jest.mock("next/navigation", () => {
  const refresh = jest.fn();
  return {
    useRouter: () => ({ refresh }),
  };
});

jest.mock("@/components/plants/PlantCard", () => {
  const MockPlantCard = ({ plantName, id, onEdit }: { plantName: string; id: string; onEdit?: (id: string) => void }) => (
    <div data-testid="plant-card">
      {plantName}
      <button type="button" aria-label={`edit-${plantName}`} onClick={() => onEdit?.(id)}>
        Edit
      </button>
    </div>
  );
  MockPlantCard.displayName = "MockPlantCard";
  return { __esModule: true, default: MockPlantCard };
});

type MockPlantFormProps = Record<string, unknown> & { mode?: string; onClose?: () => void };

jest.mock("@/components/plants/PlantForm", () => {
  const MockPlantForm = (props: MockPlantFormProps) => {
    plantFormPropsMock(props);
    return (
      <div data-testid="plant-form">
        Plant Form ({props.mode ?? ""})
        <button type="button" onClick={() => props.onClose?.()}>Close</button>
      </div>
    );
  };
  MockPlantForm.displayName = "MockPlantForm";
  return { __esModule: true, default: MockPlantForm };
});

const timestamp = () => new Date("2024-01-01T00:00:00.000Z");
const createPlant = (index: number, overrides: Partial<Plant> = {}): Plant => ({
  id: overrides.id ?? `${index}`,
  plantName: overrides.plantName ?? `Plant ${index}`,
  address: overrides.address ?? null,
  city: overrides.city ?? `City ${index}`,
  zipcode: overrides.zipcode ?? null,
  country: overrides.country ?? `Country ${index}`,
  image: overrides.image ?? null,
  createdAt: overrides.createdAt ?? timestamp(),
  updatedAt: overrides.updatedAt ?? timestamp(),
});

const plants: Plant[] = [
  createPlant(1, { id: "1", plantName: "Paris", city: "Paris", country: "France" }),
  createPlant(2, { id: "2", plantName: "Berlin", city: "Berlin", country: "Germany" }),
  createPlant(3, { id: "3", plantName: "Madrid", city: "Madrid", country: "Spain" }),
];

const buildPlants = (count: number): Plant[] =>
  Array.from({ length: count }, (_, idx) => createPlant(idx + 1));

describe("PlantsPageClient layout", () => {
  beforeEach(() => {
    plantFormPropsMock.mockClear();
  });

  it("shows three-card columns when the form is hidden", () => {
    render(<PlantsPageClient plants={plants} />);
    const grid = screen.getByTestId("plant-cards-grid");
    expect(grid).toHaveClass("lg:grid-cols-3");
    expect(grid).not.toHaveClass("lg:grid-cols-2");
    expect(screen.queryByTestId("plant-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("plants-pagination")).toBeInTheDocument();
    expect(screen.getByTestId("plants-count-heading")).toHaveTextContent("3");
  });

  it("reduces card columns when the form is visible", async () => {
    render(<PlantsPageClient plants={plants} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Add plant/i }));

    const grid = screen.getByTestId("plant-cards-grid");
    expect(grid).toHaveClass("lg:grid-cols-2");
    expect(screen.getByTestId("plant-form")).toBeInTheDocument();
  });

  it("opens the form in edit mode with initial values when clicking edit", async () => {
    render(<PlantsPageClient plants={plants} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("edit-Paris"));

    expect(screen.getByTestId("plant-form")).toBeInTheDocument();
    expect(plantFormPropsMock).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: "edit",
      initialValues: expect.objectContaining({ id: "1", plantName: "Paris", city: "Paris", country: "France" }),
    }));
  });

  it("shows pagination controls and limits cards per page", () => {
    const manyPlants = buildPlants(PLANTS_PAGE_SIZE + 2);
    render(<PlantsPageClient plants={manyPlants} />);

    expect(screen.getByTestId("plants-pagination")).toBeInTheDocument();
    expect(screen.getAllByTestId("plant-card")).toHaveLength(PLANTS_PAGE_SIZE);
  });

  it("navigates between pages using the pagination component", async () => {
    const manyPlants = buildPlants(PLANTS_PAGE_SIZE + 3);
    render(<PlantsPageClient plants={manyPlants} />);
    const user = userEvent.setup();

    expect(screen.getAllByTestId("plant-card")[0]).toHaveTextContent("Plant 1");

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getAllByTestId("plant-card")[0]).toHaveTextContent(`Plant ${PLANTS_PAGE_SIZE + 1}`);

    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getAllByTestId("plant-card")[0]).toHaveTextContent("Plant 1");
  });
});
