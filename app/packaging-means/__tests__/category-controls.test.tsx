/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryControls } from "@/app/packaging-means/[slug]/CategoryControls";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/packaging-means/picking-cart",
  useSearchParams: () => new URLSearchParams(""),
}));

describe("CategoryControls", () => {
  beforeEach(() => pushMock.mockClear());

  it("affiche le bouton Back (destructive-like) et Show hero (secondary)", () => {
    render(
      <CategoryControls
        showHero={false}
        plantId=""
        flowId=""
        plants={[{ id: "p1", name: "Plant A" }]}
        flows={[{ id: "f1", slug: "flow-a" }]}
      />
    );

    const back = screen.getByRole("link", { name: /back/i });
    const showHero = screen.getByRole("button", { name: /show hero/i });

    expect(back).toHaveClass("bg-red-50");
    expect(showHero).toHaveClass("bg-secondary");
  });

  it("déclenche un push avec showHero=1 au clic sur Show hero", () => {
    render(
      <CategoryControls
        showHero={false}
        plantId=""
        flowId=""
        plants={[]}
        flows={[]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /show hero/i }));
    expect(pushMock).toHaveBeenCalledWith("/packaging-means/picking-cart?showHero=1");
  });

  it("pousse le filtre plant", () => {
    render(
      <CategoryControls
        showHero={false}
        plantId=""
        flowId=""
        plants={[{ id: "p1", name: "Plant A" }]}
        flows={[]}
      />
    );
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "p1" } });
    expect(pushMock).toHaveBeenCalledWith("/packaging-means/picking-cart?plantId=p1");
  });

  it("pousse le filtre flow", () => {
    render(
      <CategoryControls
        showHero={false}
        plantId=""
        flowId=""
        plants={[]}
        flows={[{ id: "f1", slug: "flow-a" }]}
      />
    );
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "f1" } });
    expect(pushMock).toHaveBeenCalledWith("/packaging-means/picking-cart?flowId=f1");
  });
});
