import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Clock, Award, Globe, ArrowRight, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, Badge, Button } from "@/components/ui";
import { StatCard, SectionHeader, BarChart, DonutChart } from "@/components/portal/widgets";
import { STAGES, stageIndex } from "@/lib/application-stages";
import { cn } from "@/lib/utils";

const PENDING_STAGES = ["new", "doc_verification", "academic_review", "eligibility"];

const DISTRIBUTION_GROUPS = [
  {
    label: "In Review",
    color: "#10b981",
    stages: ["academic_review", "eligibility", "scholarship", "interview_required", "interview_completed", "offer_generation"],
  },
  {
    label: "Offered",
    color: "#8b5cf6",
    stages: ["conditional_offer", "unconditional_offer", "student_accepted", "payment_pending", "payment_verified", "visa_processing"],
  },
  { label: "Pending", color: "#f59e0b", stages: ["new", "doc_verification"] },
  { label: "Enrolled", color: "#06b6d4", stages: ["enrolled", "completed"] },
];

export async function UniversityDashboard({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { university: { select: { name: true } } },
  });
  if (!user?.universityId || !user.university) redirect("/login");

  const apps = await prisma.application.findMany({
    where: { universityId: user.universityId },
    select: { studentId: true, status: true, nationality: true, createdAt: true },
  });

  const total = apps.length;
  const pendingReview = apps.filter((a) => PENDING_STAGES.includes(a.status)).length;
  const offerIndex = stageIndex("conditional_offer");
  const offersMade = apps.filter((a) => stageIndex(a.status) >= offerIndex).length;
  const intlStudents = new Set(
    apps.filter((a) => a.nationality).map((a) => a.studentId)
  ).size;

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

  const segments = DISTRIBUTION_GROUPS.map((g) => ({
    label: g.label,
    value: apps.filter((a) => g.stages.includes(a.status)).length,
    color: g.color,
  }));

  const stageCounts = STAGES.map((s) => ({
    stage: s,
    count: apps.filter((a) => a.status === s.key).length,
  }));
  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-semibold text-white ring-2 ring-primary/20">
            {initials}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-2xl font-bold tracking-tight">{userName} 👋</h1>
            <p className="text-sm text-muted-foreground">
              Manage applications and admission cycles
            </p>
          </div>
        </div>
        <Link href="/portal/kanban">
          <Button size="sm">
            <ClipboardList className="h-4 w-4" />
            Open Kanban
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={total} icon={ClipboardList} accent="emerald" />
        <StatCard label="Pending Review" value={pendingReview} icon={Clock} accent="amber" />
        <StatCard label="Offers Made" value={offersMade} icon={Award} accent="violet" />
        <StatCard label="Int'l Students" value={intlStudents} icon={Globe} accent="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title="Application Trends"
            subtitle="Monthly application volume"
            action={
              <Badge className="gap-1">
                <TrendingUp className="h-3 w-3" />
                Growing
              </Badge>
            }
          />
          <BarChart data={monthCounts} labels={monthLabels} color="#10b981" height={200} />
        </Card>
        <Card className="p-5">
          <SectionHeader title="Distribution" subtitle="By status" />
          <div className="flex justify-center">
            <DonutChart segments={segments} />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeader
          title="Admission Pipeline"
          subtitle="16-stage workflow"
          action={
            <Link href="/portal/kanban">
              <Button variant="ghost" size="sm">
                Open
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          }
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
    </div>
  );
}
