"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/lib/auth";

const links = [
  { href: "/universities", label: "Universities" },
  { href: "/consultants", label: "Consultants" },
  { href: "/how-it-works", label: "How it works" },
];

export function Navbar({ session }: { session: SessionPayload | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                pathname.startsWith(l.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {session ? (
            <>
              {session.role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {session ? (
                <>
                  {session.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={logout} className="w-full">
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    <Button className="w-full">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
