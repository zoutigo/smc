/** @jest-environment node */

import { createPlantAction } from "@/app/plants/actions";

const mockCreate = jest.fn();
const mockFindFirst = jest.fn();
const mockPersistUploadFile = jest.fn().mockResolvedValue({
  filename: "plant.png",
  url: "http://localhost:3000/api/uploads/plant.png",
});

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    plant: {
      findMany: jest.fn(),
      findFirst: mockFindFirst,
      create: mockCreate,
      update: jest.fn(),
      delete: jest.fn(),
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
    mockFindFirst.mockReset();
    mockPersistUploadFile.mockClear();
  });

  it("uploads the provided image file and stores the returned url", async () => {
    mockFindFirst.mockResolvedValue(null);

    const fd = new FormData();
    fd.append("plantName", "Paris Plant");
    fd.append("city", "Paris");
    fd.append("country", "France");
    fd.append("address", "Champs-Elysees");
    const file = new File([Buffer.from("image-data")], "paris.png", { type: "image/png" });
    fd.append("imageFile", file);

    const result = await createPlantAction({ status: "idle" }, fd as unknown as FormData);

    expect(mockPersistUploadFile).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        plantName: "Paris Plant",
        image: "http://localhost:3000/api/uploads/plant.png",
      }),
    });
    expect(result.status).toBe("success");
  });
});
