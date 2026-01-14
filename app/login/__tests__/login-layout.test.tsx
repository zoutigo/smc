import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("../actions", () => ({
  __esModule: true,
  loginAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { LoginForm } from "../login-form";

describe("Login layout", () => {
  it("renders two-column layout container", async () => {
    render(<LoginForm />);
    const grid = await screen.findByTestId("login-two-column");
    expect(grid.className).toEqual(expect.stringContaining("md:grid-cols-2"));
  });
});
