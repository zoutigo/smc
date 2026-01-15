/** @jest-environment node */

import fs from "fs";
import os from "os";
import path from "path";

import { persistUploadFile, deleteUploadFileByUrl } from "@/lib/uploads";

describe("persistUploadFile", () => {
  const previousDir = process.env.UPLOAD_IMAGES_DIR;
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "smc-uploads-"));
    process.env.UPLOAD_IMAGES_DIR = tempDir;
  });

  afterAll(() => {
    process.env.UPLOAD_IMAGES_DIR = previousDir;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("saves the file on disk and returns an accessible url", async () => {
    const file = new File([Buffer.from("plant")], "plant.png", { type: "image/png" });
    const result = await persistUploadFile(file);

    expect(fs.existsSync(path.join(tempDir, result.filename))).toBe(true);
    expect(result.url).toMatch(/^https?:\/\//);
    expect(result.url).toContain("/api/uploads/");

    await deleteUploadFileByUrl(result.url);
    expect(fs.existsSync(path.join(tempDir, result.filename))).toBe(false);
  });
});
