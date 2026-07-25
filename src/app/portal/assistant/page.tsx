import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AssistantView } from "@/components/portal/assistant-view";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect("/portal");

  return <AssistantView userName={session.name} />;
}
