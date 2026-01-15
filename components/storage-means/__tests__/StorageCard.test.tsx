import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StorageCard from "@/components/storage-means/StorageCard";

jest.mock("@/components/ConfirmModal", () => ({
  __esModule: true,
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

describe("StorageCard", () => {
  const baseCategory = {
    id: "storage-1",
    name: "Refrigerated room",
    description: "Temperature-controlled room for perishable goods",
  } as const;

  it("renders fallback initials and description when no image exists", () => {
    render(<StorageCard {...baseCategory} />);

    expect(screen.getByText("RE")).toBeInTheDocument();
    expect(screen.getByTestId("storage-description")).toHaveTextContent(/Temperature-controlled/);
    expect(screen.getByTestId("storage-card-footer")).toBeInTheDocument();
    expect(screen.getByTestId("storage-label")).toHaveTextContent(/storage/i);
  });

  it("shows uploaded image and triggers edit handler", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();

    render(
      <StorageCard
        {...baseCategory}
        imageUrl="https://example.com/storage.png"
        onEdit={onEdit}
      />,
    );

    expect(screen.getByAltText(/Refrigerated room image/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Edit storage mean category/i));
    expect(onEdit).toHaveBeenCalledWith("storage-1");
    expect(screen.getByLabelText(/Delete storage mean category/i)).toBeInTheDocument();
  });
});
