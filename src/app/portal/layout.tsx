import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PortalSidebar } from "@/components/portal/sidebar";
import { PortalTopbar, type PortalNotification } from "@/components/portal/topbar";
import { PortalUIProvider } from "@/components/portal/portal-ui";
import { stageOf } from "@/lib/application-stages";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadNotifications(userId: string, role: string): Promise<PortalNotification[]> {
  if (role === "STUDENT") {
    const events = await prisma.applicationEvent.findMany({
      where: { application: { studentId: userId } },
      include: { application: { include: { university: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return events.map((e, i) => ({
      id: e.id,
      title:
        e.type === "STAGE_CHANGE"
          ? "Application Status Updated"
          : e.type === "REQUIREMENT"
            ? "Document Requested"
            : "Application Update",
      description: `${e.application.university.name} — ${e.message}`,
      type: e.type === "REQUIREMENT" ? "document" : "application",
      timestamp: timeAgo(e.createdAt),
      read: i > 2,
      priority: e.type === "REQUIREMENT" ? "high" : "medium",
    }));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.universityId) return [];
  const apps = await prisma.application.findMany({
    where: { universityId: user.universityId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return apps.map((a, i) => ({
    id: a.id,
    title: a.status === "new" ? "New Application" : "Application Updated",
    description: `${a.fullName} — ${a.course} (${stageOf(a.status).label})`,
    type: "application",
    timestamp: timeAgo(a.createdAt),
    read: i > 2,
    priority: a.status === "new" ? "high" : "medium",
  }));
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "CONSULTANT") redirect("/dashboard");

  const [notifications, unreadMessages] = await Promise.all([
    loadNotifications(session.userId, session.role),
    prisma.message.count({
      where: {
        read: false,
        senderId: { not: session.userId },
        application:
          session.role === "STUDENT"
            ? { studentId: session.userId }
            : { university: { staff: { some: { id: session.userId } } } },
      },
    }),
  ]);

  return (
    <PortalUIProvider>
      <div className="flex min-h-screen bg-background">
        <PortalSidebar
          role={session.role}
          userName={session.name}
          chatBadge={unreadMessages || undefined}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar role={session.role} notifications={notifications} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </PortalUIProvider>
  );
}
