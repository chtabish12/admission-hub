import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncUniversities } from "@/lib/universities-sync";

export const maxDuration = 60;

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await syncUniversities();
  return NextResponse.json({ ok: true, ...result });
}
