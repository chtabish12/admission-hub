import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { UniversityCard } from "@/components/university-card";
import { UniversityFilters } from "@/components/university-filters";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  country?: string;
  field?: string;
  maxTuition?: string;
};

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const where: Prisma.UniversityWhereInput = {};
  if (sp.q) where.name = { contains: sp.q };
  if (sp.country) where.country = sp.country;
  if (sp.field) where.fields = { contains: sp.field };
  if (sp.maxTuition) where.tuitionMin = { lte: Number(sp.maxTuition) };

  const universities = await prisma.university.findMany({
    where,
    orderBy: { ranking: "asc" },
  });

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

      <p className="mb-4 mt-6 text-sm text-muted-foreground">
        {universities.length} universit{universities.length === 1 ? "y" : "ies"} found
      </p>

      {universities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <SearchX className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No universities match your filters</p>
          <p className="text-sm text-muted-foreground">
            Try widening your search criteria.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => (
            <UniversityCard key={u.id} uni={u} />
          ))}
        </div>
      )}
    </div>
  );
}
