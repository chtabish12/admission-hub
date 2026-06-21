"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input, Select, Button, Card } from "@/components/ui";
import { FIELDS, COUNTRIES } from "@/lib/constants";

/**
 * Single top filter bar. The user sets name / country / field / budget here,
 * and pressing Search pulls live data for the chosen country (any country
 * works) before showing the filtered, paginated results.
 */
export function UniversityFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [country, setCountry] = useState(params.get("country") ?? "");
  const [field, setField] = useState(params.get("field") ?? "");
  const [maxTuition, setMaxTuition] = useState(params.get("maxTuition") ?? "");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasFilters = q || country || field || maxTuition;

  async function search() {
    if (loading) return;
    setLoading(true);
    setMessage(null);

    const target = country.trim();
    // The API normalises country casing (e.g. "france" -> "France", keeps
    // "USA"); use the label it returns so the URL filter matches stored rows.
    let resolvedCountry = target;
    try {
      // Pull the latest universities for the chosen country from online data.
      if (target) {
        const res = await fetch("/api/universities/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: target }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data) {
          resolvedCountry = data.country ?? target;
          if (data.scanned === 0) {
            setMessage(`No online results for "${target}". Check the spelling.`);
          } else if (data.added > 0) {
            setMessage(`Added ${data.added} new universit${data.added === 1 ? "y" : "ies"} for ${data.country}.`);
          }
        }
      }

      const next = new URLSearchParams();
      if (q.trim()) next.set("q", q.trim());
      if (target) next.set("country", resolvedCountry);
      if (field) next.set("field", field);
      if (maxTuition) next.set("maxTuition", maxTuition);
      router.push(`/universities?${next.toString()}`);
      router.refresh();
    } catch {
      setMessage("Something went wrong while fetching online data.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setQ("");
    setCountry("");
    setField("");
    setMaxTuition("");
    setMessage(null);
    router.push("/universities");
  }

  return (
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="pl-9"
          />
        </div>

        <Select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select value={field} onChange={(e) => setField(e.target.value)}>
          <option value="">All fields</option>
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>

        <Select
          value={maxTuition}
          onChange={(e) => setMaxTuition(e.target.value)}
        >
          <option value="">Any budget</option>
          <option value="5000">Under 5,000 / yr</option>
          <option value="20000">Under 20,000 / yr</option>
          <option value="40000">Under 40,000 / yr</option>
          <option value="60000">Under 60,000 / yr</option>
        </Select>

        <Button onClick={search} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Search
            </>
          )}
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {message ??
            "Pick a country and press Search to pull the latest universities and fees online."}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>
    </Card>
  );
}
