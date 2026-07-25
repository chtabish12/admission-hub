import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { STAGE_KEYS, stageOf, OFFER_STAGES } from "@/lib/application-stages";

const patchSchema = z.object({
  status: z.enum(STAGE_KEYS as [string, ...string[]]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  universityNotes: z.string().trim().max(4000).optional(),
  message: z.string().trim().max(500).optional(),
});

async function loadForSession(id: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated", status: 401 as const };

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      university: { select: { id: true, name: true, city: true, country: true } },
      events: { orderBy: { createdAt: "asc" } },
      requirements: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!app) return { error: "Not found", status: 404 as const };

  if (session.role === "UNIVERSITY") {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user?.universityId !== app.universityId) {
      return { error: "Forbidden", status: 403 as const };
    }
    return { session, app, isUniversity: true };
  }

  if (app.studentId !== session.userId) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { session, app, isUniversity: false };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await loadForSession(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ application: result.app });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await loadForSession(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { session, app, isUniversity } = result;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { status, priority, universityNotes, message } = parsed.data;

  if (!isUniversity) {
    if (status !== "student_accepted" || !OFFER_STAGES.includes(app.status)) {
      return NextResponse.json(
        { error: "You can only accept an offer" },
        { status: 403 }
      );
    }
    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "student_accepted",
        events: {
          create: {
            type: "STAGE_CHANGE",
            message: "Student accepted the offer 🎉",
            actor: session.name,
          },
        },
      },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  const data: { status?: string; priority?: string; universityNotes?: string } = {};
  const events: { type: string; message: string; actor: string }[] = [];

  if (status && status !== app.status) {
    data.status = status;
    events.push({
      type: "STAGE_CHANGE",
      message: message || `Moved to ${stageOf(status).label}`,
      actor: session.name,
    });
  }
  if (priority) {
    data.priority = priority;
  }
  if (universityNotes !== undefined) {
    data.universityNotes = universityNotes;
  }
  if (message && !status) {
    events.push({ type: "NOTE", message, actor: session.name });
  }

  if (Object.keys(data).length === 0 && events.length === 0) {
    return NextResponse.json({ ok: true, status: app.status });
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      ...data,
      ...(events.length > 0 ? { events: { create: events } } : {}),
    },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
