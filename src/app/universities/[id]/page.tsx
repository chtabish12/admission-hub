import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  TrendingUp,
  Trophy,
  Globe,
  Wallet,
  CheckCircle2,
  CalendarDays,
  ArrowLeft,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, Badge, Button } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import { formatMoney, parseList } from "@/lib/utils";

type Step = { title: string; description: string };
type Deadline = { term: string; date: string };

export default async function UniversityDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uni = await prisma.university.findUnique({ where: { id } });
  if (!uni) notFound();

  const session = await getSession();
  let initialSaved = false;
  if (session) {
    const saved = await prisma.savedUniversity.findUnique({
      where: { userId_universityId: { userId: session.userId, universityId: id } },
    });
    initialSaved = !!saved;
  }

  const fields = parseList(uni.fields);
  const requirements = parseList(uni.requirements);
  const steps = parseList<Step>(uni.applicationSteps);
  const deadlines = parseList<Deadline>(uni.deadlines);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 w-full overflow-hidden bg-secondary sm:h-80">
        {uni.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={uni.imageUrl}
            alt={uni.name}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-6">
          <Link
            href="/universities"
            className="mb-3 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to universities
          </Link>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            {uni.name}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-white/90">
            <MapPin className="h-4 w-4" />
            {uni.city}, {uni.country}
          </p>
        </div>
      </div>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-8 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton
              universityId={uni.id}
              initialSaved={initialSaved}
              isLoggedIn={!!session}
            />
            {uni.website && (
              <a href={uni.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <Globe className="h-4 w-4" /> Official website
                </Button>
              </a>
            )}
            <Link href="/consultants">
              <Button variant="secondary">
                <Users className="h-4 w-4" /> Get consultancy
              </Button>
            </Link>
          </div>

          <section>
            <h2 className="mb-3 text-xl font-semibold">About</h2>
            <p className="text-muted-foreground">{uni.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {fields.map((f) => (
                <Badge key={f} variant="outline">
                  {f}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">Admission requirements</h2>
            <Card className="divide-y divide-border">
              {requirements.map((r) => (
                <div key={r} className="flex items-start gap-3 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <span className="text-sm">{r}</span>
                </div>
              ))}
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">
              Step-by-step application process
            </h2>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                      {i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="my-1 w-0.5 flex-1 bg-border" />
                    )}
                  </div>
                  <Card className="mb-2 flex-1 p-4">
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.description}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Key facts</h3>
            <div className="space-y-4">
              <Fact
                icon={Wallet}
                label="Tuition (per year)"
                value={`${formatMoney(uni.tuitionMin, uni.currency)} – ${formatMoney(
                  uni.tuitionMax,
                  uni.currency
                )}`}
              />
              {uni.ranking && (
                <Fact
                  icon={Trophy}
                  label="World ranking"
                  value={`#${uni.ranking}`}
                />
              )}
              {uni.acceptanceRate != null && (
                <Fact
                  icon={TrendingUp}
                  label="Acceptance rate"
                  value={`${uni.acceptanceRate}%`}
                />
              )}
              <Fact
                icon={MapPin}
                label="Location"
                value={`${uni.city}, ${uni.country}`}
              />
            </div>
          </Card>

          {deadlines.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <CalendarDays className="h-4 w-4" /> Application deadlines
              </h3>
              <div className="space-y-3">
                {deadlines.map((d) => (
                  <div
                    key={d.term}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{d.term}</span>
                    <span className="font-medium">{d.date}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground">
            <h3 className="font-semibold">Need guidance?</h3>
            <p className="mt-1 text-sm text-primary-foreground/90">
              Connect with a verified consultant who specialises in {uni.country}.
            </p>
            <Link href={`/consultants?country=${encodeURIComponent(uni.country)}`}>
              <Button variant="secondary" className="mt-4 w-full">
                Find a consultant
              </Button>
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
