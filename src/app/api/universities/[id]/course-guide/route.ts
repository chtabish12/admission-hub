import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toExternalUrl } from "@/lib/utils";
import { aiConfigured, generateAIJSON } from "@/lib/ai";

export const maxDuration = 60;

const bodySchema = z.object({ course: z.string().trim().min(1).max(60) });

// Shape the model must return.
const guideSchema = z.object({
  tuitionMin: z.number().int().nonnegative(),
  tuitionMax: z.number().int().nonnegative(),
  currency: z.string().trim().min(1).max(8),
  requirements: z.array(z.string().trim().min(1)).min(1).max(15),
  applicationSteps: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
      })
    )
    .min(1)
    .max(15),
  deadlines: z
    .array(z.object({ term: z.string().trim().min(1), date: z.string().trim().min(1) }))
    .max(10)
    .optional(),
  notes: z.string().trim().max(600).optional(),
});

// Gemini responseSchema (OpenAPI subset, uppercase types).
const responseSchema = {
  type: "OBJECT",
  properties: {
    tuitionMin: { type: "INTEGER" },
    tuitionMax: { type: "INTEGER" },
    currency: { type: "STRING" },
    requirements: { type: "ARRAY", items: { type: "STRING" } },
    applicationSteps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { title: { type: "STRING" }, description: { type: "STRING" } },
        required: ["title", "description"],
      },
    },
    deadlines: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { term: { type: "STRING" }, date: { type: "STRING" } },
        required: ["term", "date"],
      },
    },
    notes: { type: "STRING" },
  },
  required: ["tuitionMin", "tuitionMax", "currency", "requirements", "applicationSteps"],
};

function serialize(g: {
  tuitionMin: number;
  tuitionMax: number;
  currency: string;
  requirements: string;
  applicationSteps: string;
  deadlines: string | null;
  notes: string | null;
  source: string;
}) {
  return {
    tuitionMin: g.tuitionMin,
    tuitionMax: g.tuitionMax,
    currency: g.currency,
    requirements: JSON.parse(g.requirements),
    applicationSteps: JSON.parse(g.applicationSteps),
    deadlines: g.deadlines ? JSON.parse(g.deadlines) : [],
    notes: g.notes,
    source: g.source,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }
  const course = parsed.data.course;

  const uni = await prisma.university.findUnique({ where: { id } });
  if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return the cached guide if we already generated one for this course.
  const cached = await prisma.courseGuide.findUnique({
    where: { universityId_course: { universityId: id, course } },
  });
  if (cached) {
    return NextResponse.json({ ok: true, cached: true, guide: serialize(cached) });
  }

  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "Course guides need GROQ_API_KEY or GEMINI_API_KEY to be configured." },
      { status: 503 }
    );
  }

  const websiteUrl = toExternalUrl(uni.website);

  const system = `You produce accurate, COURSE-SPECIFIC admission data for a single university program, returned strictly as JSON matching the schema.

Rules:
- Requirements must be specific to this course (prerequisite subjects, portfolios, entrance/standardised tests such as GRE/GMAT/UCAT/LNAT, minimum GPA, required IELTS/TOEFL bands) — never generic filler.
- tuitionMin/tuitionMax are the ANNUAL tuition for THIS course for an international student, as whole numbers in the program's own currency (set currency accordingly, e.g. USD, GBP, EUR).
- applicationSteps are the concrete steps for applying to this specific program.
- deadlines are the typical intake deadlines if known.
- These are best-effort figures from your knowledge; when a number is approximate, say so briefly in notes.`;

  const prompt = `University: ${uni.name}
Location: ${uni.city}, ${uni.country}
Course / Program: ${course}
Official website: ${websiteUrl ?? "unknown"}`;

  let raw: unknown;
  try {
    raw = await generateAIJSON({ system, prompt, responseSchema, maxOutputTokens: 2048 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const valid = guideSchema.safeParse(raw);
  if (!valid.success) {
    return NextResponse.json(
      { error: "Couldn't generate a course guide. Please try again." },
      { status: 502 }
    );
  }

  const g = valid.data;
  const tuitionMin = Math.min(g.tuitionMin, g.tuitionMax);
  const tuitionMax = Math.max(g.tuitionMin, g.tuitionMax);

  const saved = await prisma.courseGuide.upsert({
    where: { universityId_course: { universityId: id, course } },
    update: {},
    create: {
      universityId: id,
      course,
      tuitionMin,
      tuitionMax,
      currency: g.currency,
      requirements: JSON.stringify(g.requirements),
      applicationSteps: JSON.stringify(g.applicationSteps),
      deadlines: g.deadlines ? JSON.stringify(g.deadlines) : null,
      notes: g.notes ?? null,
      source: "Gemini",
    },
  });

  return NextResponse.json({ ok: true, guide: serialize(saved) });
}
