import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, GraduationCap, MapPin, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { STAGES, stageIndex, stageOf, stageProgress } from "@/lib/application-stages";
import { cn, timeAgo } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";

export default async function ApplicationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/portal");

  const apps = await prisma.application.findMany({
    where: { studentId: session.userId },
    include: {
      university: { select: { name: true, city: true, country: true } },
      requirements: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">My Applications</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {apps.length} application{apps.length === 1 ? "" : "s"} · Track each one through all{" "}
          {STAGES.length} stages
        </p>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mb-1 mt-4 font-medium">No applications yet</p>
          <p className="text-sm text-muted-foreground">
            Find a university that fits you and start your first application
          </p>
          <Link
            href="/portal/universities"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <GraduationCap className="h-4 w-4" /> Browse universities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {apps.map((app) => {
            const stage = stageOf(app.status);
            const idx = stageIndex(app.status);
            const progress = stageProgress(app.status);
            const total = app.requirements.length;
            const submitted = app.requirements.filter(
              (r) => r.status === "submitted" || r.status === "approved"
            ).length;
            const approved = app.requirements.filter((r) => r.status === "approved").length;
            const rejected = app.requirements.filter((r) => r.status === "rejected").length;
            return (
              <Link key={app.id} href={`/portal/applications/${app.id}`} className="block">
                <Card className="h-full p-5 transition-colors hover:border-primary/30 hover:bg-secondary/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold leading-tight">
                        {app.university.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{app.course}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {app.university.city}, {app.university.country}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      <span className={cn("mr-1.5 h-2 w-2 rounded-full", stage.color)} />
                      {stage.label}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        Stage {idx + 1} of {STAGES.length}
                      </span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <div className="flex gap-[3px]">
                      {STAGES.map((s, i) => (
                        <div
                          key={s.key}
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            i <= idx ? "bg-emerald-500" : "bg-secondary"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {total > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                        {submitted} of {total} submitted
                      </span>
                      {approved > 0 && (
                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          {approved} approved
                        </span>
                      )}
                      {rejected > 0 && (
                        <span className="rounded-md border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                          {rejected} need re-upload
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Updated {timeAgo(app.updatedAt)}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      View details <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
