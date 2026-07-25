"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Sun,
  User,
} from "lucide-react";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";
import { COUNTRIES, EDUCATION_LEVELS, FIELDS } from "@/lib/constants";

export type SettingsUser = {
  name: string;
  email: string;
  role: string;
  fieldOfInterest: string | null;
  preferredCountry: string | null;
  educationLevel: string | null;
  cgpa: number | null;
  budget: number | null;
  ieltsScore: number | null;
  toeflScore: number | null;
  workExperience: number | null;
  preferredIntake: string | null;
  careerGoals: string | null;
};

const NOTIFICATION_OPTIONS = [
  {
    key: "email",
    label: "Email Notifications",
    desc: "Receive updates via email",
    icon: Mail,
  },
  {
    key: "push",
    label: "Push Notifications",
    desc: "Browser and mobile push alerts",
    icon: Smartphone,
  },
  {
    key: "inApp",
    label: "In-App Notifications",
    desc: "Show notifications in the app",
    icon: Bell,
  },
] as const;

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors",
        checked ? "bg-primary" : "bg-secondary"
      )}
    >
      <span
        className={cn(
          "block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-4"
        )}
      />
    </button>
  );
}

export function SettingsClient({ user }: { user: SettingsUser }) {
  const { theme, setTheme } = useTheme();
  const isStudent = user.role === "STUDENT";

  const [profile, setProfile] = useState({
    name: user.name,
    fieldOfInterest: user.fieldOfInterest ?? "",
    preferredCountry: user.preferredCountry ?? "",
    educationLevel: user.educationLevel ?? "",
    cgpa: user.cgpa?.toString() ?? "",
    budget: user.budget?.toString() ?? "",
    ieltsScore: user.ieltsScore?.toString() ?? "",
    toeflScore: user.toeflScore?.toString() ?? "",
    workExperience: user.workExperience?.toString() ?? "",
    preferredIntake: user.preferredIntake ?? "",
    careerGoals: user.careerGoals ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    inApp: true,
  });

  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  function setField(key: keyof typeof profile, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function saveProfile() {
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const body: Record<string, unknown> = { name: profile.name.trim() };
      if (isStudent) {
        Object.assign(body, {
          fieldOfInterest: profile.fieldOfInterest,
          preferredCountry: profile.preferredCountry,
          educationLevel: profile.educationLevel,
          cgpa: profile.cgpa,
          budget: profile.budget,
          ieltsScore: profile.ieltsScore,
          toeflScore: profile.toeflScore,
          workExperience: profile.workExperience,
          preferredIntake: profile.preferredIntake,
          careerGoals: profile.careerGoals,
        });
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setProfileStatus(res.ok ? "Profile saved." : "Could not save your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (savingPassword || !passwords.current || !passwords.next) return;
    setSavingPassword(true);
    setPasswordStatus(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.next,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setPasswords({ current: "", next: "" });
        setPasswordStatus({ ok: true, text: "Password updated." });
      } else {
        setPasswordStatus({
          ok: false,
          text: data?.error ?? "Could not update your password.",
        });
      }
    } finally {
      setSavingPassword(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Profile</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="set-name">Full Name</Label>
            <Input
              id="set-name"
              value={profile.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="set-email">Email</Label>
            <Input id="set-email" type="email" value={user.email} readOnly disabled />
          </div>
          {isStudent && (
            <>
              <div>
                <Label htmlFor="set-field">Field of Interest</Label>
                <Select
                  id="set-field"
                  value={profile.fieldOfInterest}
                  onChange={(e) => setField("fieldOfInterest", e.target.value)}
                >
                  <option value="">Select a field</option>
                  {FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="set-country">Preferred Country</Label>
                <Select
                  id="set-country"
                  value={profile.preferredCountry}
                  onChange={(e) => setField("preferredCountry", e.target.value)}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="set-education">Education Level</Label>
                <Select
                  id="set-education"
                  value={profile.educationLevel}
                  onChange={(e) => setField("educationLevel", e.target.value)}
                >
                  <option value="">Select a level</option>
                  {EDUCATION_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="set-cgpa">CGPA (out of 4)</Label>
                <Input
                  id="set-cgpa"
                  type="number"
                  min={0}
                  max={4}
                  step={0.01}
                  value={profile.cgpa}
                  onChange={(e) => setField("cgpa", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="set-budget">Budget (USD / year)</Label>
                <Input
                  id="set-budget"
                  type="number"
                  min={0}
                  value={profile.budget}
                  onChange={(e) => setField("budget", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="set-ielts">IELTS Score</Label>
                <Input
                  id="set-ielts"
                  type="number"
                  min={0}
                  max={9}
                  step={0.5}
                  value={profile.ieltsScore}
                  onChange={(e) => setField("ieltsScore", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="set-toefl">TOEFL Score</Label>
                <Input
                  id="set-toefl"
                  type="number"
                  min={0}
                  max={120}
                  value={profile.toeflScore}
                  onChange={(e) => setField("toeflScore", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="set-work">Work Experience (years)</Label>
                <Input
                  id="set-work"
                  type="number"
                  min={0}
                  value={profile.workExperience}
                  onChange={(e) => setField("workExperience", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="set-intake">Preferred Intake</Label>
                <Input
                  id="set-intake"
                  value={profile.preferredIntake}
                  onChange={(e) => setField("preferredIntake", e.target.value)}
                  placeholder="Fall 2026"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="set-goals">Career Goals</Label>
                <Textarea
                  id="set-goals"
                  value={profile.careerGoals}
                  onChange={(e) => setField("careerGoals", e.target.value)}
                  placeholder="Where do you want your studies to take you?"
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveProfile} disabled={savingProfile || !profile.name.trim()}>
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
          </Button>
          {profileStatus && (
            <p className="text-xs text-muted-foreground">{profileStatus}</p>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Appearance</h3>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">
              Choose how the portal looks on this device
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  theme === opt.value
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <div className="space-y-2">
          {NOTIFICATION_OPTIONS.map((opt) => (
            <div
              key={opt.key}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <opt.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
              <Toggle
                checked={notifications[opt.key]}
                onChange={(checked) =>
                  setNotifications((n) => ({ ...n, [opt.key]: checked }))
                }
                label={opt.label}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Security</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="set-current-pw">Current Password</Label>
            <Input
              id="set-current-pw"
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, current: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="set-new-pw">New Password</Label>
            <Input
              id="set-new-pw"
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              placeholder="At least 8 characters"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={changePassword}
            disabled={
              savingPassword || !passwords.current || passwords.next.length < 8
            }
          >
            {savingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Change Password
          </Button>
          {passwordStatus && (
            <p
              className={cn(
                "text-xs",
                passwordStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
              )}
            >
              {passwordStatus.text}
            </p>
          )}
        </div>
      </Card>

      <Card className="border-rose-500/20 p-5">
        <div className="mb-4 flex items-center gap-2">
          <LogOut className="h-4 w-4 text-rose-500" />
          <h3 className="font-semibold text-rose-600 dark:text-rose-400">Session</h3>
        </div>
        <Button
          variant="outline"
          onClick={signOut}
          className="text-rose-600 hover:bg-rose-500/5 dark:text-rose-400"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </Card>
    </div>
  );
}
