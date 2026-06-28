import { NextResponse } from "next/server";
import { z } from "zod";
import { geminiConfigured, streamGeminiText } from "@/lib/gemini";

// Allow a long-running streamed answer (search grounding can take a moment).
export const maxDuration = 60;

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
  context: z
    .object({
      country: z.string().max(60).optional(),
      field: z.string().max(60).optional(),
    })
    .optional(),
});

function systemPrompt(context?: { country?: string; field?: string }) {
  const focus: string[] = [];
  if (context?.country) focus.push(`country: ${context.country}`);
  if (context?.field) focus.push(`field/course: ${context.field}`);
  const focusLine = focus.length
    ? `\n\nThe user is currently browsing with these filters — ${focus.join(
        ", "
      )}. Tailor your answer to that.`
    : "";

  return `You are the AdmissionHub assistant, helping students find universities and plan applications.
You answer questions about universities, tuition fees, scholarships, admission requirements, deadlines, student visas and the application process.

Use Google Search to ground answers in current, real information (current tuition fees, deadlines, rankings, visa rules) — figures change every year. Prefer official university and government sources.

Be concise and practical. Use short paragraphs or bullet points. Always give figures with their currency and the academic year they apply to, and note when a number is an estimate.${focusLine}`;
}

export async function POST(req: Request) {
  if (!geminiConfigured()) {
    return NextResponse.json(
      { error: "The assistant isn't configured yet. Add GEMINI_API_KEY to your environment." },
      { status: 503 }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, context } = parsed.data;
  const stream = streamGeminiText({
    system: systemPrompt(context),
    messages,
    // Google Search grounding has a much smaller free quota than plain text;
    // set GEMINI_SEARCH=false to disable it if you hit 429s.
    search: process.env.GEMINI_SEARCH !== "false",
    maxOutputTokens: 2048,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
