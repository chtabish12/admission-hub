import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({ universityId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { universityId } = parsed.data;

  const existing = await prisma.savedUniversity.findUnique({
    where: { userId_universityId: { userId: session.userId, universityId } },
  });

  if (existing) {
    await prisma.savedUniversity.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }

  await prisma.savedUniversity.create({
    data: { userId: session.userId, universityId },
  });
  return NextResponse.json({ saved: true });
}
