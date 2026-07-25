import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cn, parseList } from "@/lib/utils";
import { Card } from "@/components/ui";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type EventType = "deadline" | "task" | "interview";

type CalEvent = {
  date: string;
  title: string;
  type: EventType;
  meta?: string;
};

const TYPES: Record<EventType, { label: string; dot: string; chip: string }> = {
  deadline: {
    label: "Deadline",
    dot: "bg-rose-500",
    chip: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  task: {
    label: "Task",
    dot: "bg-amber-500",
    chip: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  interview: {
    label: "Interview",
    dot: "bg-violet-500",
    chip: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
};

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/portal");

  const { m } = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    if (mo >= 1 && mo <= 12) {
      year = y;
      month = mo - 1;
    }
  }

  const apps = await prisma.application.findMany({
    where: { studentId: session.userId },
    include: {
      university: { select: { name: true, deadlines: true } },
      requirements: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  const events: CalEvent[] = [];
  const seen = new Set<string>();
  for (const app of apps) {
    for (const d of parseList<{ term?: string; date?: string }>(app.university.deadlines)) {
      if (!d || typeof d !== "object" || typeof d.date !== "string") continue;
      const dt = new Date(d.date);
      if (isNaN(dt.getTime())) continue;
      const date = /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : fmtDate(dt);
      const title = `${app.university.name} — ${d.term ?? "Application deadline"}`;
      const key = `${date}:${title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({ date, title, type: "deadline" });
    }
    for (const r of app.requirements) {
      events.push({
        date: fmtDate(r.createdAt),
        title: r.title,
        type: "task",
        meta: app.university.name,
      });
    }
    if (app.status === "interview_required") {
      const stageEvent = app.events.find(
        (e) => e.type === "STAGE_CHANGE" && e.message.includes("Interview Required")
      );
      events.push({
        date: fmtDate(stageEvent?.createdAt ?? app.updatedAt),
        title: `Interview — ${app.university.name}`,
        type: "interview",
        meta: app.course,
      });
    }
  }

  const byDay = new Map<string, CalEvent[]>();
  for (const event of events) {
    const list = byDay.get(event.date) ?? [];
    list.push(event);
    byDay.set(event.date, list);
  }

  const monthPrefix = monthParam(year, month);
  const monthEvents = events.filter((e) => e.date.startsWith(monthPrefix));
  const todayStr = fmtDate(now);
  const upcoming = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevHref = `/portal/calendar?m=${month === 0 ? monthParam(year - 1, 11) : monthParam(year, month - 1)}`;
  const nextHref = `/portal/calendar?m=${month === 11 ? monthParam(year + 1, 0) : monthParam(year, month + 1)}`;

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {MONTHS[month]} {year}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {monthEvents.length} event{monthEvents.length === 1 ? "" : "s"} this month
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={prevHref}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link
                href="/portal/calendar"
                className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
              >
                Today
              </Link>
              <Link
                href={nextHref}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[10px] font-medium uppercase text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`blank-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
              const dayEvents = byDay.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={day}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-lg border p-1.5",
                    isToday ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        isToday ? "text-primary" : "text-foreground"
                      )}
                    >
                      {day}
                    </p>
                    {dayEvents.length > 0 && (
                      <span className={cn("h-1.5 w-1.5 rounded-full", TYPES[dayEvents[0].type].dot)} />
                    )}
                  </div>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event, j) => (
                      <div
                        key={j}
                        className={cn(
                          "truncate rounded border px-1 py-0.5 text-[9px] font-medium",
                          TYPES[event.type].chip
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="px-1 text-[9px] text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold">Event Types</h3>
            <div className="space-y-2">
              {(Object.keys(TYPES) as EventType[]).map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm"
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", TYPES[type].dot)} />
                  <span>{TYPES[type].label}</span>
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    {monthEvents.filter((e) => e.type === type).length}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4">
              <h3 className="font-semibold">Upcoming Events</h3>
              <p className="text-xs text-muted-foreground">Next on your schedule</p>
            </div>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((event, i) => {
                  const d = new Date(`${event.date}T00:00:00`);
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border p-2.5 transition-colors hover:bg-secondary/50"
                    >
                      <div className="min-w-[36px] shrink-0 text-center">
                        <p className="text-[10px] uppercase text-muted-foreground">
                          {d.toLocaleDateString("en", { month: "short" })}
                        </p>
                        <p className="text-lg font-bold leading-none">{d.getDate()}</p>
                      </div>
                      <div className={cn("w-0.5 self-stretch rounded-full", TYPES[event.type].dot)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{event.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[9px] font-medium capitalize",
                              TYPES[event.type].chip
                            )}
                          >
                            {event.type}
                          </span>
                          {event.meta && (
                            <span className="flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              {event.meta}
                            </span>
                          )}
                        </div>
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
