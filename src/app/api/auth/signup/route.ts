import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["STUDENT", "UNIVERSITY"]).default("STUDENT"),
  fieldOfInterest: z.string().optional(),
  preferredCountry: z.string().optional(),
  universityId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, password, role, fieldOfInterest, preferredCountry, universityId } =
      parsed.data;

    if (role === "UNIVERSITY") {
      if (!universityId) {
        return NextResponse.json(
          { error: "Select your university" },
          { status: 400 }
        );
      }
      const uni = await prisma.university.findUnique({ where: { id: universityId } });
      if (!uni) {
        return NextResponse.json(
          { error: "University not found" },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        fieldOfInterest: role === "STUDENT" ? fieldOfInterest || null : null,
        preferredCountry: role === "STUDENT" ? preferredCountry || null : null,
        universityId: role === "UNIVERSITY" ? universityId : null,
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({ ok: true, role: user.role });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
