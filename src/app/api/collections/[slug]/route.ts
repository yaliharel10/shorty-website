export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCollectionBySlug, serializeCollection } from "@/lib/collections";
import { handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const collection = await getCollectionBySlug(slug);
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    return NextResponse.json({ collection: serializeCollection(collection) });
  } catch (error) {
    return handleApiError(error, "Failed to load collection");
  }
}
