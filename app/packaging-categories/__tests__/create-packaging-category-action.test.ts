/** @jest-environment node */

import { createPackagingCategoryAction } from "@/app/packaging-categories/actions";

const mockCreate = jest.fn();
const mockFindFirst = jest.fn();
const mockPersistUploadFile = jest.fn().mockResolvedValue({
  filename: "category.png",
  url: "http://localhost:3000/api/uploads/category.png",
});

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    packagingCategory: {
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

describe("createPackagingCategoryAction", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockFindFirst.mockReset();
    mockPersistUploadFile.mockClear();
  });

  it("uploads the provided image file and stores returned url", async () => {
    mockFindFirst.mockResolvedValue(null);

    const fd = new FormData();
    fd.append("name", "Insulated boxes");
    fd.append("description", "Foam insulated cardboard");
    const file = new File([Buffer.from("image-data")], "insulated.png", { type: "image/png" });
    fd.append("imageFile", file);

    const result = await createPackagingCategoryAction({ status: "idle" }, fd as unknown as FormData);

    expect(mockPersistUploadFile).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Insulated boxes",
        imageUrl: "http://localhost:3000/api/uploads/category.png",
      }),
    });
    expect(result.status).toBe("success");
  });
});
