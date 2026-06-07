"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui";

export function SaveButton({
  universityId,
  initialSaved,
  isLoggedIn,
}: {
  universityId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ universityId }),
      });
      const data = await res.json();
      if (res.ok) setSaved(data.saved);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={saved ? "primary" : "outline"}
      onClick={toggle}
      disabled={loading}
    >
      {saved ? (
        <>
          <BookmarkCheck className="h-4 w-4" /> Saved
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" /> Save
        </>
      )}
    </Button>
  );
}
