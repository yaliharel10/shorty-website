export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import {
  listUserSessions,
  revokeOtherSessions,
  revokeSessionById,
} from "@/lib/sessions";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const devices = await listUserSessions(session.id, session.sessionId);
    return NextResponse.json({ devices });
  } catch (error) {
    return handleApiError(error, "Failed to load devices");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json().catch(() => ({}));
    const { sessionId, revokeOthers } = body as {
      sessionId?: string;
      revokeOthers?: boolean;
    };

    if (revokeOthers) {
      const result = await revokeOtherSessions(
        session.id,
        session.sessionId || ""
      );
      return NextResponse.json({
        message: `Signed out ${result.count} other device${result.count === 1 ? "" : "s"}`,
        revoked: result.count,
      });
    }

    if (!sessionId) {
      return apiError("Session id required", 400);
    }

    const target = await listUserSessions(session.id, session.sessionId);
    const device = target.find((d) => d.id === sessionId);
    if (!device) {
      return apiError("Device not found", 404);
    }

    if (device.isCurrent) {
      return apiError("Use Log out to sign out this device", 400);
    }

    await revokeSessionById(sessionId, session.id);
    return NextResponse.json({ message: "Device signed out" });
  } catch (error) {
    return handleApiError(error, "Failed to revoke device");
  }
}
