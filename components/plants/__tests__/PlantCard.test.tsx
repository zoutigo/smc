import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlantCard from "@/components/plants/PlantCard";

jest.mock("@/components/ConfirmModal", () => ({
  __esModule: true,
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

describe("PlantCard", () => {
  const basePlant = {
    id: "1",
    plantName: "Grenoble",
    city: "Grenoble",
    country: "France",
    address: "10 Rue des Fleurs",
    zipcode: "38000",
  } as const;

  it("renders fallback initials and layout sections when no image is provided", () => {
    render(<PlantCard {...basePlant} />);

    expect(screen.getByText("GR")).toBeInTheDocument();
    expect(screen.getByTestId("plant-card-header")).toHaveClass("bg-gradient-to-r");
    expect(screen.getByTestId("plant-card-footer")).toHaveClass("border-t");
    expect(screen.getByTestId("plant-country")).toHaveTextContent("FRANCE");
  });

  it("displays the uploaded image and surfaces action buttons", async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();

    render(
      <PlantCard
        {...basePlant}
        image="https://example.com/plant.png"
        onEdit={handleEdit}
      />,
    );

    expect(screen.getByAltText(/Grenoble image/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Edit plant/i));
    expect(handleEdit).toHaveBeenCalledWith("1");
    expect(screen.getByLabelText(/Delete plant/i)).toBeInTheDocument();
  });
});
