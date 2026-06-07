import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  company: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  specialties: z.array(z.string()).default([]),
  fields: z.array(z.string()).default([]),
  bio: z.string().min(20, "Please write at least 20 characters"),
  website: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.consultant.upsert({
    where: { userId: user.id },
    update: {
      company: data.company,
      country: data.country,
      city: data.city,
      specialties: JSON.stringify(data.specialties),
      fields: JSON.stringify(data.fields),
      bio: data.bio,
      website: data.website,
      phone: data.phone,
    },
    create: {
      name: user.name,
      email: user.email,
      company: data.company,
      country: data.country,
      city: data.city,
      specialties: JSON.stringify(data.specialties),
      fields: JSON.stringify(data.fields),
      bio: data.bio,
      website: data.website,
      phone: data.phone,
      approved: false,
      source: "PLATFORM",
      userId: user.id,
    },
  });

  // Promote the user's role so they're recognised as a consultant.
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "CONSULTANT" },
  });

  return NextResponse.json({ ok: true });
}
