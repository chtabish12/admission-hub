import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const documents = await prisma.document.findMany({
    where: { userId: session.userId },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json({ documents });
}

const postSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(60),
  url: z.string().trim().url().max(2000),
  expiryDate: z.string().trim().max(30).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, type, url, expiryDate } = parsed.data;
  const sameName = await prisma.document.count({
    where: { userId: session.userId, name },
  });
  const document = await prisma.document.create({
    data: {
      userId: session.userId,
      name,
      type,
      url,
      expiryDate: expiryDate || null,
      version: sameName + 1,
    },
  });
  return NextResponse.json({ ok: true, document });
}
