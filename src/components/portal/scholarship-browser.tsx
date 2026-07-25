"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Globe,
  MoveRight,
  Search,
} from "lucide-react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { cn, formatMoney } from "@/lib/utils";
import type { Scholarship } from "@/lib/scholarships";

export type ScholarshipWithMatch = Scholarship & { match: number };

const STATUS_CONFIG: Record<Scholarship["status"], { label: string; classes: string }> = {
  open: {
    label: "Open",
    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  closing_soon: {
    label: "Closing Soon",
    classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

export function ScholarshipBrowser({
  scholarships,
}: {
  scholarships: ScholarshipWithMatch[];
}) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(scholarships.map((s) => s.country))),
    [scholarships]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scholarships.filter(
      (s) =>
        (s.name.toLowerCase().includes(q) || s.university.toLowerCase().includes(q)) &&
        (countryFilter === "all" || s.country === countryFilter)
    );
  }, [scholarships, search, countryFilter]);

  return (
    <div className="space-y-5">
      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search scholarships..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="pl-8"
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mb-1 font-medium">No scholarships found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sch) => {
            const status = STATUS_CONFIG[sch.status];
            const expanded = expandedId === sch.id;
            const steps = sch.process.split("→").map((s) => s.trim());
            return (
              <Card key={sch.id} className="flex h-full flex-col p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-1 text-[10px] font-medium",
                      status.classes
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <h3 className="mb-1 text-sm font-semibold leading-tight">{sch.name}</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  {sch.university} · {sch.country}
                </p>

                <div className="mb-3 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2.5">
                  <p className="text-[10px] uppercase text-muted-foreground">Funding</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {sch.funding}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ≈ {formatMoney(sch.fundingValue)} total value
                  </p>
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground">Match Probability</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${sch.match}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{sch.match}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Deadline</p>
                    <p className="flex items-center gap-1 text-xs font-medium">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {sch.deadline}
                    </p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1">
                  {sch.eligibility.slice(0, 3).map((e) => (
                    <span
                      key={e}
                      className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground"
                    >
                      {e}
                    </span>
                  ))}
                  {sch.eligibility.length > 3 && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      +{sch.eligibility.length - 3}
                    </span>
                  )}
                </div>

                {expanded && (
                  <div className="mb-3 space-y-4 border-t border-border pt-3">
                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Eligibility Criteria
                      </h4>
                      <div className="space-y-1.5">
                        {sch.eligibility.map((e) => (
                          <div key={e} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span>{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-cyan-500" />
                        Required Documents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {sch.documentsRequired.map((doc) => (
                          <Badge key={doc} className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">Application Process</h4>
                      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                        {steps.map((step, i) => (
                          <span key={step} className="flex items-center gap-1.5">
                            <span>{step}</span>
                            {i < steps.length - 1 && (
                              <MoveRight className="h-3 w-3 shrink-0" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(`${sch.name} scholarship`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        Apply on official site <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                )}

                <div className="mt-auto border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setExpandedId(expanded ? null : sch.id)}
                  >
                    {expanded ? (
                      <>
                        Hide details <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        View details <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
