import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";

const pushMock = jest.fn();
const signInMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

import { LoginForm } from "../login-form";

describe("Login flow", () => {
  beforeEach(() => {
    pushMock.mockClear();
    signInMock.mockClear();
  });

  it("calls signIn and redirects on success", async () => {
    signInMock.mockResolvedValue({});

    render(<LoginForm />);

    const email = screen.getByLabelText(/work email/i);
    const password = screen.getByLabelText(/password/i);
    const button = screen.getByRole("button", { name: /sign in/i });

    await act(async () => {
      fireEvent.change(email, { target: { value: "valery.mbele@opmobility.com" } });
      fireEvent.change(password, { target: { value: "Passw0rd!" } });
      const form = button.closest("form") as HTMLFormElement;
      fireEvent.submit(form);
    });

    await waitFor(() => expect(signInMock).toHaveBeenCalled(), { timeout: 1000 });
    expect(signInMock).toHaveBeenCalledWith("credentials", expect.objectContaining({
      redirect: false,
      email: "valery.mbele@opmobility.com",
      password: "Passw0rd!",
    }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));
  });
});
