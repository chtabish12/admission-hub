"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Connecting with an approved consultant is the one action that requires an
 * account. Browsing everything else is fully public.
 */
export function ConnectButton({
  isLoggedIn,
  email,
  phone,
  name,
}: {
  isLoggedIn: boolean;
  email?: string | null;
  phone?: string | null;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="w-full">
        <Button className="w-full" size="sm">
          <MessageCircle className="h-3.5 w-3.5" /> Sign in to connect
        </Button>
      </Link>
    );
  }

  if (!open) {
    return (
      <Button className="w-full" size="sm" onClick={() => setOpen(true)}>
        <MessageCircle className="h-3.5 w-3.5" /> Connect
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
      <p className="font-medium">Contact {name.split(" ")[0]}</p>
      {email && (
        <a
          href={`mailto:${email}?subject=Consultancy%20request%20via%20AdmissionHub`}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <Mail className="h-3.5 w-3.5" /> {email}
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <Phone className="h-3.5 w-3.5" /> {phone}
        </a>
      )}
      {!email && !phone && (
        <p className="text-muted-foreground">
          No direct contact provided — request a callback through your dashboard.
        </p>
      )}
    </div>
  );
}
