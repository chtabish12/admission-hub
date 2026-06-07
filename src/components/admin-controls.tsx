"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export function ApproveControls({
  consultantId,
  approved,
}: {
  consultantId: string;
  approved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    await fetch("/api/admin/consultants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultantId, action }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {!approved && (
        <Button size="sm" onClick={() => act("approve")} disabled={!!loading}>
          {loading === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Approve
        </Button>
      )}
      {approved && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => act("reject")}
          disabled={!!loading}
        >
          {loading === "reject" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Revoke
        </Button>
      )}
    </div>
  );
}

export function SyncUniversitiesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function sync() {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/universities/sync", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg(`Added ${data.added} new universities (scanned ${data.scanned}).`);
      router.refresh();
    } else {
      setMsg(data.error || "Sync failed");
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      <Button onClick={sync} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Fetch latest universities
      </Button>
    </div>
  );
}
