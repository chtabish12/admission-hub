import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Circle, Clock, GitBranch, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { STAGES, stageIndex, stageOf, stageProgress } from "@/lib/application-stages";
import { cn } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/portal");

  const { app: appParam } = await searchParams;

  const apps = await prisma.application.findMany({
    where: { studentId: session.userId },
    include: {
      university: { select: { name: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (apps.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="flex flex-col items-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <GitBranch className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mb-1 mt-4 font-medium">No applications yet</p>
          <p className="text-sm text-muted-foreground">
            Your admission journey will appear here once you apply
          </p>
          <Link
            href="/portal/universities"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <GraduationCap className="h-4 w-4" /> Browse universities
          </Link>
        </div>
      </div>
    );
  }

  const app = apps.find((a) => a.id === appParam) ?? apps[0];
  const currentIdx = stageIndex(app.status);
  const stage = stageOf(app.status);
  const progress = stageProgress(app.status);

  const stageDates = new Map<string, Date>();
  stageDates.set("new", app.createdAt);
  for (const event of app.events) {
    if (event.type !== "STAGE_CHANGE") continue;
    for (const s of STAGES) {
      if (event.message.includes(s.label) && !stageDates.has(s.key)) {
        stageDates.set(s.key, event.createdAt);
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Application Timeline</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every step of your admission journey — from submission to enrollment
        </p>
      </div>

      {apps.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {apps.map((a) => {
            const active = a.id === app.id;
            return (
              <Link
                key={a.id}
                href={`/portal/timeline?app=${a.id}`}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {a.university.name} — {a.course}
              </Link>
            );
          })}
        </div>
      )}

      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-3xl font-bold">
              {currentIdx + 1} of {STAGES.length} steps
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current Stage</p>
              <p className="text-sm font-medium">{stage.label}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 animate-pulse text-primary" />
            </div>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Started: {fmtDate(app.createdAt)}</span>
          <span>{app.intake ? `Expected: ${app.intake}` : app.university.name}</span>
        </div>
      </Card>

      <div className="relative">
        <div className="absolute bottom-0 left-[19px] top-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {STAGES.map((s, i) => {
            const status = i < currentIdx ? "completed" : i === currentIdx ? "current" : "pending";
            const date = stageDates.get(s.key);
            const time =
              status === "current"
                ? "In Progress"
                : status === "pending"
                  ? "Upcoming"
                  : date
                    ? fmtDate(date)
                    : "Completed";
            return (
              <div key={s.key} className="flex gap-4">
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                    status === "completed" && "bg-emerald-500 text-white",
                    status === "current" && "bg-primary text-primary-foreground",
                    status === "pending" &&
                      "border-2 border-dashed border-border bg-muted text-muted-foreground"
                  )}
                >
                  {status === "current" && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-30" />
                  )}
                  {status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : status === "current" ? (
                    <Clock className="h-5 w-5 animate-pulse" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <Card
                  className={cn(
                    "flex-1 p-4",
                    status === "current" && "border-primary/30",
                    status === "pending" && "opacity-60"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">{s.label}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
                    </div>
                    <Badge
                      variant={
                        status === "completed"
                          ? "success"
                          : status === "current"
                            ? "default"
                            : "outline"
                      }
                      className="text-[10px] capitalize"
                    >
                      {status === "current" ? "In Progress" : status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
