/** @jest-environment node */

import { createPackagingMeanNoteAction } from "@/app/packaging-means/[slug]/actions";

const mockNoteCreate = jest.fn();
const mockNoteLinkCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    note: { create: mockNoteCreate },
    noteLink: { create: mockNoteLinkCreate },
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("createPackagingMeanNoteAction", () => {
  beforeEach(() => {
    mockNoteCreate.mockReset();
    mockNoteLinkCreate.mockReset();
  });

  it("creates a note and link for packaging mean", async () => {
    const createdNote = {
      id: "note-1",
      title: "T",
      content: "C",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };
    mockNoteCreate.mockResolvedValue(createdNote);
    mockNoteLinkCreate.mockResolvedValue({});

    const fd = new FormData();
    fd.append("packagingMeanId", "22631022-2a2d-4eae-8af9-9b0dd0d0d000");
    fd.append("title", "My note");
    fd.append("content", "Details");
    fd.append("slug", "picking-cart");

    const res = await createPackagingMeanNoteAction({ status: "idle" }, fd as unknown as FormData);

    expect(res.status).toBe("success");
    expect(res.note?.id).toBe("note-1");
    expect(mockNoteCreate).toHaveBeenCalledWith({
      data: { title: "My note", content: "Details" },
    });
    expect(mockNoteLinkCreate).toHaveBeenCalledWith({
      data: {
        noteId: "note-1",
        targetId: "22631022-2a2d-4eae-8af9-9b0dd0d0d000",
        targetType: "PACKAGING_MEAN",
      },
    });
  });

  it("fails validation when title is missing", async () => {
    const fd = new FormData();
    fd.append("packagingMeanId", "11111111-1111-1111-1111-111111111111");
    fd.append("content", "Details");

    const res = await createPackagingMeanNoteAction({ status: "idle" }, fd as unknown as FormData);

    expect(res.status).toBe("error");
    expect(res.fieldErrors?.title).toBeDefined();
    expect(mockNoteCreate).not.toHaveBeenCalled();
  });

  it("fails validation when content is missing", async () => {
    const fd = new FormData();
    fd.append("packagingMeanId", "11111111-1111-1111-1111-111111111111");
    fd.append("title", "My note");

    const res = await createPackagingMeanNoteAction({ status: "idle" }, fd as unknown as FormData);

    expect(res.status).toBe("error");
    expect(res.fieldErrors?.content).toBeDefined();
    expect(mockNoteCreate).not.toHaveBeenCalled();
  });
});
