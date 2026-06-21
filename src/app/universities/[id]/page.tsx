import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  TrendingUp,
  Trophy,
  Globe,
  Wallet,
  CalendarDays,
  ArrowLeft,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, Badge, Button } from "@/components/ui";
import { SaveButton } from "@/components/save-button";
import {
  UniversityChecklist,
  type ChecklistSection,
} from "@/components/university-checklist";
import { CourseSelector } from "@/components/course-selector";
import { formatMoney, parseList } from "@/lib/utils";

type Step = { title: string; description: string };
type Deadline = { term: string; date: string };

export default async function UniversityDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const { id } = await params;
  const { course: courseParam } = await searchParams;
  const uni = await prisma.university.findUnique({ where: { id } });
  if (!uni) notFound();

  const fields = parseList(uni.fields);
  const requirements = parseList(uni.requirements);
  const steps = parseList<Step>(uni.applicationSteps);
  const deadlines = parseList<Deadline>(uni.deadlines);

  // The application guide is per-course: pick the requested course (from a
  // filter/link) if the university offers it, otherwise the first one.
  const selectedCourse =
    courseParam && fields.includes(courseParam) ? courseParam : fields[0] ?? "";
  // Progress keys are namespaced by university + course so each program tracks
  // its own checklist independently.
  const keyPrefix = `uni:${id}:course:${selectedCourse}:`;

  const session = await getSession();
  let initialSaved = false;
  let completedSteps: string[] = [];
  if (session) {
    const [saved, progress] = await Promise.all([
      prisma.savedUniversity.findUnique({
        where: { userId_universityId: { userId: session.userId, universityId: id } },
      }),
      prisma.stepProgress.findMany({
        where: {
          userId: session.userId,
          completed: true,
          stepKey: { startsWith: keyPrefix },
        },
        select: { stepKey: true },
      }),
    ]);
    initialSaved = !!saved;
    completedSteps = progress.map((p) => p.stepKey);
  }

  // Build the per-course guide: requirements to prepare + application steps.
  const checklistSections: ChecklistSection[] = [];
  if (requirements.length > 0) {
    checklistSections.push({
      label: "Get ready — prepare these",
      items: requirements.map((r, i) => ({ key: `${keyPrefix}req:${i}`, title: r })),
    });
  }
  if (steps.length > 0) {
    checklistSections.push({
      label: "Apply — step by step",
      items: steps.map((s, i) => ({
        key: `${keyPrefix}step:${i}`,
        title: s.title,
        description: s.description,
      })),
    });
  }

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

          {checklistSections.length > 0 && (
            <section>
              <h2 className="mb-1 text-xl font-semibold">
                Your application guide
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Pick your course, then tick off each requirement and step — your
                progress for {selectedCourse || "this program"} at {uni.name} is
                saved separately and automatically.
              </p>
              {fields.length > 0 && (
                <div className="mb-4">
                  <CourseSelector courses={fields} selected={selectedCourse} />
                </div>
              )}
              <UniversityChecklist
                key={selectedCourse}
                sections={checklistSections}
                initialCompleted={completedSteps}
                isLoggedIn={!!session}
              />
            </section>
          )}
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
