"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input, Select, Button, Card } from "@/components/ui";
import { FIELDS, COUNTRIES } from "@/lib/constants";

export function UniversityFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/universities?${next.toString()}`);
    },
    [params, router]
  );

  const hasFilters =
    params.get("q") ||
    params.get("country") ||
    params.get("field") ||
    params.get("maxTuition");

  return (
    <Card className="p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name…"
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => update("q", e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={params.get("country") ?? ""}
          onChange={(e) => update("country", e.target.value)}
        >
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={params.get("field") ?? ""}
          onChange={(e) => update("field", e.target.value)}
        >
          <option value="">All fields</option>
          {FIELDS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        <Select
          value={params.get("maxTuition") ?? ""}
          onChange={(e) => update("maxTuition", e.target.value)}
        >
          <option value="">Any budget</option>
          <option value="5000">Under 5,000 / yr</option>
          <option value="20000">Under 20,000 / yr</option>
          <option value="40000">Under 40,000 / yr</option>
          <option value="60000">Under 60,000 / yr</option>
        </Select>
      </div>
      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/universities")}
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </Button>
        </div>
      )}
    </Card>
  );
}
