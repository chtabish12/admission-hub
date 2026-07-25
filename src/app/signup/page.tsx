"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Building2, Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { FIELDS, COUNTRIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type UniOption = { id: string; name: string; country: string; city: string };

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "UNIVERSITY">("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [uniQuery, setUniQuery] = useState("");
  const [uniResults, setUniResults] = useState<UniOption[]>([]);
  const [selectedUni, setSelectedUni] = useState<UniOption | null>(null);

  useEffect(() => {
    if (role !== "UNIVERSITY" || selectedUni || uniQuery.trim().length < 2) {
      setUniResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/universities?q=${encodeURIComponent(uniQuery.trim())}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setUniResults(
          (data.universities ?? []).map((u: UniOption) => ({
            id: u.id,
            name: u.name,
            country: u.country,
            city: u.city,
          }))
        );
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [uniQuery, role, selectedUni]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role,
        fieldOfInterest: form.get("fieldOfInterest"),
        preferredCountry: form.get("preferredCountry"),
        universityId: selectedUni?.id,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "STUDENT"
              ? "Start your step-by-step journey to university."
              : "Manage your university's admissions pipeline."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-secondary p-1">
          {(
            [
              { key: "STUDENT", label: "Student", icon: GraduationCap },
              { key: "UNIVERSITY", label: "University", icon: Building2 },
            ] as const
          ).map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                role === r.key
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <r.icon className="h-4 w-4" /> {r.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">
              {role === "STUDENT" ? "Full name" : "Contact name"}
            </Label>
            <Input id="name" name="name" required placeholder="Jane Doe" />
          </div>
          <div>
            <Label htmlFor="email">
              {role === "STUDENT" ? "Email" : "Work email"}
            </Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
          </div>

          {role === "STUDENT" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fieldOfInterest">Field of interest</Label>
                <Select id="fieldOfInterest" name="fieldOfInterest" defaultValue="">
                  <option value="">Select…</option>
                  {FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="preferredCountry">Preferred country</Label>
                <Select id="preferredCountry" name="preferredCountry" defaultValue="">
                  <option value="">Select…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="university">Your university</Label>
              {selectedUni ? (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                      {selectedUni.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedUni.city}, {selectedUni.country}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUni(null);
                      setUniQuery("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="university"
                    value={uniQuery}
                    onChange={(e) => setUniQuery(e.target.value)}
                    placeholder="Search your university…"
                    autoComplete="off"
                  />
                  {uniResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
                      {uniResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUni(u)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="ml-1 text-muted-foreground">
                            — {u.city}, {u.country}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Can&apos;t find it? Search it on the Universities page first to
                add it from live data.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
