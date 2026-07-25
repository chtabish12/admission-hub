"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare, Send } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn, timeAgo } from "@/lib/utils";

export type Conversation = {
  id: string;
  name: string;
  course: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
};

type ChatMessage = {
  id: string;
  applicationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: string };
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ChatClient({
  conversations: initialConversations,
  currentUserId,
  initialSelectedId,
}: {
  conversations: Conversation[];
  currentUserId: string;
  initialSelectedId: string | null;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialSelectedId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(!!initialSelectedId);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [showList, setShowList] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const loadMessages = useCallback(
    async (applicationId: string, silent: boolean) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/messages?applicationId=${applicationId}`);
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages ?? []);
        setConversations((prev) =>
          prev.map((c) => (c.id === applicationId ? { ...c, unread: 0 } : c))
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId, false);
    const timer = setInterval(() => loadMessages(activeId, true), 5000);
    return () => clearInterval(timer);
  }, [activeId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function selectConversation(id: string) {
    setActiveId(id);
    setShowList(false);
    setMessages([]);
    window.history.replaceState(null, "", `/portal/chat?c=${id}`);
  }

  async function send() {
    const content = input.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: activeId, content }),
      });
      if (res.ok) {
        setInput("");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
        await loadMessages(activeId, true);
      }
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-semibold">No conversations yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Conversations open automatically for each application. Once an application
          exists, you can message the other side here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div
        className={cn(
          "w-full shrink-0 flex-col border-r border-border bg-card sm:flex sm:w-80",
          showList ? "flex" : "hidden"
        )}
      >
        <div className="border-b border-border p-3">
          <p className="text-sm font-semibold">Conversations</p>
          <p className="text-xs text-muted-foreground">
            {conversations.length} application{conversations.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-border p-3 text-left transition-colors hover:bg-secondary/60",
                conv.id === activeId && "bg-secondary"
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">
                {initials(conv.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{conv.name}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted-foreground">
                    {conv.lastMessage ?? conv.course}
                  </p>
                  {conv.unread > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 flex-col sm:flex",
          showList ? "hidden" : "flex"
        )}
      >
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </div>
        ) : (
          <>
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 sm:hidden"
                onClick={() => setShowList(true)}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-semibold text-white">
                {initials(active.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{active.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {active.course}
                </p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-4"
            >
              {loading && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && messages.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No messages yet — say hello to get things moving.
                </p>
              )}
              {messages.map((m) => {
                const own = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%]", own && "text-right")}>
                      <div
                        className={cn(
                          "whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-left text-sm",
                          own
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-secondary"
                        )}
                      >
                        {m.content}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type a message..."
                className="h-9 flex-1"
              />
              <Button
                onClick={send}
                disabled={sending || !input.trim()}
                size="sm"
                className="h-9 w-9 shrink-0 p-0"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
