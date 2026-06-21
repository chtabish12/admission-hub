import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { UniversityFilters } from "@/components/university-filters";
import { UniversityResults } from "@/components/university-results";
import {
  buildUniversityWhere,
  PAGE_SIZE,
  UNIVERSITY_ORDER,
  type UniversitySearchParams,
} from "@/lib/university-query";

export const dynamic = "force-dynamic";

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<UniversitySearchParams>;
}) {
  const sp = await searchParams;
  const where = buildUniversityWhere(sp);

  const [universities, total] = await Promise.all([
    prisma.university.findMany({
      where,
      orderBy: UNIVERSITY_ORDER,
      take: PAGE_SIZE,
    }),
    prisma.university.count({ where }),
  ]);

  // Filter params (without `page`) forwarded to the "Load more" API calls, and
  // used as a remount key so results reset whenever the filters change.
  const query = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => Boolean(v)) as [string, string][]
  ).toString();

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Find your university</h1>
        <p className="mt-1 text-muted-foreground">
          Filter by country, field of interest and budget to discover your match.
        </p>
      </div>

      <Suspense>
        <UniversityFilters />
      </Suspense>

      <UniversityResults
        key={query}
        initial={universities}
        total={total}
        query={query}
        course={sp.field}
      />
    </div>
  );
}
