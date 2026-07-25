"use client";

import { createContext, useContext, useEffect, useState } from "react";

type PortalUI = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
};

const Ctx = createContext<PortalUI | null>(null);

export function PortalUIProvider({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
        setNotifOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider value={{ commandOpen, setCommandOpen, notifOpen, setNotifOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePortalUI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePortalUI must be used within PortalUIProvider");
  return ctx;
}
