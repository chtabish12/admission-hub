"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Plus,
  ChevronRight,
  Sun,
  Moon,
  X,
  Command,
  CheckCircle2,
  Clock,
  Award,
  FileText,
  Calendar,
  MessageSquare,
  LayoutDashboard,
  ClipboardList,
  Bot,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button, Badge } from "@/components/ui";
import { usePortalUI } from "@/components/portal/portal-ui";
import { cn } from "@/lib/utils";

export type PortalNotification = {
  id: string;
  title: string;
  description: string;
  type: string;
  timestamp: string;
  read: boolean;
  priority: "urgent" | "high" | "medium" | "low";
};

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/portal": { title: "Dashboard", subtitle: "Your admission overview at a glance" },
  "/portal/kanban": { title: "Application Kanban", subtitle: "Drag & drop workflow across 16 stages" },
  "/portal/applications": { title: "My Applications", subtitle: "Track all your university applications" },
  "/portal/universities": { title: "University Directory", subtitle: "Explore 10,000+ universities worldwide" },
  "/portal/scholarships": { title: "Scholarship Engine", subtitle: "Find funding that matches your profile" },
  "/portal/recommendations": { title: "Smart Recommendations", subtitle: "AI-powered university & program matches" },
  "/portal/documents": { title: "Document Vault", subtitle: "Secure storage with version control" },
  "/portal/chat": { title: "Messages", subtitle: "Real-time communication across all parties" },
  "/portal/calendar": { title: "Calendar", subtitle: "Deadlines, interviews, and important dates" },
  "/portal/timeline": { title: "Application Timeline", subtitle: "Track every step of your journey" },
  "/portal/reports": { title: "Reports & Analytics", subtitle: "Performance insights and metrics" },
  "/portal/assistant": { title: "AI Assistant", subtitle: "Your intelligent admission copilot" },
  "/portal/settings": { title: "Settings", subtitle: "Manage your account and preferences" },
};

const NOTIF_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  application: CheckCircle2,
  deadline: Clock,
  scholarship: Award,
  document: FileText,
  interview: Calendar,
  offer: Award,
  chat: MessageSquare,
  stage: CheckCircle2,
};

const PRIORITY_BORDERS: Record<string, string> = {
  urgent: "border-l-rose-500",
  high: "border-l-amber-500",
  medium: "border-l-cyan-500",
  low: "border-l-slate-400",
};

export function PortalTopbar({
  role,
  notifications,
}: {
  role: string;
  notifications: PortalNotification[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { commandOpen, setCommandOpen, notifOpen, setNotifOpen } = usePortalUI();

  const view = useMemo(() => {
    const exact = VIEW_TITLES[pathname];
    if (exact) return exact;
    const prefix = Object.keys(VIEW_TITLES)
      .filter((k) => k !== "/portal" && pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return prefix ? VIEW_TITLES[prefix] : VIEW_TITLES["/portal"];
  }, [pathname]);

  const unread = notifications.filter((n) => !n.read).length;

  const quickActions = [
    { label: "Go to Dashboard", icon: LayoutDashboard, href: "/portal", roles: ["STUDENT", "UNIVERSITY", "ADMIN"] },
    { label: "Open Kanban Board", icon: ClipboardList, href: "/portal/kanban", roles: ["UNIVERSITY", "ADMIN"] },
    { label: "Browse Universities", icon: Search, href: "/portal/universities", roles: ["STUDENT", "ADMIN"] },
    { label: "Ask AI Assistant", icon: Bot, href: "/portal/assistant", roles: ["STUDENT"] },
    { label: "Messages", icon: MessageSquare, href: "/portal/chat", roles: ["STUDENT", "UNIVERSITY"] },
  ].filter((a) => a.roles.includes(role));

  return (
    <>
      <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              AdmissionHub <ChevronRight className="h-3 w-3" /> {view.title}
            </div>
            <h1 className="truncate text-lg font-semibold leading-tight">{view.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden w-56 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search anything...</span>
              <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 md:hidden"
              onClick={() => setCommandOpen(true)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="hidden h-4 w-4 dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="relative h-9 w-9 p-0"
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Button>

            {role === "STUDENT" && (
              <Link href="/portal/universities" className="hidden sm:block">
                <Button size="sm">
                  <Plus className="h-4 w-4" /> New
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {commandOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24 backdrop-blur-sm"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Command className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search students, universities, applications, documents..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = (e.target as HTMLInputElement).value.trim();
                    if (q) {
                      router.push(
                        role === "STUDENT"
                          ? `/portal/universities?q=${encodeURIComponent(q)}`
                          : `/portal/kanban?q=${encodeURIComponent(q)}`
                      );
                      setCommandOpen(false);
                    }
                  }
                }}
              />
              <button onClick={() => setCommandOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Quick Actions
              </p>
              {quickActions.map((a) => (
                <button
                  key={a.href}
                  onClick={() => {
                    router.push(a.href);
                    setCommandOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-secondary"
                >
                  <a.icon className="h-4 w-4 text-muted-foreground" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {notifOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setNotifOpen(false)}
        >
          <div
            className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-border bg-background shadow-2xl sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-semibold">Notifications</span>
                {unread > 0 && <Badge>{unread} new</Badge>}
              </div>
              <button onClick={() => setNotifOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Nothing here yet — updates about your applications will appear
                  here.
                </p>
              )}
              {notifications.map((n) => {
                const Icon = NOTIF_ICONS[n.type] ?? CheckCircle2;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 border-b border-l-2 border-border px-5 py-4",
                      PRIORITY_BORDERS[n.priority] ?? "border-l-slate-400",
                      !n.read && "bg-secondary/40"
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {n.title}
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {n.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {n.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
