"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ChecklistItem = { key: string; title: string; description?: string };
export type ChecklistSection = { label: string; items: ChecklistItem[] };

/**
 * Interactive, per-university application guide. Each item's completion is
 * persisted via /api/journey using a university-namespaced stepKey
 * ("uni:{universityId}:..."), so progress is tracked separately per school.
 */
export function UniversityChecklist({
  sections,
  initialCompleted,
  isLoggedIn,
}: {
  sections: ChecklistSection[];
  initialCompleted: string[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialCompleted)
  );
  const [saving, setSaving] = useState<string | null>(null);

  const allKeys = sections.flatMap((s) => s.items.map((i) => i.key));
  const total = allKeys.length;
  const done = allKeys.filter((k) => completed.has(k)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function toggle(key: string) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const next = new Set(completed);
    const willComplete = !next.has(key);
    if (willComplete) next.add(key);
    else next.delete(key);
    setCompleted(next);
    setSaving(key);
    try {
      const res = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepKey: key, completed: willComplete }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      // revert on failure
      const revert = new Set(next);
      if (willComplete) revert.delete(key);
      else revert.add(key);
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
            <p className="text-sm text-muted-foreground">
              Your progress for this university
            </p>
            <p className="text-2xl font-bold">
              {done} of {total} done
            </p>
          </div>
          <p className="gradient-text text-3xl font-bold">{pct}%</p>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {!isLoggedIn && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <button
              onClick={() => router.push("/login")}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Log in
            </button>
            to save your progress.
          </p>
        )}
      </Card>

      {sections.map((section) => (
        <div key={section.label} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {section.label}
          </h3>
          {section.items.map((item) => {
            const isDone = completed.has(item.key);
            return (
              <Card key={item.key} className="overflow-hidden">
                <button
                  onClick={() => toggle(item.key)}
                  disabled={saving === item.key}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
                >
                  {isDone ? (
                    <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block font-medium",
                        isDone && "text-muted-foreground line-through"
                      )}
                    >
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </span>
                </button>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
