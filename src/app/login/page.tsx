"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
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
          <h1 className="mt-4 text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to continue your admission journey.
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-secondary/50 p-3 text-center text-xs text-muted-foreground">
          Demo account: <strong>student@demo.com</strong> / <strong>password123</strong>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
