import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const FALLBACK_PORT = process.env.PORT || "3000";

export function resolveUploadDir() {
  const configured = process.env.UPLOAD_IMAGES_DIR?.trim();
  if (configured && configured.length > 0) return configured;
  return path.join(process.cwd(), "uploads");
}

export async function ensureUploadDirExists(dir = resolveUploadDir()) {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function buildRandomSuffix() {
  return crypto.randomBytes(6).toString("hex");
}

function safeExt(name?: string | null) {
  if (!name) return "";
  const ext = path.extname(name);
  return ext || "";
}

export function buildUploadFilename(originalName?: string) {
  const ext = safeExt(originalName);
  return `${Date.now()}-${buildRandomSuffix()}${ext}`;
}

export function getAppBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (explicit && explicit.length > 0) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${FALLBACK_PORT}`;
}

export function buildUploadUrl(filename: string) {
  const base = getAppBaseUrl();
  return new URL(`/api/uploads/${encodeURIComponent(filename)}`, base).toString();
}

export async function persistUploadFile(file: File) {
  const dir = await ensureUploadDirExists();
  const filename = buildUploadFilename(file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(path.join(dir, filename), buffer);
  return { filename, url: buildUploadUrl(filename), absolutePath: path.join(dir, filename) };
}

export function resolveUploadPath(filename: string) {
  const clean = path.basename(filename);
  return path.join(resolveUploadDir(), clean);
}

export function extractUploadFilename(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url, "http://dummy");
    const match = parsed.pathname.match(/\/api\/uploads\/(.+)$/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    if (url.startsWith("/api/uploads/")) return decodeURIComponent(url.replace("/api/uploads/", ""));
  }
  const segments = url.split("/");
  return segments.pop() || null;
}

export async function deleteUploadFileByUrl(url?: string | null) {
  const filename = extractUploadFilename(url);
  if (!filename) return;
  const filePath = resolveUploadPath(filename);
  try {
    await fs.rm(filePath);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT") {
      return;
    }
    throw error;
  }
}
