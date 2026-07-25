import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui";
import { SCHOLARSHIPS, computeMatch } from "@/lib/scholarships";
import { ScholarshipBrowser } from "@/components/portal/scholarship-browser";

export const dynamic = "force-dynamic";

export default async function PortalScholarshipsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT" && session.role !== "ADMIN") redirect("/portal");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  const profile = {
    preferredCountry: user?.preferredCountry,
    cgpa: user?.cgpa,
    ieltsScore: user?.ieltsScore,
    workExperience: user?.workExperience,
    budget: user?.budget,
  };

  const scholarships = SCHOLARSHIPS.map((s) => ({
    ...s,
    match: computeMatch(profile, s),
  }));

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Scholarship Engine</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {scholarships.length} scholarships available · Matched to your profile
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Your Profile Match</p>
            <p className="text-xs text-muted-foreground">
              Matched against your profile —{" "}
              <Link href="/portal/settings" className="underline hover:text-foreground">
                update your profile
              </Link>{" "}
              to improve matches
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">CGPA</p>
              <p className="text-lg font-bold">{user?.cgpa ?? "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">IELTS</p>
              <p className="text-lg font-bold">{user?.ieltsScore ?? "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-lg font-bold">
                {user?.budget != null ? `$${Math.round(user.budget / 1000)}K` : "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <ScholarshipBrowser scholarships={scholarships} />
    </div>
  );
}
