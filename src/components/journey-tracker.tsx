"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { JOURNEY_STEPS } from "@/lib/journey";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function JourneyTracker({
  initialCompleted,
}: {
  initialCompleted: string[];
}) {
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialCompleted)
  );
  const [open, setOpen] = useState<string | null>(JOURNEY_STEPS[0].key);
  const [saving, setSaving] = useState<string | null>(null);

  const total = JOURNEY_STEPS.length;
  const done = completed.size;
  const pct = Math.round((done / total) * 100);

  async function toggle(key: string) {
    const next = new Set(completed);
    const willComplete = !next.has(key);
    if (willComplete) next.add(key);
    else next.delete(key);
    setCompleted(next);
    setSaving(key);
    try {
      await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepKey: key, completed: willComplete }),
      });
    } catch {
      // revert on failure
      const revert = new Set(completed);
      setCompleted(revert);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Overall progress</p>
            <p className="text-2xl font-bold">
              {done} of {total} steps
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold gradient-text">{pct}%</p>
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <div className="space-y-3">
        {JOURNEY_STEPS.map((step, i) => {
          const isDone = completed.has(step.key);
          const isOpen = open === step.key;
          return (
            <Card key={step.key} className="overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggle(step.key)}
                  disabled={saving === step.key}
                  aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                  className="shrink-0 transition-transform hover:scale-110"
                >
                  {isDone ? (
                    <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  ) : (
                    <Circle className="h-7 w-7 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => setOpen(isOpen ? null : step.key)}
                  className="flex min-w-0 flex-1 items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold">
                      <span className="text-xs text-muted-foreground">
                        Step {i + 1}
                      </span>
                      <span
                        className={cn(
                          "truncate",
                          isDone && "text-muted-foreground line-through"
                        )}
                      >
                        {step.title}
                      </span>
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-border bg-secondary/30 px-4 py-3 pl-14">
                  <ul className="space-y-1.5">
                    {step.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
