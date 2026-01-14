/**
 * @jest-environment node
 */

const mockedPrisma = {
  plant: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
    form.append("plantName", "");
    const res = await createPlantAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors).toBeTruthy();
  });

  it("returns error when duplicate city+country", async () => {
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    (prisma.plant.findFirst as jest.Mock).mockResolvedValue({ id: "exists" });

    const form = new FormData();
    form.append("plantName", "P");
    form.append("city", "Paris");
    form.append("country", "France");
    form.append("image", "https://example.com/a.jpg");

    const res = await createPlantAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors?.city).toMatch(/already exists/i);
  });

  it("creates plant on success", async () => {
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = getPrisma();
    (prisma.plant.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.plant.create as jest.Mock).mockResolvedValue({ id: "new" });

    const form = new FormData();
    form.append("plantName", "P");
    form.append("city", "Lyon");
    form.append("country", "France");
    form.append("image", "https://example.com/a.jpg");

    const res = await createPlantAction({ status: "idle" }, form as FormData);
    expect(res.status).toBe("success");
    expect(prisma.plant.create).toHaveBeenCalled();
  });
});

describe("updatePlantAction server action", () => {
  const plantId = "11111111-1111-1111-8111-111111111111";
  const baseForm = () => {
    const form = new FormData();
    form.append("plantName", "Existing Plant");
    form.append("city", "Paris");
    form.append("country", "France");
    return form;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    persistUploadFileMock.mockReset();
    deleteUploadFileByUrlMock.mockReset();
    (mockedPrisma.plant.findFirst as jest.Mock).mockResolvedValue(null);
    (mockedPrisma.plant.update as jest.Mock).mockResolvedValue({ id: "plant" });
  });

  it("removes the previous image when removeImage is true", async () => {
    const form = baseForm();
    form.append("existingImage", "https://example.com/old.jpg");
    form.append("removeImage", "true");

    const res = await updatePlantAction({ status: "idle" }, plantId, form as FormData);

    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(persistUploadFileMock).not.toHaveBeenCalled();
    expect(res.status).toBe("success");
    expect(mockedPrisma.plant.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.plant.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data).not.toHaveProperty("image");
  });

  it("uploads a new file and deletes the old asset", async () => {
    persistUploadFileMock.mockResolvedValue({ filename: "new.png", url: "https://example.com/new.png" });
    const form = baseForm();
    form.append("existingImage", "https://example.com/old.jpg");
    form.append("removeImage", "false");
    const file = new File([Buffer.from("data")], "updated.png", { type: "image/png" });
    form.append("imageFile", file);

    const res = await updatePlantAction({ status: "idle" }, plantId, form as FormData);

    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
    expect(deleteUploadFileByUrlMock).toHaveBeenCalledWith("https://example.com/old.jpg");
    expect(res.status).toBe("success");
    expect(mockedPrisma.plant.update).toHaveBeenCalledTimes(1);
    const updateArgs = (mockedPrisma.plant.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.data.image).toBe("https://example.com/new.png");
  });
});
