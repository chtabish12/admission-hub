import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseList } from "@/lib/utils";
import { Kanban16, type Kanban16App } from "@/components/portal/kanban-16";

export const dynamic = "force-dynamic";

export default async function PortalKanbanPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "UNIVERSITY") redirect("/portal");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { university: { select: { name: true } } },
  });
  if (!user?.universityId || !user.university) redirect("/portal");

  const apps = await prisma.application.findMany({
    where: { universityId: user.universityId },
    include: {
      requirements: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const initialApps: Kanban16App[] = apps.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    nationality: a.nationality,
    educationLevel: a.educationLevel,
    gpa: a.gpa,
    englishTest: a.englishTest,
    course: a.course,
    intake: a.intake,
    status: a.status,
    priority: a.priority,
    statement: a.statement,
    universityNotes: a.universityNotes,
    documents: parseList<{ name: string; url: string }>(a.documents),
    createdAt: a.createdAt.toISOString(),
    requirements: a.requirements.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      documentName: r.documentName,
      documentUrl: r.documentUrl,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
    events: a.events.map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      actor: e.actor,
      createdAt: e.createdAt.toISOString(),
    })),
  }));

  return <Kanban16 initialApps={initialApps} />;
}
