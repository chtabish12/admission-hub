"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { COUNTRIES, FIELDS } from "@/lib/constants";
import { parseList, cn } from "@/lib/utils";

type Existing = {
  company: string | null;
  country: string;
  city: string;
  specialties: string;
  fields: string;
  bio: string;
  website: string | null;
  phone: string | null;
  approved: boolean;
} | null;

export function ConsultantApplyForm({
  isLoggedIn,
  defaultName,
  defaultEmail,
  existing,
}: {
  isLoggedIn: boolean;
  defaultName: string;
  defaultEmail: string;
  existing: Existing;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [specialties, setSpecialties] = useState<string[]>(
    existing ? parseList(existing.specialties) : []
  );
  const [fields, setFields] = useState<string[]>(
    existing ? parseList(existing.fields) : []
  );

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const payload: Record<string, unknown> = {
      company: form.get("company") || undefined,
      country: form.get("country"),
      city: form.get("city"),
      bio: form.get("bio"),
      website: form.get("website") || undefined,
      phone: form.get("phone") || undefined,
      specialties,
      fields,
    };

    let endpoint = "/api/consultants/apply";
    if (!isLoggedIn) {
      endpoint = "/api/consultants/register";
      payload.name = form.get("name");
      payload.email = form.get("email");
      payload.password = form.get("password");
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Submission failed");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done || (existing && existing.approved)) {
    return (
      <Card className="p-8 text-center">
        {existing?.approved ? (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
            <h2 className="text-xl font-bold">You&apos;re verified! 🎉</h2>
            <p className="mt-2 text-muted-foreground">
              Your consultant profile is approved and visible to students.
            </p>
          </>
        ) : (
          <>
            <Clock className="mx-auto mb-3 h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-bold">Application submitted</h2>
            <p className="mt-2 text-muted-foreground">
              Thanks! An admin will review your profile shortly. You&apos;ll
              appear in search results once approved.
            </p>
          </>
        )}
        <Button className="mt-6" onClick={() => router.push("/consultants")}>
          Browse consultants
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      {existing && !existing.approved && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <Clock className="h-4 w-4" /> Your profile is pending admin approval.
          You can update your details below.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-5">
        {!isLoggedIn && (
          <div className="space-y-5 rounded-lg border border-border bg-secondary/30 p-4">
            <p className="text-sm font-medium">Create your consultant account</p>
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" defaultValue={defaultName} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={defaultEmail} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="company">Company / agency</Label>
            <Input id="company" name="company" defaultValue={existing?.company ?? ""} placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={existing?.phone ?? ""} placeholder="Optional" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="country">Country</Label>
            <Select id="country" name="country" defaultValue={existing?.country ?? ""} required>
              <option value="">Select…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={existing?.city ?? ""} required placeholder="e.g. London" />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={existing?.website ?? ""} placeholder="https:// (optional)" />
        </div>

        <div>
          <Label>Countries you cover</Label>
          <ChipPicker options={COUNTRIES} selected={specialties} onToggle={(v) => toggle(specialties, setSpecialties, v)} />
        </div>

        <div>
          <Label>Fields you specialise in</Label>
          <ChipPicker options={FIELDS} selected={fields} onToggle={(v) => toggle(fields, setFields, v)} />
        </div>

        <div>
          <Label htmlFor="bio">About you</Label>
          <Textarea id="bio" name="bio" defaultValue={existing?.bio ?? ""} required placeholder="Tell students about your experience, success stories and approach (min 20 characters)." />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading
            ? "Submitting…"
            : existing
            ? "Update profile"
            : isLoggedIn
            ? "Submit application"
            : "Create account & apply"}
        </Button>
      </form>
    </Card>
  );
}

function ChipPicker({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => onToggle(o)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary"
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
