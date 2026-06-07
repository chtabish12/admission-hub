"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { FIELDS, COUNTRIES, EDUCATION_LEVELS } from "@/lib/constants";

type ProfileData = {
  name: string;
  fieldOfInterest: string | null;
  preferredCountry: string | null;
  preferredCity: string | null;
  educationLevel: string | null;
};

export function ProfileForm({ user }: { user: ProfileData }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    const form = new FormData(e.currentTarget);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        fieldOfInterest: form.get("fieldOfInterest"),
        preferredCountry: form.get("preferredCountry"),
        preferredCity: form.get("preferredCity"),
        educationLevel: form.get("educationLevel"),
      }),
    });
    setStatus("saved");
    router.refresh();
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold">Your profile</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Keep this updated for better university matches.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="p-name">Full name</Label>
          <Input id="p-name" name="name" defaultValue={user.name} required />
        </div>
        <div>
          <Label htmlFor="p-field">Field of interest</Label>
          <Select id="p-field" name="fieldOfInterest" defaultValue={user.fieldOfInterest ?? ""}>
            <option value="">Select…</option>
            {FIELDS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-country">Country</Label>
            <Select id="p-country" name="preferredCountry" defaultValue={user.preferredCountry ?? ""}>
              <option value="">Any</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="p-city">City</Label>
            <Input id="p-city" name="preferredCity" defaultValue={user.preferredCity ?? ""} placeholder="e.g. London" />
          </div>
        </div>
        <div>
          <Label htmlFor="p-level">Education level</Label>
          <Select id="p-level" name="educationLevel" defaultValue={user.educationLevel ?? ""}>
            <option value="">Select…</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}
