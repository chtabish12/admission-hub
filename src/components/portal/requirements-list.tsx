"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, Loader2, RefreshCw, Send, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";

export type RequirementItem = {
  id: string;
  title: string;
  note: string | null;
  status: string;
  documentName: string | null;
  documentUrl: string | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "Awaiting upload",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  submitted: {
    label: "Submitted — under review",
    className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    icon: Send,
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Re-upload needed",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    icon: RefreshCw,
  },
};

function RequirementRow({
  applicationId,
  requirement,
}: {
  applicationId: string;
  requirement: RequirementItem;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = STATUS_CONFIG[requirement.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const needsUpload = requirement.status === "pending" || requirement.status === "rejected";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/applications/${applicationId}/requirements/${requirement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentUrl: url.trim(),
          ...(name.trim() ? { documentName: name.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit the document");
        return;
      }
      setName("");
      setUrl("");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{requirement.title}</p>
          {requirement.note && (
            <p className="mt-0.5 text-xs text-muted-foreground">{requirement.note}</p>
          )}
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium",
            config.className
          )}
        >
          <StatusIcon className="h-2.5 w-2.5" />
          {config.label}
        </span>
      </div>

      {!needsUpload && requirement.documentUrl && (
        <a
          href={requirement.documentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          {requirement.documentName ?? "View document"}
        </a>
      )}

      {needsUpload && (
        <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Document name (optional)"
            className="h-9 text-xs"
          />
          <Input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://link-to-your-document"
            className="h-9 text-xs"
          />
          <Button type="submit" size="sm" disabled={loading} className="h-9">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" /> Submit
              </>
            )}
          </Button>
        </form>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function RequirementsList({
  applicationId,
  requirements,
}: {
  applicationId: string;
  requirements: RequirementItem[];
}) {
  return (
    <div className="space-y-2">
      {requirements.map((requirement) => (
        <RequirementRow
          key={requirement.id}
          applicationId={applicationId}
          requirement={requirement}
        />
      ))}
    </div>
  );
}
