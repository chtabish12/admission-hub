"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { FIELDS, COUNTRIES } from "@/lib/constants";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        fieldOfInterest: form.get("fieldOfInterest"),
        preferredCountry: form.get("preferredCountry"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="container-page flex min-h-[80vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start your step-by-step journey to university.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required placeholder="Jane Doe" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
          </div>
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
