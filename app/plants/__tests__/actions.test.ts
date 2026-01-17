/**
 * @jest-environment node
 */

const mockedPrisma = {
  plant: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  image: {
    create: jest.fn(),
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

import { createPlantAction, updatePlantAction } from "@/app/plants/actions";

describe("createPlantAction server action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns fieldErrors when payload invalid", async () => {
    const form = new FormData();
    form.append("name", "");
    const res = await createPlantAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors).toBeTruthy();
  });

  it("creates plant on success", async () => {
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    (prisma.plant.create as jest.Mock).mockResolvedValue({ id: "new" });
    (prisma.image.create as jest.Mock).mockResolvedValue({ id: "img" });

    const form = new FormData();
    form.append("name", "P");
    form.append("addressId", "11111111-1111-4111-8111-111111111111");
    form.append("imageUrl", "https://example.com/a.jpg");

    const res = await createPlantAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("success");
    expect(prisma.plant.create).toHaveBeenCalled();
    expect((prisma.plant.create as jest.Mock).mock.calls[0][0].data).toMatchObject({
      name: "P",
      address: { connect: { id: "11111111-1111-4111-8111-111111111111" } },
      images: {
        create: [
          {
            sortOrder: 0,
            image: { create: { imageUrl: "https://example.com/a.jpg" } },
          },
        ],
      },
    });
  });
});

describe("updatePlantAction server action", () => {
  const plantId = "11111111-1111-1111-8111-111111111111";
  const baseForm = () => {
    const form = new FormData();
    form.append("name", "Existing Plant");
    return form;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    persistUploadFileMock.mockReset();
    deleteUploadFileByUrlMock.mockReset();
    (mockedPrisma.plant.findUnique as jest.Mock).mockResolvedValue({
      id: plantId,
      images: [{ plantId, imageId: "img-1", image: { imageUrl: "https://example.com/old.jpg" } }],
    });
    (mockedPrisma.plant.update as jest.Mock).mockResolvedValue({ id: "plant" });
  });

  it("removes the previous image when removeImage is true", async () => {
    const form = baseForm();
    form.append("removeImage", "true");

    const res = await updatePlantAction({ status: "idle" }, plantId, form as FormData);

    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(persistUploadFileMock).not.toHaveBeenCalled();
    expect(res.status).toBe("success");
    expect(mockedPrisma.plant.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.plant.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.images).toEqual({ delete: { plantId_imageId: { plantId, imageId: "img-1" } } });
  });

  it("uploads a new file and deletes the old asset", async () => {
    persistUploadFileMock.mockResolvedValue({ filename: "new.png", url: "https://example.com/new.png" });
    const form = baseForm();
    form.append("removeImage", "false");
    const file = new File([Buffer.from("data")], "updated.png", { type: "image/png" });
    form.append("imageFile", file);

    const res = await updatePlantAction({ status: "idle" }, plantId, form as FormData);

    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(res.status).toBe("success");
    expect(mockedPrisma.plant.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.plant.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.images).toEqual({ update: { where: { plantId_imageId: { plantId, imageId: "img-1" } }, data: { image: { update: { imageUrl: "https://example.com/new.png" } } } } });
  });
});
