import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("../actions", () => ({
  __esModule: true,
  registerAction: jest.fn(),
}));

import { RegisterForm } from "../register-form";

describe("Register layout", () => {
  it("renders two-column layout container", async () => {
    render(<RegisterForm />);
    const grid = await screen.findByTestId("register-two-column");
    expect(grid.className).toEqual(expect.stringContaining("md:grid-cols-2"));
  });
});
