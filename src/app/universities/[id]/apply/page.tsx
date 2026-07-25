import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui";
import { ApplicationForm } from "@/components/application-form";
import { parseList } from "@/lib/utils";

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string }>;
}) {
  const { id } = await params;
  const { course } = await searchParams;

  const session = await getSession();
  if (!session) redirect(`/login?next=/universities/${id}/apply`);
  if (session.role !== "STUDENT") redirect(`/universities/${id}`);

  const [uni, user] = await Promise.all([
    prisma.university.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ]);
  if (!uni) notFound();

  const courses = parseList(uni.fields);
  const preselected = course && courses.includes(course) ? course : "";

  return (
    <div className="container-page max-w-3xl py-10">
      <Link
        href={`/universities/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {uni.name}
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Apply to {uni.name}</h1>
        <p className="mt-1 flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {uni.city}, {uni.country}
        </p>
      </div>

      <Card className="p-6">
        <ApplicationForm
          universityId={uni.id}
          courses={courses}
          preselectedCourse={preselected}
          defaults={{
            fullName: user?.name ?? "",
            email: user?.email ?? "",
            educationLevel: user?.educationLevel ?? "",
          }}
        />
      </Card>
    </div>
  );
}
