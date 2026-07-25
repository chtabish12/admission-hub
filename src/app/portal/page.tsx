import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { StudentDashboard } from "@/components/portal/views/student-dashboard";
import { UniversityDashboard } from "@/components/portal/views/university-dashboard";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "UNIVERSITY" || session.role === "ADMIN") {
    return <UniversityDashboard userId={session.userId} userName={session.name} />;
  }
  return <StudentDashboard userId={session.userId} userName={session.name} />;
}
