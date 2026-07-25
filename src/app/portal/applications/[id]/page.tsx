import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  Circle,
  FileText,
  GitBranch,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { OFFER_STAGES, STAGES, stageIndex, stageOf } from "@/lib/application-stages";
import { cn, timeAgo } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";
import { SectionHeader } from "@/components/portal/widgets";
import { AcceptOfferButton } from "@/components/accept-offer-button";
import { RequirementsList } from "@/components/portal/requirements-list";

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  STAGE_CHANGE: GitBranch,
  REQUIREMENT: FileText,
  NOTE: MessageSquare,
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/portal");

  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      university: { select: { name: true, city: true, country: true } },
      events: { orderBy: { createdAt: "desc" } },
      requirements: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!app || app.studentId !== session.userId) redirect("/portal/applications");

  const stage = stageOf(app.status);
  const currentIdx = stageIndex(app.status);
  const hasOffer = OFFER_STAGES.includes(app.status);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <Link
        href="/portal/applications"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back to applications
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">{app.course}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {app.university.name} · {app.university.city}, {app.university.country}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {timeAgo(app.createdAt)}
            {app.intake ? ` · Intake ${app.intake}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          <span className={cn("mr-1.5 h-2 w-2 rounded-full", stage.color)} />
          {stage.label}
        </Badge>
      </div>

      {hasOffer && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold">Congratulations! You have an offer 🎉</p>
                <p className="text-sm text-muted-foreground">
                  {app.university.name} sent you a {stage.label.toLowerCase()} for {app.course}.
                </p>
              </div>
            </div>
            <AcceptOfferButton applicationId={app.id} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <SectionHeader
              title="Application Journey"
              subtitle="Submitted ✓ — synced automatically with the university's workflow"
            />
            <div className="relative">
              <div className="absolute bottom-4 left-[23px] top-4 w-0.5 bg-border" />
              <div className="space-y-1.5">
                {STAGES.map((s, i) => {
                  const completed = i <= currentIdx;
                  const current = i === currentIdx;
                  return (
                    <div
                      key={s.key}
                      className={cn(
                        "relative flex items-start gap-3 rounded-lg p-2",
                        current && "bg-primary/5 ring-1 ring-primary/20"
                      )}
                    >
                      <div
                        className={cn(
                          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                          completed
                            ? cn(s.color, "text-white")
                            : "border-2 border-dashed border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {current && (
                          <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-30" />
                        )}
                        {completed ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              !completed && "text-muted-foreground"
                            )}
                          >
                            {s.label}
                          </p>
                          {current && (
                            <Badge className="bg-primary/10 text-[10px] text-primary">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{s.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader
              title={`Requirements from ${app.university.name}`}
              subtitle="Upload the documents the university has requested"
            />
            {app.requirements.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No requirements requested yet
              </p>
            ) : (
              <RequirementsList
                applicationId={app.id}
                requirements={app.requirements.map((r) => ({
                  id: r.id,
                  title: r.title,
                  note: r.note,
                  status: r.status,
                  documentName: r.documentName,
                  documentUrl: r.documentUrl,
                }))}
              />
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHeader title="Personal Statement" />
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{app.statement}</p>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Activity" subtitle="Latest updates first" />
            {app.events.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {app.events.map((event) => {
                  const Icon = EVENT_ICONS[event.type] ?? GitBranch;
                  return (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{event.message}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {event.actor} · {timeAgo(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
