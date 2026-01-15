import { slugifyValue } from "@/lib/utils";

describe("slugifyValue", () => {
  it("converts names to lowercase kebab case", () => {
    expect(slugifyValue("Reusable Bins")).toBe("reusable-bins");
  });

  it("removes special characters and collapses whitespace", () => {
    expect(slugifyValue("  Foam & Wraps ++ Deluxe  ")).toBe("foam-wraps-deluxe");
  });

  it("returns an empty string when nothing slugifiable remains", () => {
    expect(slugifyValue("@@@")).toBe("");
  });
});
