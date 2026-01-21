/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { MeanMultistepForm, type StepItem } from "@/components/forms/MeanMultistepForm";

describe("MeanMultistepForm", () => {
  const steps: StepItem[] = [
    {
      key: "prep",
      label: "Preparation",
      description: "Prep description",
      body: <div>Prep body</div>,
      guidance: <div>Prep guidance</div>,
      footer: <div>Prep footer</div>,
    },
    {
      key: "basics",
      label: "Basics",
      description: "Basics description",
      body: <div>Basics body</div>,
      guidance: <div>Basics guidance</div>,
      footer: <div>Basics footer</div>,
    },
    {
      key: "images",
      label: "Images",
      body: <div>Images body</div>,
      guidance: <div>Images guidance</div>,
    },
  ];

  it("renders current step content, guidance, and footer", () => {
    render(
      <MeanMultistepForm
        heroTitle="Manual transtocker Update"
        heroSubtitle="Review existing data"
        modeLabel="Edit mode"
        steps={steps}
        currentIndex={1}
      />
    );

    expect(screen.getByText(/manual transtocker update/i)).toBeInTheDocument();
    expect(screen.getByText(/review existing data/i)).toBeInTheDocument();
    expect(screen.getByText(/edit mode/i)).toBeInTheDocument();

    expect(screen.getByText("Basics description")).toBeInTheDocument();
    expect(screen.getByText("Basics body")).toBeInTheDocument();
    expect(screen.getByText("Basics guidance")).toBeInTheDocument();
    expect(screen.getByText("Basics footer")).toBeInTheDocument();

    expect(screen.getByText("Preparation")).toHaveClass("bg-emerald-500");
    expect(screen.getByText("Basics")).toHaveClass("bg-amber-500");
    expect(screen.getByText("Images")).toHaveClass("bg-transparent");
  });

  it("falls back to the first step when index is out of range and shows label when no description", () => {
    render(
      <MeanMultistepForm
        heroTitle="Create manual transtocker"
        heroSubtitle="Provide details"
        modeLabel="Create mode"
        steps={steps}
        currentIndex={10}
      />
    );

    expect(screen.getByText("Prep body")).toBeInTheDocument();

    render(
      <MeanMultistepForm
        heroTitle="Images view"
        heroSubtitle="Upload"
        modeLabel="Images"
        steps={steps}
        currentIndex={2}
      />
    );

    expect(screen.getAllByText("Images")[0]).toBeInTheDocument();
    expect(screen.getByText("Images body")).toBeInTheDocument();
    expect(screen.getByText("Images guidance")).toBeInTheDocument();
  });
});
