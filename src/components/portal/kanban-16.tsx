"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Globe2,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  Mail,
  Phone,
  GraduationCap,
  Award,
  Languages,
  BookOpen,
  X,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { Card, Badge, Button, Input, Select, Textarea, Label } from "@/components/ui";
import { STAGES } from "@/lib/application-stages";
import { cn, timeAgo } from "@/lib/utils";

export type Kanban16Requirement = {
  id: string;
  title: string;
  status: string;
  documentName: string | null;
  documentUrl: string | null;
  note: string | null;
  createdAt: string;
};

export type Kanban16Event = {
  id: string;
  type: string;
  message: string;
  actor: string;
  createdAt: string;
};

export type Kanban16App = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  educationLevel: string | null;
  gpa: string | null;
  englishTest: string | null;
  course: string;
  intake: string | null;
  status: string;
  priority: string;
  statement: string;
  universityNotes: string | null;
  documents: { name: string; url: string }[];
  createdAt: string;
  requirements: Kanban16Requirement[];
  events: Kanban16Event[];
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  medium: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

const REQ_STYLES: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  submitted: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

const TABS = [
  { key: "details", label: "Details" },
  { key: "requirements", label: "Requirements" },
  { key: "activity", label: "Activity" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PriorityChip({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
        PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium
      )}
    >
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-0.5 truncate text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function Kanban16({ initialApps }: { initialApps: Kanban16App[] }) {
  const router = useRouter();
  const [apps, setApps] = useState(initialApps);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("details");
  const [editStatus, setEditStatus] = useState("new");
  const [editPriority, setEditPriority] = useState("medium");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [reqTitle, setReqTitle] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [addingReq, setAddingReq] = useState(false);
  const [busyReqId, setBusyReqId] = useState<string | null>(null);

  const selected = apps.find((a) => a.id === selectedId) ?? null;
  const q = search.trim().toLowerCase();
  const filtered = apps.filter((a) => {
    if (priorityFilter !== "all" && a.priority !== priorityFilter) return false;
    if (!q) return true;
    return a.fullName.toLowerCase().includes(q) || a.course.toLowerCase().includes(q);
  });

  function openCard(app: Kanban16App) {
    setSelectedId(app.id);
    setTab("details");
    setEditStatus(app.status);
    setEditPriority(app.priority);
    setEditNotes(app.universityNotes ?? "");
    setReqTitle("");
    setReqNote("");
    setError(null);
  }

  function closeSheet() {
    setSelectedId(null);
  }

  async function moveTo(appId: string, status: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app || app.status === status) return;
    const prev = app.status;
    setApps((all) => all.map((a) => (a.id === appId ? { ...a, status } : a)));
    setError(null);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setApps((all) => all.map((a) => (a.id === appId ? { ...a, status: prev } : a)));
      setError("Couldn't move the application. Try again.");
    }
  }

  function onDrop(e: React.DragEvent, stageKey: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setOverStage(null);
    setDragId(null);
    if (id) moveTo(id, stageKey);
  }

  async function saveDetails() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          universityNotes: editNotes,
        }),
      });
      if (!res.ok) throw new Error();
      setApps((all) =>
        all.map((a) =>
          a.id === selected.id
            ? { ...a, status: editStatus, priority: editPriority, universityNotes: editNotes }
            : a
        )
      );
      router.refresh();
    } catch {
      setError("Couldn't save changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function addRequirement() {
    if (!selected || reqTitle.trim().length < 2) return;
    setAddingReq(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${selected.id}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: reqTitle.trim(),
          note: reqNote.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const r = data.requirement;
      setApps((all) =>
        all.map((a) =>
          a.id === selected.id
            ? {
                ...a,
                requirements: [
                  ...a.requirements,
                  {
                    id: r.id,
                    title: r.title,
                    status: r.status,
                    documentName: r.documentName,
                    documentUrl: r.documentUrl,
                    note: r.note,
                    createdAt: r.createdAt,
                  },
                ],
              }
            : a
        )
      );
      setReqTitle("");
      setReqNote("");
      router.refresh();
    } catch {
      setError("Couldn't add the requirement. Try again.");
    } finally {
      setAddingReq(false);
    }
  }

  async function setRequirementStatus(reqId: string, status: string) {
    if (!selected) return;
    setBusyReqId(reqId);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${selected.id}/requirements/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setApps((all) =>
        all.map((a) =>
          a.id === selected.id
            ? {
                ...a,
                requirements: a.requirements.map((r) =>
                  r.id === reqId ? { ...r, status } : r
                ),
              }
            : a
        )
      );
      router.refresh();
    } catch {
      setError("Couldn't update the requirement. Try again.");
    } finally {
      setBusyReqId(null);
    }
  }

  async function deleteRequirement(reqId: string) {
    if (!selected) return;
    setBusyReqId(reqId);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${selected.id}/requirements/${reqId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setApps((all) =>
        all.map((a) =>
          a.id === selected.id
            ? { ...a, requirements: a.requirements.filter((r) => r.id !== reqId) }
            : a
        )
      );
      router.refresh();
    } catch {
      setError("Couldn't delete the requirement. Try again.");
    } finally {
      setBusyReqId(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-background/50 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Badge className="gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live · {apps.length} applications
        </Badge>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Drag cards between columns to update workflow status
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or course..."
              className="h-9 w-52 pl-8"
            />
          </div>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 w-40"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      </div>

      {error && <p className="px-4 pt-3 text-sm text-red-600 sm:px-6">{error}</p>}

      <div className="flex-1 overflow-x-auto px-4 py-4 sm:px-6">
        <div className="flex h-full min-w-max gap-3">
          {STAGES.map((stage) => {
            const items = filtered.filter((a) => a.status === stage.key);
            return (
              <div
                key={stage.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(stage.key);
                }}
                onDragLeave={() => setOverStage(null)}
                onDrop={(e) => onDrop(e, stage.key)}
                className={cn(
                  "flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-secondary/40 transition-colors",
                  overStage === stage.key && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                    <span className="text-sm font-semibold">{stage.label}</span>
                  </div>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                  {items.length === 0 && (
                    <p className="px-1 py-3 text-center text-xs text-muted-foreground">
                      {stage.description}
                    </p>
                  )}
                  {items.map((app) => {
                    const approved = app.requirements.filter(
                      (r) => r.status === "approved"
                    ).length;
                    return (
                      <Card
                        key={app.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", app.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(app.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                        }}
                        onClick={() => openCard(app)}
                        className={cn(
                          "cursor-grab p-3 transition-colors hover:border-primary/30 active:cursor-grabbing",
                          dragId === app.id && "opacity-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-semibold text-white">
                              {initialsOf(app.fullName)}
                            </div>
                            <p className="truncate text-sm font-medium leading-tight">
                              {app.fullName}
                            </p>
                          </div>
                          <PriorityChip priority={app.priority} />
                        </div>
                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          {app.course}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          {app.nationality && (
                            <span className="flex items-center gap-1">
                              <Globe2 className="h-3 w-3" />
                              {app.nationality}
                            </span>
                          )}
                          {app.intake && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {app.intake}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {approved}/{app.requirements.length} docs
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(app.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeSheet} />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-xl sm:max-w-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 font-semibold text-white">
                  {initialsOf(selected.fullName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-semibold leading-tight">
                      {selected.fullName}
                    </h2>
                    <PriorityChip priority={selected.priority} />
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {selected.course}
                    {selected.intake ? ` · ${selected.intake}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={closeSheet}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex border-b border-border">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    tab === t.key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {tab === "details" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-2">
                    <InfoTile icon={Mail} label="Email" value={selected.email} />
                    <InfoTile icon={Phone} label="Phone" value={selected.phone} />
                    <InfoTile icon={Globe2} label="Nationality" value={selected.nationality} />
                    <InfoTile
                      icon={GraduationCap}
                      label="Education"
                      value={selected.educationLevel}
                    />
                    <InfoTile icon={Award} label="GPA" value={selected.gpa} />
                    <InfoTile
                      icon={Languages}
                      label="English Test"
                      value={selected.englishTest}
                    />
                    <InfoTile icon={BookOpen} label="Course" value={selected.course} />
                    <InfoTile icon={Calendar} label="Intake" value={selected.intake} />
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      STATEMENT
                    </p>
                    <div className="whitespace-pre-wrap rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                      {selected.statement}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      DOCUMENTS ({selected.documents.length})
                    </p>
                    {selected.documents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No documents attached.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {selected.documents.map((doc, i) => (
                          <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm transition-colors hover:bg-secondary"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground">REVIEW</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="kanban-stage">Stage</Label>
                        <Select
                          id="kanban-stage"
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="kanban-priority">Priority</Label>
                        <Select
                          id="kanban-priority"
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="kanban-notes">Internal notes</Label>
                      <Textarea
                        id="kanban-notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes visible only to your team..."
                      />
                    </div>
                    <Button onClick={saveDetails} disabled={saving} className="w-full">
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}

              {tab === "requirements" && (
                <div className="space-y-4">
                  {selected.requirements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No requirements yet. Add one below to customise the student
                      checklist.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selected.requirements.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{req.title}</p>
                              {req.note && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {req.note}
                                </p>
                              )}
                            </div>
                            <Badge
                              className={cn(
                                "shrink-0 capitalize",
                                REQ_STYLES[req.status] ?? REQ_STYLES.pending
                              )}
                            >
                              {req.status}
                            </Badge>
                          </div>
                          {req.documentUrl && (
                            <a
                              href={req.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {req.documentName || "View document"}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            {req.status === "submitted" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setRequirementStatus(req.id, "approved")}
                                  disabled={busyReqId === req.id}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRequirementStatus(req.id, "rejected")}
                                  disabled={busyReqId === req.id}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <button
                              onClick={() => deleteRequirement(req.id)}
                              disabled={busyReqId === req.id}
                              title="Delete requirement"
                              className="ml-auto text-muted-foreground transition-colors hover:text-red-500 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      REQUEST A DOCUMENT
                    </p>
                    <div>
                      <Label htmlFor="req-title">Title</Label>
                      <Input
                        id="req-title"
                        value={reqTitle}
                        onChange={(e) => setReqTitle(e.target.value)}
                        placeholder="e.g. Updated bank statement"
                      />
                    </div>
                    <div>
                      <Label htmlFor="req-note">Note (optional)</Label>
                      <Input
                        id="req-note"
                        value={reqNote}
                        onChange={(e) => setReqNote(e.target.value)}
                        placeholder="Any instructions for the student"
                      />
                    </div>
                    <Button
                      onClick={addRequirement}
                      disabled={addingReq || reqTitle.trim().length < 2}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4" />
                      {addingReq ? "Adding..." : "Add Requirement"}
                    </Button>
                  </div>
                </div>
              )}

              {tab === "activity" && (
                <div className="relative">
                  {selected.events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    <>
                      <span className="absolute bottom-2 left-[5px] top-2 w-0.5 bg-border" />
                      <div className="space-y-4">
                        {selected.events.map((event) => (
                          <div key={event.id} className="relative pl-6">
                            <span
                              className={cn(
                                "absolute left-0 top-1 h-3 w-3 rounded-full ring-4 ring-background",
                                event.type === "STAGE_CHANGE"
                                  ? "bg-primary"
                                  : event.type === "REQUIREMENT"
                                    ? "bg-amber-500"
                                    : "bg-slate-400"
                              )}
                            />
                            <p className="text-sm leading-tight">{event.message}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {event.actor} · {timeAgo(event.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
