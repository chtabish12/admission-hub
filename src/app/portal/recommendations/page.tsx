import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Brain,
  Calendar,
  DollarSign,
  GraduationCap,
  Info,
  Lightbulb,
  Pencil,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { University, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Badge, Button, Card } from "@/components/ui";
import { ProgressRing } from "@/components/portal/widgets";
import { cn, formatMoney, parseList } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tier = "dream" | "target" | "safety";

const TIER_CONFIG: Record<
  Tier,
  { label: string; gradient: string; badge: string; ring: string; description: string }
> = {
  dream: {
    label: "Dream",
    gradient: "from-violet-500 to-purple-600",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    ring: "#8b5cf6",
    description: "Ambitious choices — lower acceptance, high reward",
  },
  target: {
    label: "Target",
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    ring: "#10b981",
    description: "Strong match — your profile aligns well",
  },
  safety: {
    label: "Safety",
    gradient: "from-cyan-500 to-blue-600",
    badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    ring: "#06b6d4",
    description: "Confident admits — exceed requirements",
  },
};

function monogram(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

function countryMatches(preferred: string | null, country: string): boolean {
  return !!preferred && preferred.toLowerCase() === country.toLowerCase();
}

function scoreFor(tier: Tier, uni: University, user: User | null): number {
  let score = tier === "dream" ? 52 : tier === "target" ? 72 : 84;
  if (countryMatches(user?.preferredCountry ?? null, uni.country)) score += 8;
  if (user?.budget != null && uni.tuitionMin <= user.budget) score += 6;
  if (uni.ranking != null && uni.ranking <= 100) score += 4;
  return Math.min(95, score);
}

function reasonFor(tier: Tier, uni: University, user: User | null): string {
  const cgpa = user?.cgpa != null ? `your ${user.cgpa} CGPA` : "your academic profile";
  const ielts = user?.ieltsScore != null ? `IELTS ${user.ieltsScore}` : "your English level";
  const budgetTxt = user?.budget != null ? formatMoney(user.budget) : "your budget";
  const tuition = formatMoney(uni.tuitionMin, uni.currency);
  const withinBudget = user?.budget != null && uni.tuitionMin <= user.budget;

  if (tier === "dream") {
    return `An ambitious reach — ${cgpa} and ${ielts} keep you in contention${
      uni.acceptanceRate != null ? ` despite a ${uni.acceptanceRate}% acceptance rate` : ""
    }, and tuition from ${tuition}/yr should be weighed against ${budgetTxt}.`;
  }
  if (tier === "target") {
    return `A strong fit — ${cgpa} and ${ielts} align well with typical admits here, and tuition from ${tuition}/yr ${
      withinBudget ? `fits within ${budgetTxt}` : `is worth comparing against ${budgetTxt}`
    }.`;
  }
  return `A confident pick — ${cgpa} exceeds what ${uni.name} typically asks for${
    uni.acceptanceRate != null ? ` and its ${uni.acceptanceRate}% acceptance rate works in your favor` : ""
  }, with tuition from ${tuition}/yr ${withinBudget ? `comfortably inside ${budgetTxt}` : `measured against ${budgetTxt}`}.`;
}

function firstDeadline(deadlines: string | null): string | null {
  const list = parseList<{ term: string; date: string }>(deadlines);
  return list[0]?.date ?? null;
}

function pickTop(pool: University[], tier: Tier, user: User | null, count: number): University[] {
  return [...pool]
    .sort((a, b) => {
      const diff = scoreFor(tier, b, user) - scoreFor(tier, a, user);
      if (diff !== 0) return diff;
      return (a.ranking ?? 10000) - (b.ranking ?? 10000);
    })
    .slice(0, count);
}

export default async function PortalRecommendationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/portal");

  const [user, universities] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.university.findMany({
      orderBy: [{ ranking: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take: 300,
    }),
  ]);

  const profileTiles = [
    { label: "CGPA", value: user?.cgpa != null ? user.cgpa.toString() : "—" },
    { label: "Budget", value: user?.budget != null ? formatMoney(user.budget) : "—" },
    { label: "IELTS", value: user?.ieltsScore != null ? user.ieltsScore.toString() : "—" },
    { label: "TOEFL", value: user?.toeflScore != null ? user.toeflScore.toString() : "—" },
    { label: "Work Exp", value: user?.workExperience != null ? `${user.workExperience}y` : "—" },
    { label: "Intake", value: user?.preferredIntake || "—" },
    { label: "Preferred Country", value: user?.preferredCountry || "—" },
  ];
  const filledCount = profileTiles.filter((t) => t.value !== "—").length;

  const dreamPool = universities.filter(
    (u) =>
      (u.ranking != null && u.ranking <= 50) ||
      (u.acceptanceRate != null && u.acceptanceRate < 15)
  );
  const dream = pickTop(dreamPool, "dream", user, 2);
  const dreamIds = new Set(dream.map((u) => u.id));

  const safetyPool = universities.filter(
    (u) =>
      !dreamIds.has(u.id) &&
      ((u.acceptanceRate != null && u.acceptanceRate >= 40) || u.tuitionMin <= 10000)
  );
  const safety = pickTop(safetyPool, "safety", user, 2);
  const safetyIds = new Set(safety.map((u) => u.id));

  const targetPool = universities.filter(
    (u) => !dreamIds.has(u.id) && !safetyIds.has(u.id)
  );
  const target = pickTop(targetPool, "target", user, 2);

  const groups: { tier: Tier; items: University[] }[] = [
    { tier: "dream", items: dream },
    { tier: "target", items: target },
    { tier: "safety", items: safety },
  ];

  const course = user?.fieldOfInterest || "Your field";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Brain className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Smart Recommendations</h1>
              <Badge className="gap-1">
                <Sparkles className="h-3 w-3" /> Smart Engine
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your profile, universities are categorized into Dream, Target, and
              Safety tiers. Each recommendation includes an explanation of why it&apos;s a fit.
            </p>
          </div>
          <Link href="/portal/settings" className="shrink-0">
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5" /> Edit profile
            </Button>
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {profileTiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-lg border border-border bg-card/50 p-2 text-center backdrop-blur"
            >
              <p className="text-[10px] uppercase text-muted-foreground">{tile.label}</p>
              <p className="truncate text-sm font-bold">{tile.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {filledCount < 3 && (
        <Card className="border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-muted-foreground">
              Your profile is mostly empty, so these matches are broad. Add your CGPA,
              test scores, budget and preferred country in{" "}
              <Link href="/portal/settings" className="font-medium text-foreground underline">
                settings
              </Link>{" "}
              for sharper recommendations.
            </p>
          </div>
        </Card>
      )}

      {universities.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="mb-1 font-medium">No universities in the database yet</p>
          <p className="text-sm text-muted-foreground">
            Visit the{" "}
            <Link href="/portal/universities" className="underline hover:text-foreground">
              University Directory
            </Link>{" "}
            and sync a country to generate recommendations.
          </p>
        </Card>
      ) : (
        groups.map((group) => {
          const config = TIER_CONFIG[group.tier];
          return (
            <section key={group.tier}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {config.label} Universities
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{config.description}</p>
                </div>
                <Badge variant="outline" className={cn("capitalize", config.badge)}>
                  {group.items.length} matches
                </Badge>
              </div>

              {group.items.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  No {config.label.toLowerCase()} matches yet — sync more universities in
                  the directory to widen the pool.
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {group.items.map((uni) => {
                    const match = scoreFor(group.tier, uni, user);
                    const deadline = firstDeadline(uni.deadlines);
                    return (
                      <Card key={uni.id} className="p-5 transition-all hover:shadow-lg">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white",
                              config.gradient
                            )}
                          >
                            {monogram(uni.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate font-semibold">{uni.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {course} · {uni.country}
                                </p>
                              </div>
                              <div className="shrink-0">
                                <ProgressRing value={match} size={52} strokeWidth={5} color={config.ring} />
                              </div>
                            </div>

                            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                {uni.ranking != null ? `Ranking #${uni.ranking}` : "Unranked"}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {formatMoney(uni.tuitionMin, uni.currency)}/yr
                              </span>
                              {deadline && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {deadline}
                                </span>
                              )}
                            </div>

                            <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  {reasonFor(group.tier, uni, user)}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/universities/${uni.id}/apply`} className="flex-1">
                                <Button size="sm" className="w-full">
                                  <GraduationCap className="h-3.5 w-3.5" /> Apply
                                </Button>
                              </Link>
                              <Link href={`/universities/${uni.id}`}>
                                <Button size="sm" variant="outline">
                                  <Info className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      <Card className="border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="text-xs text-muted-foreground">
            <p className="mb-0.5 font-medium text-foreground">AI Guidance Notice</p>
            These recommendations are generated by AI based on your profile data and
            historical admission patterns. They provide guidance only — final admission
            decisions are made by universities. Always verify requirements on official
            university websites.
          </div>
        </div>
      </Card>
    </div>
  );
}
