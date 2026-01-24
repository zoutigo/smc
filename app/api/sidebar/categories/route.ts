import { NextResponse } from "next/server";

import { getPackagingMeanCategories } from "@/app/packaging-means/actions";
import { getStorageMeanCategories } from "@/app/storage-means/actions";
import { getTransportMeanCategories } from "@/app/transport-means/actions";

const toSafe = (items: Array<{ id: string; name: string; slug: string }> | null | undefined) =>
  (items ?? [])
    .filter((c) => Boolean(c.slug))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

export async function GET() {
  try {
    const [storage, packaging, transport] = await Promise.all([
      getStorageMeanCategories(),
      getPackagingMeanCategories(),
      getTransportMeanCategories(),
    ]);

    return NextResponse.json({
      storageCategories: toSafe(storage),
      packagingCategories: toSafe(packaging),
      transportCategories: toSafe(transport),
    });
  } catch (error) {
    console.error("Sidebar categories API failed", error);
    return NextResponse.json({ storageCategories: [], packagingCategories: [], transportCategories: [] }, { status: 200 });
  }
}
