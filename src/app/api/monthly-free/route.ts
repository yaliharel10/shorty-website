export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getMonthlyFreeFilm } from "@/lib/monthly-free";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const result = await getMonthlyFreeFilm();
    if (!result) {
      return NextResponse.json({ error: "No films available" }, { status: 404 });
    }

    return NextResponse.json({
      film: result.film,
      monthKey: result.monthKey,
      monthLabel: result.monthLabel,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load monthly free film");
  }
}
