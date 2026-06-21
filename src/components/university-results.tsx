"use client";

import { useState } from "react";
import { SearchX, Loader2 } from "lucide-react";
import { UniversityCard } from "@/components/university-card";
import type { UniversityCardData } from "@/components/university-card";
import { Button } from "@/components/ui";

/**
 * Renders the university grid and a "Load more" button that fetches the next
 * page from /api/universities and appends it. The parent remounts this
 * component (via `key`) whenever filters change, so it always starts from the
 * fresh server-rendered first page.
 */
export function UniversityResults({
  initial,
  total,
  query,
  course,
}: {
  initial: UniversityCardData[];
  total: number;
  query: string;
  course?: string;
}) {
  const [unis, setUnis] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const hasMore = unis.length < total;

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    setError(false);
    const next = page + 1;
    try {
      const qs = query ? `${query}&page=${next}` : `page=${next}`;
      const res = await fetch(`/api/universities?${qs}`);
      if (!res.ok) throw new Error("request failed");
      const data = await res.json();
      setUnis((prev) => [...prev, ...data.universities]);
      setPage(next);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="mb-4 mt-6 text-sm text-muted-foreground">
        {total} universit{total === 1 ? "y" : "ies"} found
      </p>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <SearchX className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No universities match your filters</p>
          <p className="text-sm text-muted-foreground">
            Try widening your search, or fetch live data for a country above.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {unis.map((u) => (
              <UniversityCard key={u.id} uni={u} course={course} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </>
                ) : (
                  `Load more (${total - unis.length} remaining)`
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-600">
                  Couldn’t load more. Tap to try again.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
