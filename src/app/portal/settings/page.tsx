import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  SettingsClient,
  type SettingsUser,
} from "@/components/portal/settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!dbUser) redirect("/login");

  const user: SettingsUser = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    fieldOfInterest: dbUser.fieldOfInterest,
    preferredCountry: dbUser.preferredCountry,
    educationLevel: dbUser.educationLevel,
    cgpa: dbUser.cgpa,
    budget: dbUser.budget,
    ieltsScore: dbUser.ieltsScore,
    toeflScore: dbUser.toeflScore,
    workExperience: dbUser.workExperience,
    preferredIntake: dbUser.preferredIntake,
    careerGoals: dbUser.careerGoals,
  };

  return <SettingsClient user={user} />;
}
