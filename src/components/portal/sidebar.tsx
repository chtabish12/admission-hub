"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  Award,
  Sparkles,
  FileText,
  MessageSquare,
  Calendar,
  GitBranch,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalUI } from "@/components/portal/portal-ui";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard, roles: ["STUDENT", "UNIVERSITY", "ADMIN"] },
  { href: "/portal/kanban", label: "Kanban Board", icon: ClipboardList, roles: ["UNIVERSITY", "ADMIN"] },
  { href: "/portal/applications", label: "My Applications", icon: GraduationCap, roles: ["STUDENT"] },
  { href: "/portal/universities", label: "Universities", icon: GraduationCap, roles: ["STUDENT", "ADMIN"] },
  { href: "/portal/scholarships", label: "Scholarships", icon: Award, roles: ["STUDENT", "ADMIN"] },
  { href: "/portal/recommendations", label: "Recommendations", icon: Sparkles, roles: ["STUDENT"] },
  { href: "/portal/documents", label: "Documents", icon: FileText, roles: ["STUDENT"] },
  { href: "/portal/chat", label: "Chat", icon: MessageSquare, roles: ["STUDENT", "UNIVERSITY"] },
  { href: "/portal/calendar", label: "Calendar", icon: Calendar, roles: ["STUDENT"] },
  { href: "/portal/timeline", label: "Timeline", icon: GitBranch, roles: ["STUDENT"] },
  { href: "/portal/reports", label: "Reports", icon: BarChart3, roles: ["UNIVERSITY", "ADMIN"] },
  { href: "/portal/assistant", label: "AI Assistant", icon: Bot, roles: ["STUDENT"] },
];

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  UNIVERSITY: "University Admin",
  ADMIN: "Super Admin",
  CONSULTANT: "Consultant",
};

export function PortalSidebar({
  role,
  userName,
  chatBadge,
}: {
  role: string;
  userName: string;
  chatBadge?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { setCommandOpen } = usePortalUI();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-border bg-background transition-all duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">AdmissionHub</p>
            <p className="truncate text-[10px] text-muted-foreground">
              {ROLE_LABELS[role] ?? role} Portal
            </p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 py-3">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.href === "/portal/chat" && !!chatBadge && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {chatBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        {!collapsed && (
          <Link
            href="/portal/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/portal/settings")
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        )}
        <div
          className={cn(
            "mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {ROLE_LABELS[role] ?? role}
                </p>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="text-muted-foreground transition-colors hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label="Toggle sidebar"
        className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm"
      >
        <ChevronLeft
          className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")}
        />
      </button>
    </aside>
  );
}
