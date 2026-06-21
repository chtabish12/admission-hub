import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchUniversitiesForCountry } from "@/lib/universities-sync";

export const maxDuration = 60;

const schema = z.object({
  country: z.string().trim().min(2).max(60),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid country" }, { status: 400 });
  }

  const result = await fetchUniversitiesForCountry(parsed.data.country);
  return NextResponse.json({ ok: true, ...result });
}
