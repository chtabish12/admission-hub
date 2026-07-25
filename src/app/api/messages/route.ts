import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function canAccess(userId: string, role: string, applicationId: string) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) return null;
  if (role === "STUDENT") return app.studentId === userId ? app : null;
  if (role === "UNIVERSITY") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user?.universityId === app.universityId ? app : null;
  }
  return null;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("applicationId");
  if (!applicationId) {
    return NextResponse.json({ error: "applicationId required" }, { status: 400 });
  }
  const app = await canAccess(session.userId, session.role, applicationId);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { applicationId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { applicationId, senderId: { not: session.userId }, read: false },
    data: { read: true },
  });

  return NextResponse.json({ messages });
}

const postSchema = z.object({
  applicationId: z.string().min(1),
  content: z.string().trim().min(1).max(3000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const app = await canAccess(session.userId, session.role, parsed.data.applicationId);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      applicationId: parsed.data.applicationId,
      senderId: session.userId,
      content: parsed.data.content,
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({ ok: true, message });
}
