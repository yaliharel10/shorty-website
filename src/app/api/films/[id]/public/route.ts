export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getPublicFilm } from "@/lib/film-public";
import { apiError, handleApiError } from "@/lib/api-utils";

/** Public film metadata for share pages and discover — no auth required. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const film = await getPublicFilm(id);

    if (!film) {
      return apiError("Film not found", 404);
    }

    const { credits: _, ...rest } = film;
    return NextResponse.json({ film: rest });
  } catch (error) {
    return handleApiError(error, "Failed to load film");
  }
}
