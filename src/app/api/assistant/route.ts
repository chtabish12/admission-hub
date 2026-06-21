import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

// Allow a long-running streamed answer (web search runs server-side).
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
  if (context?.field) focus.push(`field of study: ${context.field}`);
  const focusLine = focus.length
    ? `\n\nThe user is currently browsing with these filters — ${focus.join(
        ", "
      )}. Tailor your answer to that, and pull the latest figures for it.`
    : "";

  return `You are the AdmissionHub assistant, helping students find universities and plan applications.
You answer questions about universities, tuition fees, scholarships, admission requirements, deadlines, student visas and the application process.

Use the web_search tool to fetch the latest, real information (current tuition fees, deadlines, rankings, visa rules) from official and reputable sources rather than guessing — figures change every year. Prefer official university and government sources.

Be concise and practical. Use short paragraphs or bullet points. Always give figures with their currency and the academic year they apply to, and mention when a number is an estimate. If you used web sources, briefly note them.${focusLine}`;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "The assistant isn't configured yet. Add ANTHROPIC_API_KEY to your environment." },
      { status: 503 }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages, context } = parsed.data;
  const client = new Anthropic();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const run = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 4000,
          system: systemPrompt(context),
          tools: [{ type: "web_search_20260209", name: "web_search" }],
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        run.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
        await run.finalMessage();
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? `\n\n[Assistant error: ${err.message}]`
            : "\n\n[The assistant hit an unexpected error. Please try again.]";
        controller.enqueue(encoder.encode(message));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
