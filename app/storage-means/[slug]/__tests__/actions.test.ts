/**
 * @jest-environment node
 */

import { createStorageMeanAction, deleteStorageMeanAction, updateStorageMeanAction } from "@/app/storage-means/[slug]/actions";

const revalidatePathMock = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

const mockedPrisma = {
  storageMean: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  lane: {
    upsert: jest.fn(),
  },
  storageMeanManualTranstocker: {
    upsert: jest.fn(),
  },
  storageMeanManualTranstockerLane: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  storageMeanAutoTranstocker: {
    upsert: jest.fn(),
  },
  storageMeanAutoTranstockerLane: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  storageMeanImage: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  image: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => mockedPrisma,
}));

const persistUploadFileMock = jest.fn();

jest.mock("@/lib/uploads", () => ({
  persistUploadFile: (...args: unknown[]) => persistUploadFileMock(...args),
}));

const storageMeanId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("storage mean actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    revalidatePathMock.mockReset();
    persistUploadFileMock.mockReset();
    (mockedPrisma.storageMean.create as jest.Mock).mockResolvedValue({ id: storageMeanId });
    (mockedPrisma.storageMean.update as jest.Mock).mockResolvedValue({ id: storageMeanId });
    (mockedPrisma.storageMean.delete as jest.Mock).mockResolvedValue({ id: storageMeanId });
    (mockedPrisma.lane.upsert as jest.Mock).mockResolvedValue({ id: "lane-1" });
    (mockedPrisma.storageMeanManualTranstocker.upsert as jest.Mock).mockResolvedValue({ id: storageMeanId });
    (mockedPrisma.storageMeanAutoTranstocker.upsert as jest.Mock).mockResolvedValue({ id: storageMeanId });
    (mockedPrisma.storageMeanManualTranstockerLane.create as jest.Mock).mockResolvedValue({});
    (mockedPrisma.storageMeanAutoTranstockerLane.create as jest.Mock).mockResolvedValue({});
    (mockedPrisma.storageMeanImage.create as jest.Mock).mockResolvedValue({ id: "smi-1" });
    (mockedPrisma.storageMeanImage.deleteMany as jest.Mock).mockResolvedValue({});
    (mockedPrisma.image.create as jest.Mock).mockResolvedValue({ id: "img-new" });
    (mockedPrisma.image.deleteMany as jest.Mock).mockResolvedValue({});
    persistUploadFileMock.mockResolvedValue({ url: "https://cdn.example.com/img.png" });
  });

  const buildLanesJson = (lanes = [{ length: 100, width: 50, height: 60, quantity: 2 }]) => JSON.stringify(lanes);

  it("creates a manual storage mean with lanes and images", async () => {
    const fd = new FormData();
    fd.append("categorySlug", "manual-transtocker");
    fd.append("categoryId", "11111111-1111-4111-8111-111111111111");
    fd.append("name", "Manual SM");
    fd.append("description", "desc");
    fd.append("price", "1200");
    fd.append("status", "DRAFT");
    fd.append("plantId", "22222222-2222-4222-8222-222222222222");
    fd.append("flowId", "33333333-3333-4333-8333-333333333333");
    fd.append("supplierId", "44444444-4444-4444-8444-444444444444");
    fd.append("lanes", buildLanesJson());
    fd.append("imageFile_0", new File([new Uint8Array([1, 2, 3])], "one.png", { type: "image/png" }));

    const res = await createStorageMeanAction({ status: "idle" }, fd);

    expect(res.status).toBe("success");
    expect(mockedPrisma.storageMean.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Manual SM",
          storageMeanCategoryId: "11111111-1111-4111-8111-111111111111",
        }),
      })
    );
    expect(mockedPrisma.storageMeanManualTranstocker.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { storageMeanId: storageMeanId } })
    );
    expect(mockedPrisma.storageMeanManualTranstockerLane.deleteMany).toHaveBeenCalledWith({ where: { transtockerId: storageMeanId } });
    expect(mockedPrisma.storageMeanManualTranstockerLane.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ laneId: "lane-1", quantity: 2 }) })
    );
    expect(mockedPrisma.storageMeanImage.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ storageMeanId: storageMeanId }) })
    );
    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error when category slug is missing", async () => {
    const fd = new FormData();
    fd.append("name", "No slug");
    fd.append("categoryId", "11111111-1111-4111-8111-111111111111");
    fd.append("lanes", buildLanesJson());
    fd.append("plantId", "22222222-2222-4222-8222-222222222222");
    fd.append("price", "1200");

    const res = await createStorageMeanAction({ status: "idle" }, fd);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/missing category slug/i);
    expect(mockedPrisma.storageMean.create).not.toHaveBeenCalled();
  });

  it("returns an error when lanes are invalid", async () => {
    const fd = new FormData();
    fd.append("categorySlug", "manual-transtocker");
    fd.append("categoryId", "11111111-1111-4111-8111-111111111111");
    fd.append("name", "Bad lanes");
    fd.append("lanes", "not-json");
    fd.append("plantId", "22222222-2222-4222-8222-222222222222");
    fd.append("price", "1200");

    const res = await createStorageMeanAction({ status: "idle" }, fd);

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/invalid lanes/i);
    expect(mockedPrisma.storageMean.create).not.toHaveBeenCalled();
  });

  it("updates an auto storage mean, replacing images and lanes", async () => {
    const fd = new FormData();
    fd.append("id", storageMeanId);
    fd.append("categorySlug", "auto-transtocker");
    fd.append("categoryId", "11111111-1111-4111-8111-111111111111");
    fd.append("name", "Auto SM");
    fd.append("description", "desc");
    fd.append("price", "5000");
    fd.append("status", "DRAFT");
    fd.append("plantId", "22222222-2222-4222-8222-222222222222");
    fd.append("flowId", "33333333-3333-4333-8333-333333333333");
    fd.append("supplierId", "44444444-4444-4444-8444-444444444444");
    fd.append("plcType", "Siemens");
    fd.append("lanes", buildLanesJson([{ length: 200, width: 80, height: 70, quantity: 4 }]));
    fd.append("removeImageIds", JSON.stringify(["img-old"]));
    fd.append("imageFile_0", new File([new Uint8Array([4, 5, 6])], "two.png", { type: "image/png" }));

    const res = await updateStorageMeanAction({ status: "idle" }, fd);

    expect(res.status).toBe("success");
    expect(mockedPrisma.storageMean.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: storageMeanId } })
    );
    expect(mockedPrisma.storageMeanAutoTranstocker.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ plcType: "Siemens" }) })
    );
    expect(mockedPrisma.storageMeanAutoTranstockerLane.deleteMany).toHaveBeenCalledWith({ where: { transtockerId: storageMeanId } });
    expect(mockedPrisma.storageMeanAutoTranstockerLane.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ laneId: "lane-1", quantity: 4 }) })
    );
    expect(mockedPrisma.storageMeanImage.deleteMany).toHaveBeenCalledWith({ where: { storageMeanId: storageMeanId, imageId: { in: ["img-old"] } } });
    expect(mockedPrisma.image.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["img-old"] } } });
    expect(persistUploadFileMock).toHaveBeenCalledTimes(1);
  });

  it("returns field errors when validation fails on update", async () => {
    const fd = new FormData();
    fd.append("id", storageMeanId);
    fd.append("categorySlug", "manual-transtocker");
    fd.append("categoryId", "11111111-1111-4111-8111-111111111111");
    fd.append("name", "a");
    fd.append("lanes", buildLanesJson());

    const res = await updateStorageMeanAction({ status: "idle" }, fd);

    expect(res.status).toBe("error");
    expect(res.fieldErrors?.name).toBeDefined();
    expect(mockedPrisma.storageMean.update).not.toHaveBeenCalled();
  });

  it("deletes a storage mean", async () => {
    const res = await deleteStorageMeanAction({ status: "idle" }, storageMeanId, "manual-transtocker");

    expect(res.status).toBe("success");
    expect(mockedPrisma.storageMean.delete).toHaveBeenCalledWith({ where: { id: storageMeanId } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/storage-means");
  });

  it("surfaces errors from delete", async () => {
    (mockedPrisma.storageMean.delete as jest.Mock).mockRejectedValue(new Error("boom"));

    const res = await deleteStorageMeanAction({ status: "idle" }, storageMeanId, "manual-transtocker");

    expect(res.status).toBe("error");
    expect(res.message).toMatch(/boom/i);
  });
});
