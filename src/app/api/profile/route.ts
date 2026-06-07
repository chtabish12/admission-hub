import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).optional(),
  fieldOfInterest: z.string().optional(),
  preferredCountry: z.string().optional(),
  preferredCity: z.string().optional(),
  educationLevel: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
