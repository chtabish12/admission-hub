import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Search, MapPin, RefreshCw, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fetchUniversitiesForCountry } from "@/lib/universities-sync";
import { buildUniversityWhere, UNIVERSITY_ORDER } from "@/lib/university-query";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { COUNTRIES } from "@/lib/constants";
import { cn, formatMoney, parseList } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type DirectoryStatus = "open" | "upcoming" | "closed";

const STATUS_CONFIG: Record<DirectoryStatus, { label: string; classes: string }> = {
  open: {
    label: "Admissions Open",
    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  upcoming: {
    label: "Upcoming Intake",
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  closed: {
    label: "Admissions Closed",
    classes: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/);
  return ((words[0]?.[0] ?? "U") + (words[1]?.[0] ?? "")).toUpperCase();
}

function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function deriveStatus(deadlines: string | null): DirectoryStatus {
  const list = parseList<{ term: string; date: string }>(deadlines);
  if (list.length === 0) return "open";
  const now = Date.now();
  const dates = list
    .map((d) => new Date(d.date).getTime())
    .filter((t) => !Number.isNaN(t));
  if (dates.length === 0) return "open";
  const future = dates.filter((t) => t >= now);
  if (future.length === 0) return "closed";
  const halfYear = 1000 * 60 * 60 * 24 * 180;
  return Math.min(...future) - now > halfYear ? "upcoming" : "open";
}

function nextIntakes(): string[] {
  const now = new Date();
  const sepYear = now.getMonth() < 8 ? now.getFullYear() : now.getFullYear() + 1;
  return [`Sep ${sepYear}`, `Jan ${sepYear + 1}`];
}

async function syncLatest(formData: FormData) {
  "use server";
  const country = String(formData.get("country") ?? "").trim();
  if (country) await fetchUniversitiesForCountry(country);
  revalidatePath("/portal/universities");
}

export default async function PortalUniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; country?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT" && session.role !== "ADMIN") redirect("/portal");

  const sp = await searchParams;
  const where = buildUniversityWhere({ q: sp.q, country: sp.country });

  const rows = await prisma.university.findMany({
    where,
    orderBy: UNIVERSITY_ORDER,
  });

  const withStatus = rows.map((u) => ({ ...u, status: deriveStatus(u.deadlines) }));
  const filtered =
    sp.status && sp.status in STATUS_CONFIG
      ? withStatus.filter((u) => u.status === sp.status)
      : withStatus;
  const shown = filtered.slice(0, PAGE_SIZE);
  const intakes = nextIntakes();

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">University Directory</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Showing {shown.length} of {filtered.length} universities · Data synced from official sources
          </p>
        </div>
      </div>

      <Card className="p-4">
        <form method="GET" className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search universities, programs, countries..."
              className="pl-9"
            />
          </div>

          <Select name="country" defaultValue={sp.country ?? ""}>
            <option value="">All Countries</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Select name="status" defaultValue={sp.status ?? ""}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="upcoming">Upcoming</option>
            <option value="closed">Closed</option>
          </Select>

          <Button type="submit">
            <Search className="h-4 w-4" /> Search
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {sp.country
              ? `Sync pulls the latest ${sp.country} universities from online sources.`
              : "Pick a country filter to enable syncing the latest data online."}
          </p>
          <form action={syncLatest}>
            <input type="hidden" name="country" value={sp.country ?? ""} />
            <Button variant="outline" size="sm" type="submit" disabled={!sp.country}>
              <RefreshCw className="h-3.5 w-3.5" /> Sync latest data
            </Button>
          </form>
        </div>
      </Card>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mb-1 font-medium">No universities found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((uni) => {
            const h = hueFromName(uni.name);
            const status = STATUS_CONFIG[uni.status];
            const programs = parseList(uni.fields).length;
            return (
              <Card key={uni.id} className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, hsl(${h} 65% 52%), hsl(${(h + 45) % 360} 70% 42%))`,
                      }}
                    >
                      {initials(uni.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold leading-tight">{uni.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {uni.city}, {uni.country}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium",
                      status.classes
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-[9px] uppercase text-muted-foreground">Ranking</p>
                    <p className="text-base font-bold">{uni.ranking != null ? `#${uni.ranking}` : "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-[9px] uppercase text-muted-foreground">Accept</p>
                    <p className="text-base font-bold">
                      {uni.acceptanceRate != null ? `${uni.acceptanceRate}%` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-[9px] uppercase text-muted-foreground">Programs</p>
                    <p className="text-base font-bold">{programs}</p>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-xs text-muted-foreground">Tuition</span>
                  <span className="font-medium">
                    {formatMoney(uni.tuitionMin, uni.currency)} – {formatMoney(uni.tuitionMax, uni.currency)}
                    <span className="text-muted-foreground"> / yr</span>
                  </span>
                </div>

                <div className="mb-4">
                  <p className="mb-1.5 text-[10px] text-muted-foreground">INTAKES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {intakes.map((intake) => (
                      <Badge key={intake} className="text-[10px]">
                        {intake}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-auto flex gap-2 border-t border-border pt-4">
                  <Link href={`/universities/${uni.id}/apply`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Apply Now
                    </Button>
                  </Link>
                  <Link href={`/universities/${uni.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
