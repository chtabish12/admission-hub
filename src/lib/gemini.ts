/**
 * Thin wrapper around Google's Gemini REST API (free tier).
 * Get a key (no billing required) at https://aistudio.google.com → "Get API key".
 * Set GEMINI_API_KEY in your environment. Optionally override GEMINI_MODEL.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export function geminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

function toContents(messages: ChatMsg[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/**
 * Streams a chat answer as plain-text chunks. `search: true` enables Google
 * Search grounding so answers can use current information.
 */
export function streamGeminiText(opts: {
  system: string;
  messages: ChatMsg[];
  search?: boolean;
  maxOutputTokens?: number;
}): ReadableStream<Uint8Array> {
  const key = process.env.GEMINI_API_KEY!;
  const body = {
    system_instruction: { parts: [{ text: opts.system }] },
    contents: toContents(opts.messages),
    ...(opts.search ? { tools: [{ google_search: {} }] } : {}),
    generationConfig: { maxOutputTokens: opts.maxOutputTokens ?? 2048 },
  };

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const res = await fetch(
          `${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => "");
          controller.enqueue(
            encoder.encode(
              `\n\n[Assistant error: ${res.status} ${detail.slice(0, 200)}]`
            )
          );
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const json = trimmed.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const text =
                parsed?.candidates?.[0]?.content?.parts
                  ?.map((p: { text?: string }) => p.text ?? "")
                  .join("") ?? "";
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // skip partial / non-JSON keepalive lines
            }
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n\n[The assistant hit an error. Please try again.]")
        );
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Returns structured JSON constrained to `responseSchema` (Gemini's
 * OpenAPI-subset schema, uppercase types). Throws on HTTP/parse error.
 */
export async function generateGeminiJSON(opts: {
  system: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
  maxOutputTokens?: number;
}): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY!;
  const body = {
    system_instruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: opts.responseSchema,
      maxOutputTokens: opts.maxOutputTokens ?? 2048,
    },
  };

  const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";
  return JSON.parse(text);
}
