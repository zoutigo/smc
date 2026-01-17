/**
 * @jest-environment node
 */

const mockedPrisma = {
  storageMeanCategory: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => mockedPrisma,
}));

const deleteUploadFileByUrlMock = jest.fn();
const persistUploadFileMock = jest.fn();

jest.mock("@/lib/uploads", () => ({
  deleteUploadFileByUrl: (...args: unknown[]) => deleteUploadFileByUrlMock(...args),
  persistUploadFile: (...args: unknown[]) => persistUploadFileMock(...args),
}));

import { createStorageMeanCategoryAction, updateStorageMeanCategoryAction, deleteStorageMeanCategoryAction } from "@/app/storage-means/actions";

describe("deleteStorageMeanCategoryAction", () => {
  const categoryId = "33333333-3333-4333-8333-333333333333";

  beforeEach(() => {
    jest.clearAllMocks();
    persistUploadFileMock.mockReset();
    deleteUploadFileByUrlMock.mockReset();
    (mockedPrisma.storageMeanCategory.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      image: { id: "img", image: { imageUrl: "https://example.com/storage.png" } },
    });
    (mockedPrisma.storageMeanCategory.findFirst as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.storageMeanCategory.create as jest.Mock).mockResolvedValue({ id: categoryId });
    (mockedPrisma.storageMeanCategory.update as jest.Mock).mockResolvedValue({ id: categoryId });
    (mockedPrisma.storageMeanCategory.delete as jest.Mock).mockResolvedValue({ id: categoryId });
    persistUploadFileMock.mockResolvedValue({ url: "https://cdn.example.com/new.png" });
  });

  it("creates a category with an uploaded image", async () => {
    const formData = new FormData();
    formData.append("name", "Cold storage");
    formData.append("description", "Chilled rooms");
    formData.append("imageFile", new File([Buffer.from("img")], "cold.png", { type: "image/png" }));

    const res = await createStorageMeanCategoryAction({ status: "idle" }, formData);

    expect(res.status).toBe("success");
    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.storageMeanCategory.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: "Cold storage",
        description: "Chilled rooms",
        image: { create: { image: { create: { imageUrl: "https://cdn.example.com/new.png" } } } },
      }),
    }));
  });

  it("replaces an existing image when updating", async () => {
    const categoryId = "44444444-4444-4444-8444-444444444444";
    (mockedPrisma.storageMeanCategory.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      name: "Old",
      description: "Old desc",
      slug: "old",
      image: { image: { imageUrl: "https://cdn.example.com/old.png" } },
    });

    const formData = new FormData();
    formData.append("name", "Updated name");
    formData.append("description", "Updated desc");
    formData.append("imageFile", new File([Buffer.from("img")], "new.png", { type: "image/png" }));

    const res = await updateStorageMeanCategoryAction({ status: "idle" }, categoryId, formData);

    expect(res.status).toBe("success");
    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://cdn.example.com/old.png");
    expect(mockedPrisma.storageMeanCategory.update).toHaveBeenCalledWith({
      where: { id: categoryId },
      data: expect.objectContaining({
        name: "Updated name",
        description: "Updated desc",
        image: { update: { image: { update: { imageUrl: "https://cdn.example.com/new.png" } } } },
      }),
    });
  });

  it("removes an existing image when requested", async () => {
    const categoryId = "55555555-5555-4555-8555-555555555555";
    (mockedPrisma.storageMeanCategory.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      name: "With image",
      description: "Has image",
      slug: "with-image",
      image: { image: { imageUrl: "https://cdn.example.com/old.png" } },
    });

    const formData = new FormData();
    formData.append("name", "With image");
    formData.append("description", "Has image");
    formData.append("removeImage", "true");

    const res = await updateStorageMeanCategoryAction({ status: "idle" }, categoryId, formData);

    expect(res.status).toBe("success");
    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://cdn.example.com/old.png");
    expect(mockedPrisma.storageMeanCategory.update).toHaveBeenCalledWith({
      where: { id: categoryId },
      data: expect.objectContaining({
        image: { delete: true },
      }),
    });
  });

  it("removes the stored image before deleting the category", async () => {
    const res = await deleteStorageMeanCategoryAction({ status: "idle" }, categoryId);

    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/storage.png");
    expect(mockedPrisma.storageMeanCategory.update).toHaveBeenCalledWith({ where: { id: categoryId }, data: { image: { delete: true } } });
    expect(mockedPrisma.storageMeanCategory.delete).toHaveBeenCalledWith({ where: { id: categoryId } });
    expect(res.status).toBe("success");
  });

  it("skips image deletion when no imageUrl is present", async () => {
    (mockedPrisma.storageMeanCategory.findUnique as jest.Mock).mockResolvedValue({ id: categoryId, image: null });

    const res = await deleteStorageMeanCategoryAction({ status: "idle" }, categoryId);

    expect(deleteUploadFileByUrlMock).not.toHaveBeenCalled();
    expect(mockedPrisma.storageMeanCategory.update).toHaveBeenCalledWith({ where: { id: categoryId }, data: { image: undefined } });
    expect(mockedPrisma.storageMeanCategory.delete).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("success");
  });

  it("returns an error when the category does not exist", async () => {
    (mockedPrisma.storageMeanCategory.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await deleteStorageMeanCategoryAction({ status: "idle" }, categoryId);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/not found/i);
    expect(mockedPrisma.storageMeanCategory.delete).not.toHaveBeenCalled();
  });

  it("surfaces image deletion failures", async () => {
    deleteUploadFileByUrlMock.mockRejectedValue(new Error("fs error"));

    const res = await deleteStorageMeanCategoryAction({ status: "idle" }, categoryId);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/delete storage category image/i);
    expect(mockedPrisma.storageMeanCategory.delete).not.toHaveBeenCalled();
  });
});
