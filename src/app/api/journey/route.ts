import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  stepKey: z.string().min(1),
  completed: z.boolean(),
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

  const { stepKey, completed } = parsed.data;
  await prisma.stepProgress.upsert({
    where: { userId_stepKey: { userId: session.userId, stepKey } },
    update: { completed },
    create: { userId: session.userId, stepKey, completed },
  });

  return NextResponse.json({ ok: true });
}
