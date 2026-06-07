import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Compass, Users, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Button } from "@/components/ui";
import { JourneyTracker } from "@/components/journey-tracker";
import { ProfileForm } from "@/components/profile-form";
import { UniversityCard } from "@/components/university-card";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, progress, saved] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.stepProgress.findMany({
      where: { userId: session.userId, completed: true },
    }),
    prisma.savedUniversity.findMany({
      where: { userId: session.userId },
      include: { university: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  const completedKeys = progress.map((p) => p.stepKey);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your progress and continue your journey to university.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/universities"
          icon={Compass}
          title="Find universities"
          desc="Search & shortlist"
        />
        <QuickLink
          href="/consultants"
          icon={Users}
          title="Find consultants"
          desc="Verified & nearby experts"
        />
        <QuickLink
          href="/become-consultant"
          icon={Users}
          title="Become a consultant"
          desc="Join our network"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Your admission roadmap</h2>
          <JourneyTracker initialCompleted={completedKeys} />
        </div>

        <div className="space-y-6">
          <ProfileForm user={user} />

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Bookmark className="h-4 w-4" /> Saved universities
              </h3>
              <span className="text-sm text-muted-foreground">
                {saved.length}
              </span>
            </div>
            {saved.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t saved any universities yet.
                </p>
                <Link href="/universities">
                  <Button variant="outline" size="sm" className="mt-3">
                    Browse universities
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <Link
                    key={s.id}
                    href={`/universities/${s.university.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {s.university.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.university.city}, {s.university.country}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {saved.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Your shortlist</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <UniversityCard key={s.id} uni={s.university} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </Card>
    </Link>
  );
}
