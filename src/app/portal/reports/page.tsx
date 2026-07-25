import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui";
import { SectionHeader, BarChart, Sparkline } from "@/components/portal/widgets";
import { STAGES, stageIndex, stageProgress } from "@/lib/application-stages";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "UNIVERSITY") redirect("/portal");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { university: { select: { name: true } } },
  });
  if (!user?.universityId || !user.university) redirect("/portal");

  const apps = await prisma.application.findMany({
    where: { universityId: user.universityId },
    select: { status: true, course: true, createdAt: true },
  });

  const now = new Date();
  const months = Array.from(
    { length: 7 },
    (_, i) => new Date(now.getFullYear(), now.getMonth() - (6 - i), 1)
  );
  const monthLabels = months.map((d) =>
    d.toLocaleDateString("en-US", { month: "short" })
  );
  const monthCounts = months.map((d) => {
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return apps.filter((a) => a.createdAt >= d && a.createdAt < next).length;
  });
  const cumulative = monthCounts.reduce<number[]>(
    (acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v],
    []
  );
  const cumulativeMax = cumulative[cumulative.length - 1] || 1;

  const total = apps.length;
  const offerIndex = stageIndex("conditional_offer");
  const offersMade = apps.filter((a) => stageIndex(a.status) >= offerIndex).length;
  const enrolled = apps.filter((a) =>
    ["enrolled", "completed"].includes(a.status)
  ).length;
  const acceptanceRate = total ? Math.round((offersMade / total) * 100) : 0;
  const avgProgress = total
    ? Math.round(apps.reduce((s, a) => s + stageProgress(a.status), 0) / total)
    : 0;
  const activePipeline = apps.filter(
    (a) => !["enrolled", "completed"].includes(a.status)
  ).length;

  const shapedSpark = (target: number) =>
    cumulative.map((v) => Math.round((v / cumulativeMax) * target));

  const kpis = [
    { label: "Total Applications", value: `${total}`, spark: cumulative, color: "#10b981" },
    { label: "Acceptance Rate", value: `${acceptanceRate}%`, spark: shapedSpark(acceptanceRate), color: "#8b5cf6" },
    { label: "Offers Made", value: `${offersMade}`, spark: shapedSpark(offersMade), color: "#f59e0b" },
    { label: "Enrolled", value: `${enrolled}`, spark: shapedSpark(enrolled), color: "#06b6d4" },
    { label: "Avg Stage Progress", value: `${avgProgress}%`, spark: shapedSpark(avgProgress), color: "#10b981" },
    { label: "Active Pipeline", value: `${activePipeline}`, spark: shapedSpark(activePipeline), color: "#f43f5e" },
  ];

  const stageCounts = STAGES.map((s) => ({
    stage: s,
    count: apps.filter((a) => a.status === s.key).length,
  }));
  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

  const courseCounts = new Map<string, number>();
  for (const a of apps) {
    courseCounts.set(a.course, (courseCounts.get(a.course) ?? 0) + 1);
  }
  const topCourses = [...courseCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCourseCount = Math.max(...topCourses.map(([, c]) => c), 1);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports & Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Performance insights and metrics for {user.university.name}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold leading-tight">{kpi.value}</p>
              </div>
              <Sparkline data={kpi.spark} color={kpi.color} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title="Applications by Stage"
            subtitle="Across the 16-stage workflow"
          />
          <div className="space-y-2">
            {stageCounts.map(({ stage, count }) => (
              <div key={stage.key} className="flex items-center gap-3">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", stage.color)} />
                <span className="min-w-0 flex-1 truncate text-xs">{stage.label}</span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary sm:w-48">
                  <div
                    className={cn("h-full rounded-full", stage.color)}
                    style={{ width: `${Math.round((count / maxStageCount) * 100)}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionHeader title="Applications by Course" subtitle="Top 6 programs" />
          {topCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {topCourses.map(([course, count]) => (
                <div key={course}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate">{course}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.round((count / maxCourseCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeader title="Monthly Trend" subtitle="Applications received per month" />
        <BarChart data={monthCounts} labels={monthLabels} color="#10b981" height={200} />
      </Card>
    </div>
  );
}
