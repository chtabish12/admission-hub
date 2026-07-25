import { streamGeminiText, generateGeminiJSON, geminiConfigured, type ChatMsg } from "@/lib/gemini";

export type { ChatMsg };

/**
 * Multi-provider free AI layer with automatic failover.
 * Order: Groq (fastest, most generous free tier) → OpenRouter free models →
 * Gemini (which internally cascades search → no-search → lite). A provider is
 * skipped if its key is missing or its quota is exhausted, so the assistant
 * keeps working as long as ANY configured provider has headroom.
 *
 * Free keys (none need a credit card):
 *  - GROQ_API_KEY        https://console.groq.com
 *  - OPENROUTER_API_KEY  https://openrouter.ai/keys
 *  - GEMINI_API_KEY      https://aistudio.google.com
 */

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

export function aiConfigured(): boolean {
  return (
    geminiConfigured() ||
    !!process.env.GROQ_API_KEY ||
    !!process.env.OPENROUTER_API_KEY
  );
}

type OpenAIProvider = {
  name: string;
  url: string;
  key: string;
  model: string;
  headers?: Record<string, string>;
};

function openAIProviders(): OpenAIProvider[] {
  const providers: OpenAIProvider[] = [];
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY,
      model: GROQ_MODEL,
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1/chat/completions",
      key: process.env.OPENROUTER_API_KEY,
      model: OPENROUTER_MODEL,
      headers: { "X-Title": "AdmissionHub" },
    });
  }
  return providers;
}

function toOpenAIMessages(system: string, messages: ChatMsg[]) {
  return [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
}

async function tryOpenAIStream(
  p: OpenAIProvider,
  system: string,
  messages: ChatMsg[],
  maxTokens: number
): Promise<Response | null> {
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.key}`,
        ...p.headers,
      },
      body: JSON.stringify({
        model: p.model,
        messages: toOpenAIMessages(system, messages),
        max_tokens: maxTokens,
        stream: true,
      }),
    });
    return res.ok && res.body ? res : null;
  } catch {
    return null;
  }
}

function pipeOpenAIStream(res: Response, controller: ReadableStreamDefaultController<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = res.body!.getReader();
  let buffer = "";
  return (async () => {
    for (;;) {
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
          const text = parsed?.choices?.[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        } catch {
          continue;
        }
      }
    }
  })();
}

export function streamAIText(opts: {
  system: string;
  messages: ChatMsg[];
  search?: boolean;
  maxOutputTokens?: number;
}): ReadableStream<Uint8Array> {
  const maxTokens = opts.maxOutputTokens ?? 2048;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const p of openAIProviders()) {
          const res = await tryOpenAIStream(p, opts.system, opts.messages, maxTokens);
          if (res) {
            await pipeOpenAIStream(res, controller);
            controller.close();
            return;
          }
        }

        if (geminiConfigured()) {
          const gemini = streamGeminiText(opts);
          const reader = gemini.getReader();
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) controller.enqueue(value);
          }
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            "The assistant isn't configured. Add GROQ_API_KEY or GEMINI_API_KEY to your environment (both are free)."
          )
        );
        controller.close();
      } catch {
        controller.enqueue(
          encoder.encode("\n\n[The assistant hit an error. Please try again.]")
        );
        controller.close();
      }
    },
  });
}

async function tryOpenAIJSON(
  p: OpenAIProvider,
  system: string,
  prompt: string,
  maxTokens: number
): Promise<unknown | null> {
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.key}`,
        ...p.headers,
      },
      body: JSON.stringify({
        model: p.model,
        messages: [
          {
            role: "system",
            content: `${system}\n\nRespond with ONLY a valid JSON object. No markdown fences, no commentary.`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function generateAIJSON(opts: {
  system: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
  maxOutputTokens?: number;
}): Promise<unknown> {
  const maxTokens = opts.maxOutputTokens ?? 2048;

  if (geminiConfigured()) {
    try {
      return await generateGeminiJSON(opts);
    } catch {
      // fall through to OpenAI-compatible providers
    }
  }

  const schemaHint = `The JSON must match this structure: ${JSON.stringify(opts.responseSchema)}`;
  for (const p of openAIProviders()) {
    const result = await tryOpenAIJSON(
      p,
      `${opts.system}\n\n${schemaHint}`,
      opts.prompt,
      maxTokens
    );
    if (result) return result;
  }

  throw new Error(
    "All free AI providers are unavailable or out of quota — try again in a minute."
  );
}
