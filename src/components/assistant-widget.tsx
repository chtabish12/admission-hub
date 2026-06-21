"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

type ChatMessage = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi! I'm your AdmissionHub assistant. Ask me about universities, tuition fees, requirements, scholarships or visas — I'll look up the latest info for you.";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // Pull the current filters off the URL so the assistant fetches data
  // relevant to what the user is browsing right now.
  function currentContext() {
    if (typeof window === "undefined") return undefined;
    const sp = new URLSearchParams(window.location.search);
    const country = sp.get("country") ?? undefined;
    // On the university detail page the selected program is in ?course=…
    const field = sp.get("field") ?? sp.get("course") ?? undefined;
    return country || field ? { country, field } : undefined;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    // Add an empty assistant slot we stream into.
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Skip the local greeting when sending history to the model.
          messages: history.filter(
            (m, i) => !(i === 0 && m.role === "assistant")
          ),
          context: currentContext(),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        appendToLast(
          data?.error ?? "Sorry, I couldn't respond right now. Please try again."
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        appendToLast(decoder.decode(value, { stream: true }));
      }
    } catch {
      appendToLast("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function appendToLast(chunk: string) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { ...last, content: last.content + chunk };
      }
      return next;
    });
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-primary to-accent px-4 py-3 text-primary-foreground">
            <Sparkles className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">AdmissionHub Assistant</p>
              <p className="text-xs text-primary-foreground/80">
                Live answers on unis, fees & visas
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-sm"
                  }
                >
                  {m.content ||
                    (loading && i === messages.length - 1 ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      ""
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2 border-t border-border p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask about fees, requirements, visas…"
              className="max-h-28 flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              onClick={send}
              disabled={loading || !input.trim()}
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              aria-label="Send"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
