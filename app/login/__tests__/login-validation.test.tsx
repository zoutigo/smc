import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("../actions", () => ({
  __esModule: true,
  loginAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { LoginForm } from "../login-form";

describe("Login validation", () => {
  it("shows Zod errors on change for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // wait for initial mount updates from react-hook-form to settle
    await screen.findByTestId("login-two-column");

    const email = screen.getByLabelText(/work email/i);
    await user.clear(email);
    await user.type(email, "foo@bar.com");
    await user.tab();
    expect((email as HTMLInputElement).value).toBe("foo@bar.com");

    expect(await screen.findByTestId("login-email-error", {}, { timeout: 500 })).toBeInTheDocument();
  });
});
