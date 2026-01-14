/**
 * @jest-environment jsdom
 */

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";

const verifyMock = jest.fn<
  Promise<{ status: "idle" | "error" | "success" }>,
  [unknown, FormData]
>();
const resetMock = jest.fn<
  Promise<{ status: "idle" | "error" | "success" }>,
  [unknown, FormData]
>();

jest.mock("../actions", () => ({
  __esModule: true,
  verifyPassRecoveryAction: (...args: Parameters<typeof verifyMock>) =>
    verifyMock(...args),
  resetPasswordAction: (...args: Parameters<typeof resetMock>) =>
    resetMock(...args),
}));

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { PassRecoveryForm } from "../pass-recovery-form";

describe("Pass recovery flow", () => {
  beforeEach(() => {
    verifyMock.mockReset();
    resetMock.mockReset();
    pushMock.mockReset();
  });

  it("verifies identity then allows password reset", async () => {
    verifyMock.mockResolvedValue({ status: "success" });
    resetMock.mockResolvedValue({ status: "success" });

    const { container } = render(<PassRecoveryForm />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/work email/i), {
        target: { value: "valery.mbele@opmobility.com" },
      });
      fireEvent.change(screen.getByLabelText(/^birth date$/i), {
        target: { value: "1990-01-01" },
      });
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^verify$/i })).not.toBeDisabled()
    );
    await act(async () => {
      fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    });

    await waitFor(() => expect(verifyMock).toHaveBeenCalled());
    expect(await screen.findByLabelText(/new password/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "Passw0rd!" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "Passw0rd!" },
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /reset password/i })).not.toBeDisabled()
    );
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    await waitFor(() => expect(resetMock).toHaveBeenCalled());
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/auth/login"));
  });
});

