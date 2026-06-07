import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  consultantId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { consultantId, action } = parsed.data;

  if (action === "approve") {
    await prisma.consultant.update({
      where: { id: consultantId },
      data: { approved: true },
    });
  } else {
    await prisma.consultant.update({
      where: { id: consultantId },
      data: { approved: false },
    });
  }

  return NextResponse.json({ ok: true });
}
