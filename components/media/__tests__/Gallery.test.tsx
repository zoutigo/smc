/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { Gallery, type GalleryImage } from "@/components/media/Gallery";

const images: GalleryImage[] = [
  { id: "1", url: "https://example.com/one.png" },
  { id: "2", url: "https://example.com/two.png" },
];

describe("Gallery", () => {
  it("shows the first image and switches on thumbnail click", () => {
    render(<Gallery images={images} title="Manual transtocker" />);

    const hero = screen.getByAltText(/manual transtocker/i) as HTMLImageElement;
    expect(hero.src).toContain(images[0].url);

    const thumbnails = screen.getAllByRole("button", { name: /thumbnail/i });
    fireEvent.click(thumbnails[1]);

    expect((screen.getByAltText(/manual transtocker/i) as HTMLImageElement).src).toContain(images[1].url);
  });

  it("renders empty state when no images", () => {
    render(<Gallery images={[]} />);

    expect(screen.getByText(/no image available/i)).toBeInTheDocument();
    expect(screen.getByText(/no images\./i)).toBeInTheDocument();
  });

  it("opens and closes modal for active image", () => {
    render(<Gallery images={images} title="Gallery modal" />);

    const hero = screen.getByAltText(/gallery modal/i);
    fireEvent.click(hero.closest("div")!);

    expect(screen.getByRole("button", { name: /close image modal/i })).toBeInTheDocument();
    const modalImage = screen.getAllByAltText(/gallery modal/i).at(-1) as HTMLImageElement;
    expect(modalImage).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close image modal/i }));
    expect(screen.queryByRole("button", { name: /close image modal/i })).not.toBeInTheDocument();
  });

  it("does not open modal if there is no active image", () => {
    render(<Gallery images={[]} />);

    const mainContainer = screen.getByText(/no image available/i).parentElement as HTMLElement;
    fireEvent.click(mainContainer);

    expect(screen.queryByRole("button", { name: /close image modal/i })).not.toBeInTheDocument();
  });
});
