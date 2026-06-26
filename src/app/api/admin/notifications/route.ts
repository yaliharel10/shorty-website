export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminNotificationSchema } from "@/lib/admin-validation";

export async function GET() {
  try {
    await requireAdmin();
    const [recent, total] = await Promise.all([
      prisma.notification.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { username: true, email: true } } },
      }),
      prisma.notification.count(),
    ]);
    return NextResponse.json({ notifications: recent, total });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = adminNotificationSchema.parse(await request.json());

    if (data.userId) {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          href: data.href ?? null,
        },
      });
      return NextResponse.json({ sent: 1, notification });
    }

    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: data.type,
        title: data.title,
        body: data.body,
        href: data.href ?? null,
      })),
    });
    return NextResponse.json({ sent: users.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
