/**
 * @jest-environment node
 */

const mockedPrisma = {
  storageMeanCategory: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => mockedPrisma,
}));

const deleteUploadFileByUrlMock = jest.fn();

jest.mock("@/lib/uploads", () => ({
  deleteUploadFileByUrl: (...args: unknown[]) => deleteUploadFileByUrlMock(...args),
  persistUploadFile: jest.fn(),
}));

import { deleteStorageMeanCategoryAction } from "@/app/storage-means/actions";

describe("deleteStorageMeanCategoryAction", () => {
  const categoryId = "33333333-3333-4333-8333-333333333333";

  beforeEach(() => {
    jest.clearAllMocks();
    deleteUploadFileByUrlMock.mockReset();
    (mockedPrisma.storageMeanCategory.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      image: { id: "img", imageUrl: "https://example.com/storage.png" },
    });
    (mockedPrisma.storageMeanCategory.update as jest.Mock).mockResolvedValue({ id: categoryId });
    (mockedPrisma.storageMeanCategory.delete as jest.Mock).mockResolvedValue({ id: categoryId });
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
