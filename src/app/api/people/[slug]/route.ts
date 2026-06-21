export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const person = await prisma.person.findUnique({
      where: { slug },
      include: {
        credits: {
          include: {
            film: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
                category: true,
                year: true,
                rating: true,
                duration: true,
              },
            },
          },
          orderBy: { film: { year: "desc" } },
        },
      },
    });

    if (!person) {
      return apiError("Person not found", 404);
    }

    return NextResponse.json({ person });
  } catch (error) {
    return handleApiError(error, "Failed to load profile");
  }
}
