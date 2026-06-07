import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  GraduationCap,
  FileText,
  Info,
  Wallet,
  RotateCcw,
} from "lucide-react";
import {
  GUIDES,
  getGuide,
  formatGuideCost,
  totalsByCurrency,
} from "@/lib/guides";
import { Card, Badge, Button } from "@/components/ui";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  return { title: guide ? `${guide.title} — AdmissionHub` : "Guide" };
}

export default async function GuideDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const totals = totalsByCurrency(guide.steps);

  return (
    <div className="container-page max-w-4xl py-10">
      <Link
        href="/guides"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All guides
      </Link>

      <div className="flex items-start gap-4">
        <span className="text-5xl">{guide.flag}</span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{guide.title}</h1>
          <p className="mt-2 text-muted-foreground">{guide.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> {guide.level}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {guide.durationNote}
            </span>
          </div>
        </div>
      </div>

      {/* Cost summary */}
      <Card className="mt-6 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4 text-primary" /> Estimated total cost
        </h2>
        <div className="mt-3 flex flex-wrap gap-6">
          {Object.entries(totals).map(([cur, t]) => (
            <div key={cur}>
              <p className="text-2xl font-bold">
                {formatGuideCost({ amount: t.amount, currency: cur as never })}
              </p>
              {t.refundable > 0 && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3" />
                  incl.{" "}
                  {formatGuideCost({ amount: t.refundable, currency: cur as never })}{" "}
                  refundable
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {guide.currencyNote}
        </p>
      </Card>

      {/* Steps timeline */}
      <div className="mt-8 space-y-5">
        {guide.steps.map((step, i) => {
          const isFinal = i === guide.steps.length - 1;
          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
                  {isFinal ? "★" : i + 1}
                </div>
                {!isFinal && <div className="my-1 w-0.5 flex-1 bg-border" />}
              </div>

              <Card className="mb-2 flex-1 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{step.title}</h3>
                  <Badge variant={step.cost.amount === 0 ? "success" : "default"}>
                    {formatGuideCost(step.cost)}
                  </Badge>
                </div>

                {step.cost.note && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <RotateCcw className="h-3 w-3" /> {step.cost.note}
                  </p>
                )}

                {step.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                )}

                {step.bullets && (
                  <ul className="mt-3 space-y-1.5">
                    {step.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {step.documents && (
                  <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                      <FileText className="h-3.5 w-3.5" /> Documents you'll need
                    </p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {step.documents.map((d) => (
                        <span
                          key={d}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Card className="mt-10 bg-gradient-to-br from-primary to-accent p-8 text-center text-primary-foreground">
        <h2 className="text-2xl font-bold">Want help with these steps?</h2>
        <p className="mx-auto mt-2 max-w-md text-primary-foreground/90">
          Connect with a verified consultant who specialises in {guide.country}{" "}
          admissions and visas.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/consultants?country=${encodeURIComponent(guide.country)}`}>
            <Button variant="secondary" size="lg">
              Find a {guide.country} consultant
            </Button>
          </Link>
          <Link href="/universities">
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Browse universities
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
