/**
 * @jest-environment node
 */

const mockedPrisma = {
  packagingMeanCategory: {
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

import { createPackagingMeanCategoryAction, updatePackagingMeanCategoryAction, deletePackagingMeanCategoryAction } from "@/app/packaging-means/actions";

describe("createPackagingMeanCategoryAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    persistUploadFileMock.mockReset();
    deleteUploadFileByUrlMock.mockReset();
    persistUploadFileMock.mockResolvedValue({ url: "https://cdn.example.com/new.png" });
  });

  it("returns fieldErrors when payload invalid", async () => {
    const form = new FormData();
    form.append("name", "");
    const res = await createPackagingMeanCategoryAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors).toBeTruthy();
  });

  it("returns error when duplicate name", async () => {
    (mockedPrisma.packagingMeanCategory.findFirst as jest.Mock).mockResolvedValue({ id: "exists" });

    const form = new FormData();
    form.append("name", "Corrugate");
    form.append("description", "A category");

    const res = await createPackagingMeanCategoryAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors?.name).toMatch(/already exists/i);
  });

  it("creates category on success", async () => {
    (mockedPrisma.packagingMeanCategory.findFirst as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.packagingMeanCategory.create as jest.Mock).mockResolvedValue({ id: "new" });

    const form = new FormData();
    form.append("name", "Crates");
    form.append("description", "Reinforced crates");

    const res = await createPackagingMeanCategoryAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("success");
    expect(mockedPrisma.packagingMeanCategory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: "crates" }),
    });
  });

  it("uploads an image when provided", async () => {
    (mockedPrisma.packagingMeanCategory.findFirst as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.packagingMeanCategory.create as jest.Mock).mockResolvedValue({ id: "new" });

    const form = new FormData();
    form.append("name", "Kits");
    form.append("description", "Kitting gear");
    form.append("imageFile", new File([Buffer.from("data")], "kits.png", { type: "image/png" }));

    const res = await createPackagingMeanCategoryAction({ status: "idle" }, form as FormData);

    expect(res.status).toBe("success");
    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.packagingMeanCategory.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: "Kits",
        description: "Kitting gear",
        image: { create: { image: { create: { imageUrl: "https://cdn.example.com/new.png" } } } },
      }),
    }));
  });
});

describe("updatePackagingMeanCategoryAction", () => {
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
    (mockedPrisma.packagingMeanCategory.findFirst as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.packagingMeanCategory.findUnique as jest.Mock).mockResolvedValue({ id: categoryId, image: { id: "img-1", image: { imageUrl: "https://example.com/old.jpg" } } });
    (mockedPrisma.packagingMeanCategory.update as jest.Mock).mockResolvedValue({ id: categoryId });
  });

  it("removes the previous image when removeImage is true", async () => {
    const form = baseForm();
    form.append("removeImage", "true");

    const res = await updatePackagingMeanCategoryAction({ status: "idle" }, categoryId, form as FormData);

    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(persistUploadFileMock).not.toHaveBeenCalled();
    expect(res.status).toBe("success");
    expect(mockedPrisma.packagingMeanCategory.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.packagingMeanCategory.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.slug).toBe("returnables");
    expect(updateArgs.data.image).toEqual({ delete: true });
  });

  it("uploads a new file and deletes the old asset", async () => {
    persistUploadFileMock.mockResolvedValue({ filename: "new.png", url: "https://example.com/new.png" });
    const form = baseForm();
    form.append("removeImage", "false");
    const file = new File([Buffer.from("data")], "updated.png", { type: "image/png" });
    form.append("imageFile", file);

    const res = await updatePackagingMeanCategoryAction({ status: "idle" }, categoryId, form as FormData);

    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(res.status).toBe("success");
    expect(mockedPrisma.packagingMeanCategory.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.packagingMeanCategory.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.image).toEqual({ update: { image: { update: { imageUrl: "https://example.com/new.png" } } } });
    expect(updateArgs.data.slug).toBe("returnables");
  });
});

describe("deletePackagingMeanCategoryAction", () => {
  const categoryId = "22222222-2222-4222-8222-222222222222";

  beforeEach(() => {
    jest.clearAllMocks();
    deleteUploadFileByUrlMock.mockReset();
    (mockedPrisma.packagingMeanCategory.findUnique as jest.Mock).mockResolvedValue({
      id: categoryId,
      image: { id: "img", image: { imageUrl: "https://example.com/image.png" } },
    });
    (mockedPrisma.packagingMeanCategory.delete as jest.Mock).mockResolvedValue({ id: categoryId });
    (mockedPrisma.packagingMeanCategory.update as jest.Mock).mockResolvedValue({ id: categoryId });
  });

  it("removes the stored image before deleting the category", async () => {
    const res = await deletePackagingMeanCategoryAction({ status: "idle" }, categoryId);

    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/image.png");
    expect(mockedPrisma.packagingMeanCategory.update).toHaveBeenCalledWith({ where: { id: categoryId }, data: { image: { delete: true } } });
    expect(mockedPrisma.packagingMeanCategory.delete).toHaveBeenCalledWith({ where: { id: categoryId } });
    expect(res.status).toBe("success");
  });

  it("skips image deletion when no imageUrl is present", async () => {
    (mockedPrisma.packagingMeanCategory.findUnique as jest.Mock).mockResolvedValue({ id: categoryId, image: null });

    const res = await deletePackagingMeanCategoryAction({ status: "idle" }, categoryId);

    expect(deleteUploadFileByUrlMock).not.toHaveBeenCalled();
    expect(mockedPrisma.packagingMeanCategory.update).toHaveBeenCalledWith({ where: { id: categoryId }, data: { image: undefined } });
    expect(mockedPrisma.packagingMeanCategory.delete).toHaveBeenCalledTimes(1);
    expect(res.status).toBe("success");
  });

  it("returns an error when the category does not exist", async () => {
    (mockedPrisma.packagingMeanCategory.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await deletePackagingMeanCategoryAction({ status: "idle" }, categoryId);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/not found/i);
    expect(mockedPrisma.packagingMeanCategory.delete).not.toHaveBeenCalled();
  });

  it("surfaces image deletion failures", async () => {
    deleteUploadFileByUrlMock.mockRejectedValue(new Error("fs error"));

    const res = await deletePackagingMeanCategoryAction({ status: "idle" }, categoryId);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/delete category image/i);
    expect(mockedPrisma.packagingMeanCategory.delete).not.toHaveBeenCalled();
  });
});
