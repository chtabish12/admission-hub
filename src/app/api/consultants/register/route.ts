import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: d.email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(d.password);
    const user = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash,
        role: "CONSULTANT",
        consultant: {
          create: {
            name: d.name,
            email: d.email,
            company: d.company,
            country: d.country,
            city: d.city,
            specialties: JSON.stringify(d.specialties),
            fields: JSON.stringify(d.fields),
            bio: d.bio,
            website: d.website,
            phone: d.phone,
            approved: false,
            source: "PLATFORM",
          },
        },
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
