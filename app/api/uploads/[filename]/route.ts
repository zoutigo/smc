import fs from "fs";
import path from "path";
import mime from "mime";
import { resolveUploadDir } from "@/lib/uploads";

type RouteParams = { filename?: string };
type RouteContext = { params: RouteParams } | { params: Promise<RouteParams> };

function isPromiseLike<T>(value: unknown): value is Promise<T> {
  return typeof (value as Promise<T>)?.then === "function";
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const paramsMaybePromise = context?.params;
    const params = isPromiseLike<RouteParams>(paramsMaybePromise)
      ? await paramsMaybePromise
      : (paramsMaybePromise as RouteParams | undefined);

    const rawFilename = params?.filename ?? "";
    const decoded = decodeURIComponent(rawFilename);
    const safeFilename = path.basename(decoded);
    if (!safeFilename) {
      return new Response("Missing filename", { status: 400 });
    }
    const filePath = path.join(resolveUploadDir(), safeFilename);
    if (!fs.existsSync(filePath)) return new Response("Not found", { status: 404 });
    const buf = await fs.promises.readFile(filePath);
    const type = mime.getType(filePath) || "application/octet-stream";
    return new Response(buf, { status: 200, headers: { "content-type": type } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  }
}
