"use client";

import { useEffect, useState } from "react";

/** First letters of up to two words, e.g. "Stanford University" -> "SU". */
function initials(name: string): string {
  const words = name.replace(/[^a-zA-Z ]/g, "").trim().split(/\s+/);
  const first = words[0]?.[0] ?? "U";
  const second = words[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

/** Deterministic hue (0-359) from the name so each card has a stable colour. */
function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

type Img = { url: string; kind: "image" | "icon" };

/**
 * Always renders a thumbnail: a coloured gradient with initials as the base,
 * with a real photo/logo layered on top. If no `imageUrl` is supplied it lazily
 * fetches one from the image API (og:image → favicon), cached server-side.
 */
export function UniversityThumb({
  imageUrl,
  name,
  universityId,
  website,
}: {
  imageUrl: string | null;
  name: string;
  universityId?: string;
  website?: string | null;
}) {
  const [img, setImg] = useState<Img | null>(
    imageUrl ? { url: imageUrl, kind: "image" } : null
  );
  const [failed, setFailed] = useState(false);
  const h = hueFromName(name);

  useEffect(() => {
    let active = true;
    if (img || !universityId || !website) return;
    fetch(`/api/universities/${universityId}/image`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.imageUrl) {
          setImg({ url: data.imageUrl, kind: data.kind ?? "image" });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [img, universityId, website]);

  return (
    <div
      className="relative h-full w-full"
      style={{
        background: `linear-gradient(135deg, hsl(${h} 65% 52%), hsl(${(h + 45) % 360} 70% 42%))`,
      }}
    >
      <div className="flex h-full items-center justify-center">
        <span className="text-4xl font-bold tracking-wide text-white/90">
          {initials(name)}
        </span>
      </div>

      {img && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img.url}
          alt={name}
          onError={() => setFailed(true)}
          className={
            img.kind === "icon"
              ? "absolute inset-0 h-full w-full bg-white object-contain p-6"
              : "absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          }
        />
      )}
    </div>
  );
}
