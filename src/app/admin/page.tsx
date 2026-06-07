import { redirect } from "next/navigation";
import { ShieldCheck, GraduationCap, Users, Clock, MapPin } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { ApproveControls, SyncUniversitiesButton } from "@/components/admin-controls";
import { parseList } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const [pending, approved, uniCount, studentCount] = await Promise.all([
    prisma.consultant.findMany({
      where: { approved: false, source: "PLATFORM" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultant.findMany({
      where: { approved: true, source: "PLATFORM" },
      orderBy: { rating: "desc" },
    }),
    prisma.university.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
  ]);

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <ShieldCheck className="h-7 w-7 text-primary" /> Admin dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Approve consultants and keep university data up to date.
          </p>
        </div>
        <SyncUniversitiesButton />
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-4">
        <StatCard icon={Clock} label="Pending consultants" value={pending.length} />
        <StatCard icon={Users} label="Approved consultants" value={approved.length} />
        <StatCard icon={GraduationCap} label="Universities" value={uniCount} />
        <StatCard icon={Users} label="Students" value={studentCount} />
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">
          Pending approvals ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No consultants awaiting approval. 🎉
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <ConsultantRow key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Approved consultants ({approved.length})
        </h2>
        <div className="space-y-3">
          {approved.map((c) => (
            <ConsultantRow key={c.id} c={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function ConsultantRow({
  c,
}: {
  c: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    country: string;
    city: string;
    bio: string;
    fields: string;
    approved: boolean;
  };
}) {
  const fields = parseList(c.fields);
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{c.name}</p>
          {c.approved ? (
            <Badge variant="success">Approved</Badge>
          ) : (
            <Badge>Pending</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {c.company ? `${c.company} · ` : ""}
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {c.city}, {c.country}
          </span>
          {c.email ? ` · ${c.email}` : ""}
        </p>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{c.bio}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {fields.map((f) => (
            <Badge key={f} variant="outline">
              {f}
            </Badge>
          ))}
        </div>
      </div>
      <ApproveControls consultantId={c.id} approved={c.approved} />
    </Card>
  );
}
