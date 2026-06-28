import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toExternalUrl } from "@/lib/utils";

export const maxDuration = 30;

type Found = { url: string; kind: "image" | "icon" };

function attr(html: string, tag: RegExp, valueAttr: string): string | null {
  const m = html.match(tag);
  if (!m) return null;
  const block = m[0];
  const v = block.match(
    new RegExp(`${valueAttr}\\s*=\\s*["']([^"']+)["']`, "i")
  );
  return v?.[1] ?? null;
}

/** Extract the best preview image (og/twitter) or an icon from page HTML. */
function extractImage(html: string, base: string): Found | null {
  const ogTags = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]*>/i,
  ];
  for (const tag of ogTags) {
    const raw = attr(html, tag, "content");
    const abs = resolve(raw, base);
    if (abs) return { url: abs, kind: "image" };
  }

  const iconTags = [
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*>/i,
    /<link[^>]+rel=["'][^"']*(?:shortcut )?icon[^"']*["'][^>]*>/i,
  ];
  for (const tag of iconTags) {
    const raw = attr(html, tag, "href");
    const abs = resolve(raw, base);
    if (abs) return { url: abs, kind: "icon" };
  }
  return null;
}

function resolve(value: string | null, base: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const uni = await prisma.university.findUnique({
    where: { id },
    select: { id: true, imageUrl: true, website: true },
  });
  if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Already cached.
  if (uni.imageUrl) {
    return NextResponse.json({ imageUrl: uni.imageUrl, kind: "image" });
  }

  const website = toExternalUrl(uni.website);
  if (!website) return NextResponse.json({ imageUrl: null });

  const host = new URL(website).hostname;
  const faviconFallback = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;

  let found: Found | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(website, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (AdmissionHub thumbnail fetcher)" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (res.ok) {
      const html = (await res.text()).slice(0, 200_000);
      found = extractImage(html, res.url || website);
    }
  } catch {
    // ignore — fall back to favicon
  }

  const result: Found = found ?? { url: faviconFallback, kind: "icon" };

  // Cache only real preview images on the record (icons stay dynamic so a real
  // og:image can replace them later if the site adds one).
  if (result.kind === "image") {
    await prisma.university
      .update({ where: { id }, data: { imageUrl: result.url } })
      .catch(() => {});
  }

  return NextResponse.json({ imageUrl: result.url, kind: result.kind });
}
