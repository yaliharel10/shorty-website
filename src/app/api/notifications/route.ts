export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from "@/lib/notifications";

export async function GET() {
  try {
    const session = await requireSession();
    const [notifications, unread] = await Promise.all([
      listNotifications(session.id),
      unreadNotificationCount(session.id),
    ]);
    return NextResponse.json({ notifications, unread });
  } catch (error) {
    return handleApiError(error, "Failed to load notifications");
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    if (body.all === true) {
      await markAllNotificationsRead(session.id);
      return NextResponse.json({ ok: true });
    }

    if (body.id) {
      await markNotificationRead(session.id, body.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return handleApiError(error, "Failed to update notifications");
  }
}
