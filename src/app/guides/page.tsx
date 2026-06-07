import Link from "next/link";
import { ArrowRight, BookOpenCheck, Clock, GraduationCap } from "lucide-react";
import { GUIDES, formatGuideCost, totalsByCurrency } from "@/lib/guides";
import { Card, Badge } from "@/components/ui";

export const metadata = {
  title: "Guides — AdmissionHub",
  description: "Real, step-by-step admission & visa guides with documents and costs.",
};

export default function GuidesPage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="mb-4 gap-1.5">
          <BookOpenCheck className="h-3.5 w-3.5" /> Step-by-step guides
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          Real admission & visa guides
        </h1>
        <p className="mt-4 text-muted-foreground">
          Detailed, no-fluff walkthroughs — every step, the documents you need,
          and what it actually costs. Written from real student experiences.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
        {GUIDES.map((g) => {
          const totals = totalsByCurrency(g.steps);
          return (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="group">
              <Card className="flex h-full flex-col p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-4xl">{g.flag}</span>
                  <Badge variant="outline">{g.steps.length} steps</Badge>
                </div>
                <h2 className="text-lg font-semibold group-hover:text-primary">
                  {g.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {g.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> {g.level}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {g.durationNote}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                  {Object.entries(totals).map(([cur, t]) => (
                    <Badge key={cur}>
                      {formatGuideCost({ amount: t.amount, currency: cur as never })}
                    </Badge>
                  ))}
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read the guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
