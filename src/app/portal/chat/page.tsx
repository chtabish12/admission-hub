import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ChatClient, type Conversation } from "@/components/portal/chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT" && session.role !== "UNIVERSITY") redirect("/portal");

  let where = {};
  if (session.role === "STUDENT") {
    where = { studentId: session.userId };
  } else {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.universityId) {
      return (
        <ChatClient
          conversations={[]}
          currentUserId={session.userId}
          initialSelectedId={null}
        />
      );
    }
    where = { universityId: user.universityId };
  }

  const apps = await prisma.application.findMany({
    where,
    include: {
      university: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: {
          messages: { where: { read: false, senderId: { not: session.userId } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const conversations: Conversation[] = apps
    .map((a) => ({
      id: a.id,
      name: session.role === "STUDENT" ? a.university.name : a.fullName,
      course: a.course,
      lastMessage: a.messages[0]?.content ?? null,
      lastMessageAt: (a.messages[0]?.createdAt ?? a.createdAt).toISOString(),
      unread: a._count.messages,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

  const { c } = await searchParams;
  const initialSelectedId =
    c && conversations.some((conv) => conv.id === c)
      ? c
      : conversations[0]?.id ?? null;

  return (
    <ChatClient
      conversations={conversations}
      currentUserId={session.userId}
      initialSelectedId={initialSelectedId}
    />
  );
}
