import Link from "next/link";
import {
  ArrowRight,
  Search,
  Users,
  Map,
  ShieldCheck,
  Globe2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button, Badge, Card } from "@/components/ui";
import { UniversityCard } from "@/components/university-card";
import { JOURNEY_STEPS } from "@/lib/journey";

export default async function HomePage() {
  const universities = await prisma.university.findMany({
    take: 3,
    orderBy: { ranking: "asc" },
  });
  const [uniCount, consultantCount] = await Promise.all([
    prisma.university.count(),
    prisma.consultant.count({ where: { approved: true } }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="container-page relative grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center animate-fade-in">
            <Badge className="mb-5 w-fit gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Your all-in-one admissions platform
            </Badge>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Your journey to the world's <span className="gradient-text">best universities</span> starts here
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Discover universities by field, city and budget. Follow a clear
              step-by-step guide. Connect with verified consultants — and find
              experts near you. All in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Start your journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/universities">
                <Button variant="outline" size="lg">
                  <Search className="h-4 w-4" />
                  Explore universities
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex gap-8">
              <Stat value={`${uniCount}+`} label="Universities" />
              <Stat value={`${consultantCount}+`} label="Verified consultants" />
              <Stat value="8" label="Guided steps" />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <Card className="w-full max-w-md p-6 shadow-xl animate-fade-in">
              <p className="mb-4 text-sm font-semibold text-muted-foreground">
                Your admission roadmap
              </p>
              <div className="space-y-3">
                {JOURNEY_STEPS.slice(0, 5).map((s, i) => (
                  <div key={s.key} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        i < 2
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {i < 2 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.title}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/how-it-works">
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  See full roadmap <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="container-page">
          <SectionHeader
            eyebrow="Everything you need"
            title="One platform, your entire journey"
            subtitle="From discovery to departure — we guide you through every step."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={Search}
              title="Smart university finder"
              desc="Filter by country, city, field of interest and budget to find your perfect match."
            />
            <Feature
              icon={Map}
              title="Step-by-step guide"
              desc="A clear, trackable roadmap from shortlisting to visa and departure."
            />
            <Feature
              icon={ShieldCheck}
              title="Verified consultants"
              desc="Work with approved consultants who signed up and were vetted on our platform."
            />
            <Feature
              icon={Globe2}
              title="Consultants near you"
              desc="Discover more experts sourced live from Google, filtered to your location."
            />
          </div>
        </div>
      </section>

      {/* Featured universities */}
      <section className="py-20">
        <div className="container-page">
          <div className="flex items-end justify-between">
            <SectionHeader
              align="left"
              eyebrow="Top picks"
              title="Featured universities"
              subtitle="A glimpse of where your journey could take you."
            />
            <Link href="/universities" className="hidden sm:block">
              <Button variant="outline">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((u) => (
              <UniversityCard key={u.id} uni={u} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-accent p-10 text-center text-primary-foreground sm:p-16">
          <Users className="mx-auto mb-4 h-10 w-10 opacity-90" />
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to start your admission journey?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Create a free account, build your shortlist, and get matched with
            consultants who will guide you to your dream university.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" variant="secondary">
                Get started free
              </Button>
            </Link>
            <Link href="/become-consultant">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                Become a consultant
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Card className="p-6 transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}
