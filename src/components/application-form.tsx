"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { COUNTRIES, EDUCATION_LEVELS } from "@/lib/constants";

type Doc = { name: string; url: string };

export function ApplicationForm({
  universityId,
  courses,
  preselectedCourse,
  defaults,
}: {
  universityId: string;
  courses: string[];
  preselectedCourse: string;
  defaults: { fullName: string; email: string; educationLevel: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);

  function addDoc() {
    setDocs((d) => [...d, { name: "", url: "" }]);
  }

  function updateDoc(i: number, patch: Partial<Doc>) {
    setDocs((d) => d.map((doc, j) => (j === i ? { ...doc, ...patch } : doc)));
  }

  function removeDoc(i: number) {
    setDocs((d) => d.filter((_, j) => j !== i));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        universityId,
        course: form.get("course"),
        intake: form.get("intake") || undefined,
        fullName: form.get("fullName"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        nationality: form.get("nationality") || undefined,
        educationLevel: form.get("educationLevel") || undefined,
        gpa: form.get("gpa") || undefined,
        englishTest: form.get("englishTest") || undefined,
        statement: form.get("statement"),
        documents: docs.filter((d) => d.name.trim() && d.url.trim()),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not submit application");
      return;
    }
    router.push("/portal/applications?submitted=1");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="course">Course / Program</Label>
          <Select id="course" name="course" required defaultValue={preselectedCourse}>
            <option value="" disabled>
              Select a course…
            </option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="intake">Intake</Label>
          <Select id="intake" name="intake" defaultValue="">
            <option value="">Select…</option>
            <option value="Sep 2026">Sep 2026</option>
            <option value="Jan 2027">Jan 2027</option>
            <option value="Sep 2027">Sep 2027</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required defaultValue={defaults.fullName} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required defaultValue={defaults.email} />
        </div>
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" placeholder="+1 555 000 0000" />
        </div>
        <div>
          <Label htmlFor="nationality">Nationality (optional)</Label>
          <Select id="nationality" name="nationality" defaultValue="">
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="educationLevel">Current education level</Label>
          <Select
            id="educationLevel"
            name="educationLevel"
            defaultValue={defaults.educationLevel}
          >
            <option value="">Select…</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="gpa">GPA / Grades (optional)</Label>
          <Input id="gpa" name="gpa" placeholder="e.g. 3.8/4.0 or A-levels AAB" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="englishTest">English test (optional)</Label>
          <Input id="englishTest" name="englishTest" placeholder="e.g. IELTS 7.5, TOEFL 105" />
        </div>
      </div>

      <div>
        <Label htmlFor="statement">Personal statement</Label>
        <Textarea
          id="statement"
          name="statement"
          required
          minLength={50}
          rows={7}
          placeholder="Tell the university why you're a great fit for this course (min 50 characters)…"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label>Documents (links)</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addDoc}>
            <Plus className="h-4 w-4" /> Add document
          </Button>
        </div>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Optionally link transcripts, certificates or your CV (Google Drive,
            Dropbox…).
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={doc.name}
                  onChange={(e) => updateDoc(i, { name: e.target.value })}
                  placeholder="Name, e.g. Transcript"
                  className="w-1/3"
                />
                <Input
                  value={doc.url}
                  onChange={(e) => updateDoc(i, { url: e.target.value })}
                  placeholder="https://…"
                  type="url"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDoc(i)}
                  aria-label="Remove document"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit application
          </>
        )}
      </Button>
    </form>
  );
}
