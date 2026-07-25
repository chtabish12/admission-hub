"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Users,
  Building2,
  Briefcase,
  Landmark,
  ClipboardList,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  Lock,
  Zap,
} from "lucide-react";
import { Button, Badge, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

type Portal = {
  key: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  features: string[];
  enabled: boolean;
};

const PORTALS: Portal[] = [
  {
    key: "student",
    title: "Student Portal",
    description: "Track applications, discover universities, win scholarships",
    icon: GraduationCap,
    gradient: "from-emerald-500 to-teal-500",
    features: ["My Applications", "University Directory", "Scholarship Engine", "Smart Recommendations"],
    enabled: true,
  },
  {
    key: "university",
    title: "University Portal",
    description: "Manage programs, admission cycles, and decisions",
    icon: Landmark,
    gradient: "from-rose-500 to-pink-500",
    features: ["Application Review", "16-Stage Kanban Board", "Requirements Builder", "Decision Queue"],
    enabled: true,
  },
  {
    key: "parent",
    title: "Parent Portal",
    description: "Monitor progress, transparent fees, approve decisions",
    icon: Users,
    gradient: "from-violet-500 to-purple-500",
    features: ["Student Progress", "Fee Transparency", "Payment History", "Approvals"],
    enabled: false,
  },
  {
    key: "school",
    title: "School Portal",
    description: "Manage students, counselors, and university partnerships",
    icon: Building2,
    gradient: "from-cyan-500 to-blue-500",
    features: ["Student Management", "Counselor Oversight", "University Partnerships", "Recommendation Letters"],
    enabled: false,
  },
  {
    key: "consultant",
    title: "Consultant Portal",
    description: "Guide students, manage leads, and track performance",
    icon: Briefcase,
    gradient: "from-amber-500 to-orange-500",
    features: ["Assigned Students", "Lead Pipeline", "University Communication", "Revenue Tracking"],
    enabled: false,
  },
  {
    key: "officer",
    title: "Admission Officer",
    description: "Kanban-first workflow for processing applications",
    icon: ClipboardList,
    gradient: "from-emerald-600 to-green-600",
    features: ["16-Stage Kanban Board", "Drag & Drop Workflow", "Audit Logging", "Priority Management"],
    enabled: false,
  },
  {
    key: "admin",
    title: "Admin Portal",
    description: "Super admin controls for the entire platform",
    icon: Shield,
    gradient: "from-slate-600 to-zinc-600",
    features: ["User Management", "System Config", "Audit Logs", "Global Reports"],
    enabled: false,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Portal | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="relative min-h-[90vh]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="container-page py-12">
        {!selected ? (
          <>
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Globe className="h-3.5 w-3.5" />
                Trusted by 100,000+ students across 50+ countries
              </span>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
                Choose your <span className="gradient-text">portal</span>
              </h1>
              <p className="mt-3 text-muted-foreground">
                One platform connecting Students, Schools, Consultants,
                Universities, and Admission Officers. Select your role to
                continue.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PORTALS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => p.enabled && setSelected(p)}
                  disabled={!p.enabled}
                  className={cn(
                    "group relative rounded-2xl border border-border bg-card p-5 text-left transition-all",
                    p.enabled
                      ? "hover:-translate-y-1 hover:shadow-lg"
                      : "cursor-not-allowed opacity-60"
                  )}
                >
                  {p.enabled ? (
                    <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  ) : (
                    <Badge className="absolute right-3 top-3" variant="outline">
                      Coming soon
                    </Badge>
                  )}
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                      p.gradient
                    )}
                  >
                    <p.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.features.slice(0, 2).map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </button>
              ))}

              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-3 font-semibold">AI-Powered Assistant</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  SOP review, smart recommendations, missing document detection,
                  and conversation summaries.
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  GDPR Ready · FERPA-inspired · 2FA · JWT
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> End-to-end encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> SOC 2 Type II
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> 99.99% uptime SLA
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Multi-tenant cloud
              </span>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
              <button
                onClick={() => setSelected(null)}
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back to portals
              </button>

              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white",
                  selected.gradient
                )}
              >
                <selected.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold">{selected.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>

              {error && (
                <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input id="password" name="password" type="password" required placeholder="••••••••" />
                </div>
                <Button type="submit" className="h-11 w-full" disabled={loading}>
                  {loading ? "Signing in…" : `Sign in to ${selected.title}`}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                {selected.key === "student" ? (
                  <>Demo: student@demo.com / password123</>
                ) : (
                  <>Demo: university@demo.com / uni123</>
                )}
              </p>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                No account yet?{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        © 2026 AdmissionHub · The Admission Operating System
      </p>
    </div>
  );
}
