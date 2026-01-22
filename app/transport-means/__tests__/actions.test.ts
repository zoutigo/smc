/** @jest-environment node */

import { createTransportMeanAction } from "@/app/transport-means/[slug]/actions";

const mockCreate = jest.fn();
const mockPackagingLinkCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    transportMean: {
      create: mockCreate,
    },
    transportMeanPackagingMean: {
      create: mockPackagingLinkCreate,
      deleteMany: jest.fn(),
    },
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("createTransportMeanAction", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockPackagingLinkCreate.mockReset();
  });

  it("creates a transport mean with slug and packaging links", async () => {
    mockCreate.mockResolvedValue({ id: "tm-1", slug: "agv-shuttle" });
    const fd = new FormData();
    fd.append("name", "AGV Shuttle");
    fd.append("description", "desc");
    fd.append("transportMeanCategoryId", "11111111-2222-4aaa-8aaa-aaaaaaaaaaaa");
    fd.append("plantId", "22222222-3333-4bbb-8bbb-bbbbbbbbbbbb");
    fd.append("supplierId", "33333333-4444-4ccc-8ccc-cccccccccccc");
    fd.append("units", "2");
    fd.append("loadCapacityKg", "800");
    fd.append("cruiseSpeedKmh", "6");
    fd.append("maxSpeedKmh", "10");
    fd.append("packagingLinks", JSON.stringify([{ packagingMeanId: "44444444-5555-4ddd-8ddd-dddddddddddd", maxQty: 2 }]));

    const res = await createTransportMeanAction({ status: "idle" }, fd as unknown as FormData);
    expect(res.status).toBe("success");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "AGV Shuttle",
          slug: expect.any(String),
          plantId: "22222222-3333-4bbb-8bbb-bbbbbbbbbbbb",
        }),
      })
    );
    expect(mockPackagingLinkCreate).toHaveBeenCalledWith({
      data: { transportMeanId: "tm-1", packagingMeanId: "44444444-5555-4ddd-8ddd-dddddddddddd", maxQty: 2 },
    });
  });

  it("returns validation errors when required fields are missing", async () => {
    const fd = new FormData();
    fd.append("name", "No plant");
    const res = await createTransportMeanAction({ status: "idle" }, fd as unknown as FormData);
    expect(res.status).toBe("error");
    expect(res.fieldErrors?.transportMeanCategoryId).toBeDefined();
    expect(res.fieldErrors?.plantId).toBeDefined();
  });
});
