import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  note: z.string().trim().max(300).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "UNIVERSITY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || !user?.universityId || app.universityId !== user.universityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const requirement = await prisma.applicationRequirement.create({
    data: {
      applicationId: id,
      title: parsed.data.title,
      note: parsed.data.note || null,
      createdBy: "UNIVERSITY",
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: id,
      type: "REQUIREMENT",
      message: `New requirement requested: ${parsed.data.title}`,
      actor: session.name,
    },
  });

  return NextResponse.json({ ok: true, requirement });
}
