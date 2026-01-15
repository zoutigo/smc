/**
 * @jest-environment node
 */

const mockedPrisma = {
  packagingCategory: {
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

const persistUploadFileMock = jest.fn();
const deleteUploadFileByUrlMock = jest.fn();

jest.mock("@/lib/uploads", () => ({
  persistUploadFile: (...args: unknown[]) => persistUploadFileMock(...args),
  deleteUploadFileByUrl: (...args: unknown[]) => deleteUploadFileByUrlMock(...args),
}));

import { createPackagingCategoryAction, updatePackagingCategoryAction, deletePackagingCategoryAction } from "@/app/packaging-means/actions";

describe("createPackagingCategoryAction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns fieldErrors when payload invalid", async () => {
    const form = new FormData();
    form.append("name", "");
    const res = await createPackagingCategoryAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors).toBeTruthy();
  });

  it("returns error when duplicate name", async () => {
    (mockedPrisma.packagingCategory.findFirst as jest.Mock).mockResolvedValue({ id: "exists" });

    const form = new FormData();
    form.append("name", "Corrugate");
    form.append("description", "A category");

    const res = await createPackagingCategoryAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors?.name).toMatch(/already exists/i);
  });

  it("creates category on success", async () => {
    (mockedPrisma.packagingCategory.findFirst as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.packagingCategory.create as jest.Mock).mockResolvedValue({ id: "new" });

    const form = new FormData();
    form.append("name", "Crates");
    form.append("description", "Reinforced crates");

    const res = await createPackagingCategoryAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("success");
    expect(mockedPrisma.packagingCategory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: "crates" }),
    });
  });
});

describe("updatePackagingCategoryAction", () => {
  const categoryId = "11111111-1111-1111-8111-111111111111";
  const baseForm = () => {
    const form = new FormData();
    form.append("name", "Returnables");
    form.append("description", "Reusable crates");
    return form;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    persistUploadFileMock.mockReset();
    deleteUploadFileByUrlMock.mockReset();
    (mockedPrisma.packagingCategory.findFirst as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.packagingCategory.update as jest.Mock).mockResolvedValue({ id: categoryId });
  });

  it("removes the previous image when removeImage is true", async () => {
    const form = baseForm();
    form.append("existingImageUrl", "https://example.com/old.jpg");
    form.append("removeImage", "true");

    const res = await updatePackagingCategoryAction({ status: "idle" }, categoryId, form as FormData);

    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(persistUploadFileMock).not.toHaveBeenCalled();
    expect(res.status).toBe("success");
    expect(mockedPrisma.packagingCategory.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.packagingCategory.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.slug).toBe("returnables");
    expect(updateArgs.data.imageUrl).toBeNull();
  });

  it("uploads a new file and deletes the old asset", async () => {
    persistUploadFileMock.mockResolvedValue({ filename: "new.png", url: "https://example.com/new.png" });
    const form = baseForm();
    form.append("existingImageUrl", "https://example.com/old.jpg");
    form.append("removeImage", "false");
    const file = new File([Buffer.from("data")], "updated.png", { type: "image/png" });
    form.append("imageFile", file);

    const res = await updatePackagingCategoryAction({ status: "idle" }, categoryId, form as FormData);

    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(res.status).toBe("success");
    expect(mockedPrisma.packagingCategory.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.packagingCategory.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.imageUrl).toBe("https://example.com/new.png");
    expect(updateArgs.data.slug).toBe("returnables");
  });
});

describe("deletePackagingCategoryAction", () => {
  const categoryId = "22222222-2222-4222-8222-222222222222";

  beforeEach(() => {
    jest.clearAllMocks();
    deleteUploadFileByUrlMock.mockReset();
    (mockedPrisma.packagingCategory.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      imageUrl: "https://example.com/image.png",
    });
    (mockedPrisma.packagingCategory.delete as jest.Mock).mockResolvedValue({ id: categoryId });
  });

  it("removes the stored image before deleting the category", async () => {
    const res = await deletePackagingCategoryAction({ status: "idle" }, categoryId);

    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/image.png");
    expect(mockedPrisma.packagingCategory.delete).toHaveBeenCalledWith({ where: { id: categoryId } });
    expect(res.status).toBe("success");
  });

  it("skips image deletion when no imageUrl is present", async () => {
    (mockedPrisma.packagingCategory.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      imageUrl: null,
    });

    const res = await deletePackagingCategoryAction({ status: "idle" }, categoryId);

    expect(deleteUploadFileByUrlMock).not.toHaveBeenCalled();
    expect(mockedPrisma.packagingCategory.delete).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("success");
  });

  it("returns an error when the category does not exist", async () => {
    (mockedPrisma.packagingCategory.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await deletePackagingCategoryAction({ status: "idle" }, categoryId);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/not found/i);
    expect(mockedPrisma.packagingCategory.delete).not.toHaveBeenCalled();
  });

  it("surfaces image deletion failures", async () => {
    deleteUploadFileByUrlMock.mockRejectedValue(new Error("fs error"));

    const res = await deletePackagingCategoryAction({ status: "idle" }, categoryId);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/delete category image/i);
    expect(mockedPrisma.packagingCategory.delete).not.toHaveBeenCalled();
  });
});
