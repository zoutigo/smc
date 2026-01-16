/** @jest-environment node */

import { createPlantAction } from "@/app/plants/actions";

const mockCreate = jest.fn();
const mockImageCreate = jest.fn();
const mockPersistUploadFile = jest.fn().mockResolvedValue({
  filename: "plant.png",
  url: "http://localhost:3000/api/uploads/plant.png",
});

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    plant: {
      findMany: jest.fn(),
      create: mockCreate,
      update: jest.fn(),
      delete: jest.fn(),
    },
    image: {
      create: mockImageCreate,
    },
  }),
}));

jest.mock("@/lib/uploads", () => ({
  persistUploadFile: (...args: unknown[]) => mockPersistUploadFile(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("createPlantAction", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ id: "new-plant" });
    mockImageCreate.mockReset();
    mockPersistUploadFile.mockClear();
  });

  it("uploads the provided image file and stores the returned url", async () => {
    const fd = new FormData();
    fd.append("name", "Paris Plant");
    fd.append("addressId", "11111111-1111-4111-8111-111111111111");
    const file = new File([Buffer.from("image-data")], "paris.png", { type: "image/png" });
    fd.append("imageFile", file);

    const result = await createPlantAction({ status: "idle" }, fd as unknown as FormData);

    expect(mockPersistUploadFile).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Paris Plant",
        address: { connect: { id: "11111111-1111-4111-8111-111111111111" } },
      }),
    });
    expect(mockImageCreate).toHaveBeenCalledWith({ data: { imageUrl: "http://localhost:3000/api/uploads/plant.png", plant: { connect: { id: "new-plant" } } } });
    expect(result.status).toBe("success");
  });
});
