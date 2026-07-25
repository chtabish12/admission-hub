import Link from "next/link";
import {
  Award,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileCheck,
  FileText,
  GitBranch,
  GraduationCap,
  MessageSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, parseList } from "@/lib/utils";
import { OFFER_STAGES, stageIndex, stageOf, stageProgress } from "@/lib/application-stages";
import { Badge, Card } from "@/components/ui";
import { SectionHeader, StatCard } from "@/components/portal/widgets";

const QUICK_LINKS = [
  { href: "/portal/universities", label: "Browse Universities", icon: GraduationCap },
  { href: "/portal/documents", label: "My Documents", icon: FileText },
  { href: "/portal/chat", label: "Messages", icon: MessageSquare },
  { href: "/portal/timeline", label: "Timeline", icon: GitBranch },
  { href: "/portal/calendar", label: "Calendar", icon: Calendar },
  { href: "/portal/assistant", label: "AI Assistant", icon: Bot },
];

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function StudentDashboard({ userId, userName }: { userId: string; userName: string }) {
  const [user, apps] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.application.findMany({
      where: { studentId: userId },
      include: {
        university: { select: { name: true, deadlines: true } },
        requirements: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const allReqs = apps.flatMap((a) => a.requirements);
  const approvedReqs = allReqs.filter((r) => r.status === "approved").length;
  const submittedReqs = allReqs.filter((r) => r.status === "submitted" || r.status === "approved").length;
  const pendingTasks = allReqs.filter((r) => r.status === "pending" || r.status === "rejected").length;
  const activeApps = apps.filter((a) => !stageOf(a.status).terminal).length;
  const offerIdx = stageIndex(OFFER_STAGES[0]);
  const offers = apps.filter((a) => stageIndex(a.status) >= offerIdx).length;
  const reviewing = apps.filter((a) => stageIndex(a.status) < offerIdx).length;

  const profileFields = [
    user?.fieldOfInterest,
    user?.preferredCountry,
    user?.preferredCity,
    user?.educationLevel,
    user?.cgpa,
    user?.budget,
    user?.ieltsScore ?? user?.toeflScore,
    user?.workExperience,
    user?.careerGoals,
    user?.preferredIntake,
  ];
  const filled = profileFields.filter((v) => v !== null && v !== undefined && v !== "").length;
  const profileStrength = Math.round((filled / profileFields.length) * 100);

  const furthest = apps.length > 0 ? Math.max(...apps.map((a) => stageIndex(a.status))) : -1;
  const currentStep =
    furthest >= stageIndex("enrolled")
      ? 6
      : furthest >= offerIdx
        ? 5
        : furthest >= 0
          ? 3
          : 1;

  const journey = [
    {
      title: "Profile Created",
      note: "Your account and study profile are set up",
      time: user ? fmtDate(user.createdAt) : "",
    },
    {
      title: "Documents Uploaded",
      note:
        allReqs.length > 0
          ? `${submittedReqs} of ${allReqs.length} requirements submitted`
          : "Upload documents as universities request them",
      time: allReqs.length > 0 ? `${submittedReqs}/${allReqs.length}` : "",
    },
    {
      title: "Application Submitted",
      note:
        apps.length > 0
          ? `${apps.length} application${apps.length === 1 ? "" : "s"} submitted`
          : "Submit your first application",
      time: apps.length > 0 ? fmtDate(apps[apps.length - 1].createdAt) : "",
    },
    {
      title: "University Reviewing",
      note:
        reviewing > 0
          ? `${reviewing} application${reviewing === 1 ? "" : "s"} under review`
          : "Universities review your application",
      time: currentStep === 3 ? "In Progress" : "",
    },
    {
      title: "Offer Received",
      note:
        offers > 0
          ? `${offers} offer${offers === 1 ? "" : "s"} received`
          : "Awaiting admission decisions",
      time: currentStep === 5 ? "In Progress" : "",
    },
    {
      title: "Enrolled",
      note: "Official enrollment at your university",
      time: currentStep === 6 ? "Done 🎉" : "",
    },
  ].map((s, i) => ({
    ...s,
    status: i < currentStep || currentStep === 6 ? "completed" : i === currentStep ? "current" : "pending",
  }));

  const upcoming: { date: Date; title: string; meta: string }[] = [];
  const seen = new Set<string>();
  const now = new Date();
  for (const app of apps) {
    for (const d of parseList<{ term?: string; date?: string }>(app.university.deadlines)) {
      if (!d || typeof d !== "object" || typeof d.date !== "string") continue;
      const dt = new Date(d.date);
      if (isNaN(dt.getTime()) || dt < now) continue;
      const title = `${app.university.name} — ${d.term ?? "Application deadline"}`;
      const key = `${d.date}:${title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      upcoming.push({ date: dt, title, meta: "Deadline" });
    }
    for (const r of app.requirements) {
      if (r.status === "pending" || r.status === "rejected") {
        upcoming.push({ date: r.createdAt, title: r.title, meta: `Requested by ${app.university.name}` });
      }
    }
  }
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-semibold text-white ring-2 ring-primary/20">
              {initials}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <h1 className="text-2xl font-bold tracking-tight">{userName} 👋</h1>
              <p className="text-sm text-muted-foreground">
                You have{" "}
                <span className="font-medium text-foreground">
                  {activeApps} active application{activeApps === 1 ? "" : "s"}
                </span>{" "}
                and{" "}
                <span className="font-medium text-foreground">
                  {pendingTasks} pending task{pendingTasks === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/portal/recommendations"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
            >
              <Sparkles className="h-4 w-4" /> Get Recommendations
            </Link>
            <Link
              href="/portal/universities"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <GraduationCap className="h-4 w-4" /> Find University
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Active Applications" value={activeApps} icon={GraduationCap} accent="emerald" />
        <StatCard label="Offers Received" value={offers} icon={Award} accent="violet" />
        <StatCard
          label="Documents Verified"
          value={`${approvedReqs}/${allReqs.length}`}
          icon={FileCheck}
          accent="cyan"
        />
        <StatCard label="Profile Strength" value={`${profileStrength}%`} icon={UserCheck} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <SectionHeader
              title="Application Progress"
              subtitle="Where each application stands"
              action={
                <Link
                  href="/portal/applications"
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              }
            />
            {apps.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <GraduationCap className="mb-2 h-8 w-8 text-muted-foreground opacity-40" />
                <p className="text-sm font-medium">No applications yet</p>
                <p className="text-xs text-muted-foreground">
                  Find a university and start your first application
                </p>
                <Link
                  href="/portal/universities"
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                >
                  Browse universities
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {apps.map((app) => {
                  const stage = stageOf(app.status);
                  const progress = stageProgress(app.status);
                  return (
                    <Link
                      key={app.id}
                      href={`/portal/applications/${app.id}`}
                      className="block rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{app.university.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{app.course}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          <span className={cn("mr-1.5 h-2 w-2 rounded-full", stage.color)} />
                          {stage.label}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{progress}%</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeader title="Your Journey" subtitle="Your admission journey at a glance" />
            <div className="relative">
              <div className="absolute bottom-2 left-4 top-2 w-0.5 bg-border" />
              <div className="space-y-3">
                {journey.map((step) => (
                  <div key={step.title} className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                        step.status === "completed" && "bg-emerald-500 text-white",
                        step.status === "current" && "animate-pulse bg-primary text-primary-foreground",
                        step.status === "pending" &&
                          "border-2 border-dashed border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : step.status === "current" ? (
                        <Circle className="h-3 w-3 fill-current" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            step.status === "pending" && "text-muted-foreground"
                          )}
                        >
                          {step.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{step.time}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader title="Upcoming" subtitle="Deadlines and requested documents" />
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Nothing on your schedule yet
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
                  >
                    <div className="min-w-[36px] text-center">
                      <p className="text-[10px] uppercase text-muted-foreground">
                        {item.date.toLocaleDateString("en", { month: "short" })}
                      </p>
                      <p className="text-lg font-bold leading-none">{item.date.getDate()}</p>
                    </div>
                    <div className="h-8 w-0.5 bg-border" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{item.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionHeader title="Quick Links" />
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-xs font-medium transition-colors hover:bg-secondary/50"
                >
                  <link.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{link.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
