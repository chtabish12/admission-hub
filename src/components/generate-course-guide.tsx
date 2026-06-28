"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Triggers AI generation of course-specific fees, requirements and steps for a
 * given university + course, then refreshes so the page shows the real data.
 */
export function GenerateCourseGuide({
  universityId,
  course,
  hasGuide,
  notes,
}: {
  universityId: string;
  course: string;
  hasGuide: boolean;
  notes?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/universities/${universityId}/course-guide`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't generate the guide. Try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (hasGuide) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
        <p className="flex items-center gap-1.5 font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Course-specific guide for {course}
        </p>
        {notes && <p className="mt-1 text-muted-foreground">{notes}</p>}
        <button
          onClick={generate}
          disabled={loading}
          className="mt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {loading ? "Refreshing…" : "Regenerate"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <p className="text-sm">
        These are generic requirements & fees. Generate the real,{" "}
        <span className="font-medium">{course}</span>-specific guide from live
        sources.
      </p>
      <Button onClick={generate} disabled={loading} size="sm" className="mt-2">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Researching {course}…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Get {course}-specific fees &
            requirements
          </>
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
