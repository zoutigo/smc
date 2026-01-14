import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import Header from "../Header";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/",
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
}));

describe("Header unauthenticated login icon", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("redirects to /login when clicking the account icon while unauthenticated", () => {
    render(<Header />);

    const avatarButton = screen.getByLabelText(/account menu/i);
    expect(avatarButton.className).toContain("cursor-pointer");
    fireEvent.click(avatarButton);

    expect(pushMock).toHaveBeenCalledWith("/auth/login");
  });
});
