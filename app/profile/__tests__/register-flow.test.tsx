import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "../register-form";

jest.mock("../actions", () => ({
  __esModule: true,
  registerAction: jest.fn(),
}));

describe.skip("Register flow", () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { fetch?: unknown }).fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("submits the register form and calls network", async () => {
    const { getByLabelText, container } = render(<RegisterForm />);

    const email = getByLabelText(/work email/i) as HTMLInputElement;
    const firstName = getByLabelText(/first name/i) as HTMLInputElement;
    const lastName = getByLabelText(/last name/i) as HTMLInputElement;
    const password = getByLabelText(/^password$/i) as HTMLInputElement;
    const confirm = getByLabelText(/confirm password/i) as HTMLInputElement;
    const birthDate = getByLabelText(/birth date/i) as HTMLInputElement;
    fireEvent.change(email, { target: { value: "valery.mbele@opmobility.com" } });
    fireEvent.change(firstName, { target: { value: "Valery" } });
    fireEvent.change(lastName, { target: { value: "Mbele" } });
    fireEvent.change(password, { target: { value: "Passw0rd!" } });
    fireEvent.change(confirm, { target: { value: "Passw0rd!" } });
    fireEvent.change(birthDate, { target: { value: "1990-01-01" } });

    const form = container.querySelector("form");
    if (!form) throw new Error("Form not found");
    fireEvent.submit(form);

    await waitFor(() =>
      expect((globalThis as typeof globalThis & { fetch?: jest.Mock }).fetch).toHaveBeenCalled()
    );
  });
});
