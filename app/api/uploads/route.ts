import { persistUploadFile } from "@/lib/uploads";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });

    const { url } = await persistUploadFile(file);
    return new Response(JSON.stringify({ url }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to upload";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export const GET = () => new Response(null, { status: 405 });
