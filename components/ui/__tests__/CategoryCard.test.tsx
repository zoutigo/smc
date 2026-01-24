/**
 * @jest-environment jsdom
 */

/* eslint-disable @next/next/no-img-element */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryCard from "@/components/ui/CategoryCard";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt={alt} {...props} />,
}));

jest.mock("@/components/ConfirmModal", () => ({
  __esModule: true,
  default: ({ trigger, onConfirm, title, description }: { trigger: React.ReactNode; onConfirm: () => void; title: string; description: string }) => (
    <div>
      <div data-testid="confirm-title">{title}</div>
      <div data-testid="confirm-description">{description}</div>
      <button type="button" onClick={() => onConfirm()}>
        Confirm
      </button>
      {trigger}
    </div>
  ),
}));

describe("CategoryCard", () => {
  const baseProps = {
    id: "cat-1",
    name: "Cold room",
    description: "Temperature-controlled area for sensitive goods.",
    imageUrl: "https://example.com/hero.jpg",
    label: "STORAGE",
  };

  it("renders name, description, label, and footer test ids", () => {
    render(
      <CategoryCard
        {...baseProps}
        descriptionTestId="storage-description"
        footerTestId="storage-card-footer"
        labelTestId="storage-label"
      />
    );

    expect(screen.getByText("Cold room")).toBeInTheDocument();
    expect(screen.getByTestId("storage-description")).toHaveTextContent(/Temperature-controlled/);
    expect(screen.getByTestId("storage-card-footer")).toBeInTheDocument();
    expect(screen.getByTestId("storage-label")).toHaveTextContent(/storage/i);
  });

  it("shows a fallback when no image is provided", () => {
    render(<CategoryCard {...baseProps} imageUrl="" descriptionTestId="desc" />);
    expect(screen.getByText("CO")).toBeInTheDocument();
  });

  it("renders an image when imageUrl is provided", () => {
    render(<CategoryCard {...baseProps} />);
    expect(screen.getByRole("img", { name: /cold room image/i })).toBeInTheDocument();
  });

  it("truncates long descriptions", () => {
    const longDescription = "A".repeat(140);
    render(<CategoryCard {...baseProps} description={longDescription} />);
    expect(screen.getByText(/…$/)).toBeInTheDocument();
  });

  it("shows fallback text when description is empty", () => {
    render(<CategoryCard {...baseProps} description={""} />);
    expect(screen.getByText(/no description\./i)).toBeInTheDocument();
  });

  it("renders a view link when href is provided", () => {
    render(
      <CategoryCard
        {...baseProps}
        href="/storage-means/cold-room"
        viewAriaLabel="View storage mean category"
      />
    );
    const link = screen.getByRole("link", { name: /view storage mean category/i });
    expect(link).toHaveAttribute("href", "/storage-means/cold-room");
  });

  it("renders a disabled view button without href", () => {
    render(<CategoryCard {...baseProps} viewAriaLabel="View storage mean category" />);
    const viewButton = screen.getByRole("button", { name: /view storage mean category/i });
    expect(viewButton).toBeDisabled();
  });

  it("calls onEdit with id", () => {
    const onEdit = jest.fn();
    render(<CategoryCard {...baseProps} onEdit={onEdit} editAriaLabel="Edit storage mean category" />);
    fireEvent.click(screen.getByRole("button", { name: /edit storage mean category/i }));
    expect(onEdit).toHaveBeenCalledWith("cat-1");
  });

  it("calls onDelete with id via confirm modal", () => {
    const onDelete = jest.fn();
    render(
      <CategoryCard
        {...baseProps}
        onDelete={onDelete}
        deleteAriaLabel="Delete storage mean category"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onDelete).toHaveBeenCalledWith("cat-1");
  });

  it("builds default delete description with name", () => {
    render(
      <CategoryCard
        {...baseProps}
        onDelete={jest.fn()}
        deleteAriaLabel="Delete storage mean category"
      />
    );

    expect(screen.getByTestId("confirm-description")).toHaveTextContent(/delete Cold room/i);
  });

  it("uses custom delete copy", () => {
    render(
      <CategoryCard
        {...baseProps}
        onDelete={jest.fn()}
        deleteTitle="Delete storage category"
        deleteDescription="Custom delete text"
        deleteConfirmText="Remove"
        deleteCancelText="Back"
      />
    );

    expect(screen.getByTestId("confirm-title")).toHaveTextContent("Delete storage category");
    expect(screen.getByTestId("confirm-description")).toHaveTextContent("Custom delete text");
  });

  it("supports custom aria labels", () => {
    const onEdit = jest.fn();
    render(
      <CategoryCard
        {...baseProps}
        href="/categories/cold-room"
        onEdit={onEdit}
        viewAriaLabel="Open category"
        editAriaLabel="Modify category"
      />
    );

    expect(screen.getByRole("link", { name: /open category/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /modify category/i }));
    expect(onEdit).toHaveBeenCalledWith("cat-1");
  });
});
