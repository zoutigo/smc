import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PackagingCard from "@/components/packaging-means/PackagingCard";

jest.mock("@/components/ConfirmModal", () => ({
  __esModule: true,
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

describe("PackagingCard", () => {
  const baseCategory = {
    id: "cat-1",
    name: "Returnable crates",
    description: "Durable crates used for heavy shipments",
  } as const;

  it("renders fallback initials when no image is provided", () => {
    render(<PackagingCard {...baseCategory} />);

    expect(screen.getByText("RE")).toBeInTheDocument();
    expect(screen.getByTestId("packaging-description")).toHaveTextContent(/Durable/);
    expect(screen.getByTestId("packaging-card-footer")).toBeInTheDocument();
  });

  it("displays the uploaded image and triggers handlers", async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();

    render(
      <PackagingCard
        {...baseCategory}
        imageUrl="https://example.com/image.png"
        onEdit={handleEdit}
      />,
    );

    expect(screen.getByAltText(/Returnable crates image/i)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Edit packaging category/i));
    expect(handleEdit).toHaveBeenCalledWith("cat-1");
    expect(screen.getByLabelText(/Delete packaging category/i)).toBeInTheDocument();
  });
});
