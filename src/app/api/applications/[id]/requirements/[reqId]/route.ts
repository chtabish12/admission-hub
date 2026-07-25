import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  documentName: z.string().trim().min(1).max(120).optional(),
  documentUrl: z.string().url().optional(),
  status: z.enum(["pending", "submitted", "approved", "rejected"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  const { id, reqId } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const requirement = await prisma.applicationRequirement.findUnique({
    where: { id: reqId },
    include: { application: true },
  });
  if (!requirement || requirement.applicationId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const app = requirement.application;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  if (session.role === "STUDENT") {
    if (app.studentId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!d.documentUrl) {
      return NextResponse.json({ error: "Provide a document link" }, { status: 400 });
    }
    const updated = await prisma.applicationRequirement.update({
      where: { id: reqId },
      data: {
        documentUrl: d.documentUrl,
        documentName: d.documentName || requirement.title,
        status: "submitted",
      },
    });
    await prisma.applicationEvent.create({
      data: {
        applicationId: id,
        type: "REQUIREMENT",
        message: `Submitted: ${requirement.title}`,
        actor: session.name,
      },
    });
    return NextResponse.json({ ok: true, requirement: updated });
  }

  if (session.role === "UNIVERSITY") {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.universityId || app.universityId !== user.universityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!d.status || !["approved", "rejected", "pending"].includes(d.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updated = await prisma.applicationRequirement.update({
      where: { id: reqId },
      data: { status: d.status },
    });
    await prisma.applicationEvent.create({
      data: {
        applicationId: id,
        type: "REQUIREMENT",
        message: `${requirement.title} ${d.status === "approved" ? "approved ✅" : d.status === "rejected" ? "needs re-upload" : "reset to pending"}`,
        actor: session.name,
      },
    });
    return NextResponse.json({ ok: true, requirement: updated });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; reqId: string }> }
) {
  const { id, reqId } = await params;
  const session = await getSession();
  if (!session || session.role !== "UNIVERSITY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requirement = await prisma.applicationRequirement.findUnique({
    where: { id: reqId },
    include: { application: true },
  });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (
    !requirement ||
    requirement.applicationId !== id ||
    !user?.universityId ||
    requirement.application.universityId !== user.universityId
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.applicationRequirement.delete({ where: { id: reqId } });
  return NextResponse.json({ ok: true });
}
