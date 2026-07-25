"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  File,
  FileCheck,
  FileText,
  Grid3x3,
  History,
  List,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { StatCard } from "@/components/portal/widgets";
import { cn, timeAgo } from "@/lib/utils";

export type VaultDocument = {
  id: string;
  name: string;
  type: string;
  url: string;
  status: string;
  version: number;
  expiryDate: string | null;
  uploadedAt: string;
};

const DOC_TYPES = [
  "Passport",
  "Transcript",
  "Degree",
  "IELTS",
  "SOP",
  "CV",
  "Recommendation Letter",
  "Financial Document",
  "Other",
];

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Passport: FileText,
  Transcript: FileCheck,
  Degree: Award,
  IELTS: FileText,
  SOP: FileText,
  CV: FileText,
  "Recommendation Letter": FileText,
  "Financial Document": FileText,
};

function expiresSoon(expiryDate: string | null) {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate).getTime();
  if (Number.isNaN(expiry)) return false;
  const diff = expiry - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

function StatusBadge({ status }: { status: string }) {
  const verified = status === "verified";
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        verified
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
    >
      {verified ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
      {verified ? "Verified" : "Pending"}
    </span>
  );
}

export function DocumentVaultClient({
  initialDocuments,
}: {
  initialDocuments: VaultDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: DOC_TYPES[0], url: "", expiryDate: "" });

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          d.name.toLowerCase().includes(search.toLowerCase()) &&
          (typeFilter === "all" || d.type === typeFilter)
      ),
    [documents, search, typeFilter]
  );

  const stats = useMemo(
    () => ({
      total: documents.length,
      verified: documents.filter((d) => d.status === "verified").length,
      pending: documents.filter((d) => d.status !== "verified").length,
    }),
    [documents]
  );

  async function addDocument() {
    if (!form.name.trim() || !form.url.trim() || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          url: form.url.trim(),
          expiryDate: form.expiryDate || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.document) {
        setFormError(data?.error ?? "Could not add the document. Check the URL and try again.");
        return;
      }
      setDocuments((prev) => [data.document as VaultDocument, ...prev]);
      setForm({ name: "", type: DOC_TYPES[0], url: "", expiryDate: "" });
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Document Vault</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Secure storage with version control and approval status
          </p>
        </div>
        <Button onClick={() => setFormOpen((o) => !o)}>
          <Plus className="h-4 w-4" /> Add document
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Documents" value={stats.total} icon={FileText} accent="cyan" />
        <StatCard label="Verified" value={stats.verified} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="amber" />
      </div>

      <Card className="border-emerald-500/20 bg-emerald-500/5 p-3">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="text-muted-foreground">
            Documents stay pending until the university approves a matching requirement
            on your application.
          </span>
        </div>
      </Card>

      {formOpen && (
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="doc-name">Name</Label>
              <Input
                id="doc-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Passport.pdf"
              />
            </div>
            <div>
              <Label htmlFor="doc-type">Type</Label>
              <Select
                id="doc-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="doc-url">URL</Label>
              <Input
                id="doc-url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div>
              <Label htmlFor="doc-expiry">Expiry date (optional)</Label>
              <Input
                id="doc-expiry"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              />
            </div>
          </div>
          {formError && <p className="mt-2 text-xs text-rose-500">{formError}</p>}
          <div className="mt-3 flex gap-2">
            <Button onClick={addDocument} disabled={saving || !form.name.trim() || !form.url.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save document
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-48"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <File className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No documents found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {documents.length === 0
              ? "Add your first document to start building your vault."
              : "Try a different search or type filter."}
          </p>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((doc) => {
            const Icon = TYPE_ICONS[doc.type] ?? File;
            return (
              <Card key={doc.id} className="group p-4 transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/5">
                    <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
                <h4 className="mb-1 truncate text-sm font-medium" title={doc.name}>
                  {doc.name}
                </h4>
                <div className="mb-3 flex items-center gap-2">
                  <Badge className="text-[10px]">{doc.type}</Badge>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <History className="h-3 w-3" /> v{doc.version}
                  </span>
                </div>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Uploaded {timeAgo(doc.uploadedAt)}
                </p>
                {expiresSoon(doc.expiryDate) && (
                  <p className="mb-3 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    Expires soon — {doc.expiryDate}
                  </p>
                )}
                <div className="flex gap-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="h-7 w-full text-xs">
                      <ExternalLink className="h-3 w-3" /> Open
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                    onClick={() => remove(doc.id)}
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((doc) => {
              const Icon = TYPE_ICONS[doc.type] ?? File;
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        v{doc.version}
                      </span>
                      {expiresSoon(doc.expiryDate) && (
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          Expires soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {doc.type} · Uploaded {timeAgo(doc.uploadedAt)}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 shrink-0 p-0"
                      aria-label={`Open ${doc.name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-rose-500"
                    onClick={() => remove(doc.id)}
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
