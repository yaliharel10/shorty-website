export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getFeaturedCollections, serializeCollection } from "@/lib/collections";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const collections = await getFeaturedCollections(12);
    return NextResponse.json({
      collections: collections.map(serializeCollection),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load collections");
  }
}
