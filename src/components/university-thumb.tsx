"use client";

import { useState } from "react";

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

/**
 * Always renders a thumbnail: a coloured gradient with the university's
 * initials (never "missing"), and a real photo layered on top if `imageUrl`
 * is present and loads successfully.
 */
export function UniversityThumb({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  const [imgOk, setImgOk] = useState(true);
  const h = hueFromName(name);

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

      {imageUrl && imgOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
    </div>
  );
}
