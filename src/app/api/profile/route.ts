import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

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

const emptyToNull = (v: unknown) => (v === "" ? null : v);

const nullableFloat = (max: number) =>
  z.preprocess(emptyToNull, z.coerce.number().min(0).max(max).nullable()).optional();

const nullableInt = (max: number) =>
  z.preprocess(emptyToNull, z.coerce.number().int().min(0).max(max).nullable()).optional();

const nullableString = (max: number) =>
  z.preprocess(emptyToNull, z.string().max(max).nullable()).optional();

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  fieldOfInterest: nullableString(100),
  preferredCountry: nullableString(100),
  preferredCity: nullableString(100),
  educationLevel: nullableString(100),
  cgpa: nullableFloat(4),
  budget: nullableInt(10_000_000),
  ieltsScore: nullableFloat(9),
  toeflScore: nullableInt(120),
  workExperience: nullableInt(60),
  preferredIntake: nullableString(60),
  careerGoals: nullableString(2000),
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: z.string().min(8).max(200).optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { currentPassword, newPassword, ...profile } = parsed.data;

  if (currentPassword !== undefined || newPassword !== undefined) {
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current and new password are required" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return NextResponse.json({ ok: true });
  }

  const data = Object.fromEntries(
    Object.entries(profile).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: session.userId }, data });
  }

  return NextResponse.json({ ok: true });
}
