/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

import { LoginForm } from "../login-form";

describe("Login forgot password link", () => {
  it("links to pass recovery page", async () => {
    render(<LoginForm />);
    await screen.findByTestId("login-two-column");
    const link = screen.getByRole("link", { name: /forgot password/i });
    expect(link).toHaveAttribute("href", "/auth/pass-recovery");
  });
});

