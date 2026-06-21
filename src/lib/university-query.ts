import type { Prisma } from "@prisma/client";

export const PAGE_SIZE = 9;

export type UniversitySearchParams = {
  q?: string;
  country?: string;
  field?: string;
  maxTuition?: string;
};

/** Builds the Prisma `where` clause shared by the listing page and the paginated API. */
export function buildUniversityWhere(
  sp: UniversitySearchParams
): Prisma.UniversityWhereInput {
  const where: Prisma.UniversityWhereInput = {};

  if (sp.q) {
    const term = sp.q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { city: { contains: term, mode: "insensitive" } },
      { country: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { fields: { contains: term, mode: "insensitive" } },
    ];
  }
  if (sp.country) where.country = sp.country;
  if (sp.field) where.fields = { contains: sp.field, mode: "insensitive" };
  if (sp.maxTuition) where.tuitionMin = { lte: Number(sp.maxTuition) };

  return where;
}

// Ranked universities first, then a stable secondary key so pagination never
// drops or repeats a row across pages.
export const UNIVERSITY_ORDER: Prisma.UniversityOrderByWithRelationInput[] = [
  { ranking: { sort: "asc", nulls: "last" } },
  { id: "asc" },
];
