import { registerAction } from "../actions";

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  }),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("registerAction server flow", () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFindUnique.mockClear();
  });

  it("creates a new user when valid and email not taken", async () => {
    mockFindUnique.mockResolvedValue(null);

    const fd = new FormData();
    fd.append("email", "valery.mbele@opmobility.com");
    fd.append("password", "Passw0rd!");
    fd.append("confirmPassword", "Passw0rd!");
    fd.append("firstName", "Valery");
    fd.append("lastName", "Mbele");
    fd.append("birthDate", "1990-01-01");

    await registerAction({ status: "idle" }, fd as unknown as FormData);

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: "valery.mbele@opmobility.com" } });
    expect(mockCreate).toHaveBeenCalled();
  });
});
