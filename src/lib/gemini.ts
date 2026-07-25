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

const FALLBACK_MODEL = "gemini-2.0-flash-lite";

/**
 * Streams a chat answer as plain-text chunks. `search: true` enables Google
 * Search grounding so answers can use current information.
 *
 * Free-tier quotas differ per feature/model (search grounding is the
 * smallest), so on 429 we retry: with search → without search → lighter model.
 */
export function streamGeminiText(opts: {
  system: string;
  messages: ChatMsg[];
  search?: boolean;
  maxOutputTokens?: number;
}): ReadableStream<Uint8Array> {
  const key = process.env.GEMINI_API_KEY!;

  function makeBody(search: boolean) {
    return JSON.stringify({
      system_instruction: { parts: [{ text: opts.system }] },
      contents: toContents(opts.messages),
      ...(search ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { maxOutputTokens: opts.maxOutputTokens ?? 2048 },
    });
  }

  const attempts: { model: string; search: boolean }[] = [
    ...(opts.search ? [{ model: MODEL, search: true }] : []),
    { model: MODEL, search: false },
    ...(MODEL !== FALLBACK_MODEL ? [{ model: FALLBACK_MODEL, search: false }] : []),
  ];

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let res: Response | null = null;
        let lastError = "";
        for (const attempt of attempts) {
          const r = await fetch(
            `${BASE}/${attempt.model}:streamGenerateContent?alt=sse&key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: makeBody(attempt.search),
            }
          );
          if (r.ok && r.body) {
            res = r;
            break;
          }
          lastError = `${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`;
          if (r.status !== 429 && r.status !== 503) break;
        }

        if (!res || !res.body) {
          controller.enqueue(
            encoder.encode(
              lastError.startsWith("429")
                ? "\n\nI'm receiving a lot of requests right now (free-tier quota reached). Please wait a minute and try again."
                : `\n\n[Assistant error: ${lastError}]`
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

  let res: Response | null = null;
  let lastError = "";
  for (const model of [MODEL, ...(MODEL !== FALLBACK_MODEL ? [FALLBACK_MODEL] : [])]) {
    const r = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      res = r;
      break;
    }
    lastError = `Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`;
    if (r.status !== 429 && r.status !== 503) break;
  }
  if (!res) {
    throw new Error(
      lastError.includes("429")
        ? "The free AI quota is temporarily exhausted — please try again in a minute."
        : lastError
    );
  }
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";
  return JSON.parse(text);
}
