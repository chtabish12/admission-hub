import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildUniversityWhere,
  PAGE_SIZE,
  UNIVERSITY_ORDER,
} from "@/lib/university-query";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const where = buildUniversityWhere({
    q: searchParams.get("q") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    field: searchParams.get("field") ?? undefined,
    maxTuition: searchParams.get("maxTuition") ?? undefined,
  });

  const [universities, total] = await Promise.all([
    prisma.university.findMany({
      where,
      orderBy: UNIVERSITY_ORDER,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.university.count({ where }),
  ]);

  return NextResponse.json({
    universities,
    total,
    page,
    hasMore: page * PAGE_SIZE < total,
  });
}
