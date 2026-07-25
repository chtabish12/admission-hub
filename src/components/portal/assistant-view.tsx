"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  Bot,
  CheckCircle2,
  FileText,
  GraduationCap,
  Info,
  Loader2,
  MessageSquare,
  Send,
  Zap,
} from "lucide-react";
import { Button, Card, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  {
    label: "Explain Imperial College CS requirements",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-600",
  },
  {
    label: "Review my SOP and suggest improvements",
    icon: FileText,
    color: "from-violet-500 to-purple-600",
  },
  {
    label: "Generate application checklist for UofT",
    icon: CheckCircle2,
    color: "from-amber-500 to-orange-600",
  },
  {
    label: "What documents am I missing?",
    icon: AlertCircle,
    color: "from-cyan-500 to-blue-600",
  },
  {
    label: "Recommend scholarships for my profile",
    icon: Award,
    color: "from-rose-500 to-pink-600",
  },
  {
    label: "Summarize my latest chat conversation",
    icon: MessageSquare,
    color: "from-teal-500 to-emerald-600",
  },
];

export function AssistantView({ userName }: { userName: string }) {
  const firstName = userName.split(" ")[0];
  const greeting = `Hi ${firstName}! I'm your AI Admission Assistant. I can help you with university requirements, tuition fees, scholarships, application checklists, visas and more.\n\nWhat would you like help with today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  function currentContext() {
    if (typeof window === "undefined") return undefined;
    const sp = new URLSearchParams(window.location.search);
    const country = sp.get("country") ?? undefined;
    const field = sp.get("field") ?? sp.get("course") ?? undefined;
    return country || field ? { country, field } : undefined;
  }

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
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

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.filter((m, i) => !(i === 0 && m.role === "assistant")),
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
      for (;;) {
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

  const streaming =
    loading && messages[messages.length - 1]?.role === "assistant";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold leading-tight">AI Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Your intelligent admission copilot
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          if (m.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <Card className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
                {m.content ||
                  (streaming && isLast ? (
                    <span className="flex items-center gap-1 py-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: `${d * 150}ms` }}
                        />
                      ))}
                    </span>
                  ) : (
                    ""
                  ))}
              </Card>
            </div>
          );
        })}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" /> Try these:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => send(action.label)}
                className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-left transition-colors hover:border-primary/30 hover:bg-secondary/50"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white",
                    action.color
                  )}
                >
                  <action.icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-xs">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask anything about admissions..."
            className="max-h-40 min-h-0 flex-1 resize-none rounded-xl py-2.5"
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="h-10 w-10 shrink-0 p-0"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1 text-center text-[10px] text-muted-foreground">
          <Info className="h-2.5 w-2.5" /> AI provides guidance only. Final admission
          decisions are made by universities.
        </p>
      </div>
    </div>
  );
}
