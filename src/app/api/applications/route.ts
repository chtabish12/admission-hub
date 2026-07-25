import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GENERIC_REQUIREMENTS } from "@/lib/default-requirements";
import { parseList } from "@/lib/utils";

const createSchema = z.object({
  universityId: z.string().min(1),
  course: z.string().trim().min(1).max(60),
  intake: z.string().trim().max(20).optional(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  phone: z.string().trim().max(30).optional(),
  nationality: z.string().trim().max(60).optional(),
  educationLevel: z.string().trim().max(40).optional(),
  gpa: z.string().trim().max(20).optional(),
  englishTest: z.string().trim().max(60).optional(),
  statement: z.string().trim().min(50, "Statement must be at least 50 characters").max(6000),
  documents: z
    .array(z.object({ name: z.string().trim().min(1).max(80), url: z.string().url() }))
    .max(10)
    .default([]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can apply" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const uni = await prisma.university.findUnique({ where: { id: d.universityId } });
  if (!uni) return NextResponse.json({ error: "University not found" }, { status: 404 });

  const existing = await prisma.application.findUnique({
    where: {
      studentId_universityId_course: {
        studentId: session.userId,
        universityId: d.universityId,
        course: d.course,
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already applied to this course at this university" },
      { status: 409 }
    );
  }

  const guide = await prisma.courseGuide.findUnique({
    where: { universityId_course: { universityId: d.universityId, course: d.course } },
  });
  const reqTitles: string[] = guide
    ? parseList(guide.requirements)
    : parseList(uni.requirements);
  const seedTitles = (reqTitles.length ? reqTitles : GENERIC_REQUIREMENTS).slice(0, 12);

  const app = await prisma.application.create({
    data: {
      studentId: session.userId,
      universityId: d.universityId,
      course: d.course,
      intake: d.intake || null,
      fullName: d.fullName,
      email: d.email,
      phone: d.phone || null,
      nationality: d.nationality || null,
      educationLevel: d.educationLevel || null,
      gpa: d.gpa || null,
      englishTest: d.englishTest || null,
      statement: d.statement,
      documents: JSON.stringify(d.documents),
      events: {
        create: {
          type: "SUBMITTED",
          message: `Application submitted for ${d.course}`,
          actor: session.name,
        },
      },
      requirements: {
        create: seedTitles.map((title) => ({ title })),
      },
    },
  });

  return NextResponse.json({ ok: true, id: app.id });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (session.role === "UNIVERSITY") {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.universityId) {
      return NextResponse.json({ error: "No university linked" }, { status: 403 });
    }
    const applications = await prisma.application.findMany({
      where: { universityId: user.universityId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ applications });
  }

  const applications = await prisma.application.findMany({
    where: { studentId: session.userId },
    include: { university: { select: { id: true, name: true, city: true, country: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ applications });
}
