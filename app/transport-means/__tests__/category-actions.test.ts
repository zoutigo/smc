/** @jest-environment node */

import { updateTransportMeanCategoryAction } from "@/app/transport-means/actions";

const mockFindFirst = jest.fn();
const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    transportMeanCategory: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  }),
}));

jest.mock("@/lib/uploads", () => ({
  persistUploadFile: jest.fn(),
  deleteUploadFileByUrl: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("updateTransportMeanCategoryAction", () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
  });

  it("updates a transport category with a new slug", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockFindUnique.mockResolvedValue({
      id: "11111111-2222-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Old Name",
      slug: "old-name",
      description: "Old description",
      image: null,
    });
    mockUpdate.mockResolvedValue({ id: "category-1" });

    const formData = new FormData();
    formData.append("name", "New Name");
    formData.append("description", "Updated description");

    const res = await updateTransportMeanCategoryAction({ status: "idle" }, "11111111-2222-4aaa-8aaa-aaaaaaaaaaaa", formData);

    expect(res.status).toBe("success");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "11111111-2222-4aaa-8aaa-aaaaaaaaaaaa" },
      data: expect.objectContaining({
        name: "New Name",
        description: "Updated description",
        slug: "new-name",
      }),
    }));
  });

  it("returns validation errors when input is invalid", async () => {
    const formData = new FormData();
    formData.append("name", "A");
    formData.append("description", "abc");

    const res = await updateTransportMeanCategoryAction({ status: "idle" }, "category-1", formData);

    expect(res.status).toBe("error");
    expect(res.fieldErrors?.name).toBeDefined();
    expect(res.fieldErrors?.description).toBeDefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
