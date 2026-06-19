"use client";

import { useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Download, Eye, EyeOff, KeyRound, Loader2, RefreshCw, RotateCcw, Shield, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import { passwordSchema, profileSchema } from "@/lib/validations";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { PlannerTask } from "@/lib/career-planner";
import type { JobApplication } from "@/lib/application-tracker";
import type { WeeklyReview } from "@/lib/weekly-review";
import type { NetworkingContact } from "@/lib/networking";
import type { CareerGoal } from "@/lib/career-goals";

type FieldErrors = Record<string, string>;

function collectErrors(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.reduce<FieldErrors>((acc, issue) => {
    const key = String(issue.path[0] || "form");
    acc[key] = issue.message;
    return acc;
  }, {});
}

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [plannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [jobApplications] = useLocalStorage<JobApplication[]>(LOCAL_STORAGE_KEYS.jobApplications, []);
  const [weeklyReviews] = useLocalStorage<WeeklyReview[]>(LOCAL_STORAGE_KEYS.weeklyReviews, []);
  const [networkingContacts] = useLocalStorage<NetworkingContact[]>(LOCAL_STORAGE_KEYS.networkingContacts, []);
  const [careerGoals] = useLocalStorage<CareerGoal[]>(LOCAL_STORAGE_KEYS.careerGoals, []);
  const initialProfile = {
    full_name: user?.full_name || "",
    username: user?.username || "",
    avatar_url: user?.avatar_url || "",
  };
  const [profile, setProfile] = useState(initialProfile);
  const [password, setPassword] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [localPreferenceCount, setLocalPreferenceCount] = useState(() => (
    typeof window === "undefined" ? 0 : Object.values(LOCAL_STORAGE_KEYS).filter((key) => window.localStorage.getItem(key) !== null).length
  ));
  const profileDirty = JSON.stringify(profile) !== JSON.stringify(initialProfile);
  const newPasswordStrength = [
    password.new_password.length >= 8,
    /[A-Z]/.test(password.new_password),
    /[a-z]/.test(password.new_password),
    /\d/.test(password.new_password),
    /[^A-Za-z0-9]/.test(password.new_password),
  ].filter(Boolean).length;
  const passwordsMatch = Boolean(password.new_password && password.confirm_password && password.new_password === password.confirm_password);
  const savedPreferenceNames = typeof window === "undefined"
    ? []
    : Object.entries(LOCAL_STORAGE_KEYS)
        .filter(([, key]) => window.localStorage.getItem(key) !== null)
        .map(([name]) => name);
  const profileSummary = [
    `Name: ${profile.full_name || "Not set"}`,
    `Username: ${profile.username || "Not set"}`,
    `Email: ${user?.email || "Not set"}`,
    `Plan: ${user?.plan || "free"}`,
  ].join("\n");

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      setProfileErrors(collectErrors(parsed.error.issues));
      return;
    }
    setSavingProfile(true);
    setProfileErrors({});
    try {
      await updateProfile(parsed.data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setPasswordErrors(collectErrors(parsed.error.issues));
      return;
    }
    setSavingPassword(true);
    setPasswordErrors({});
    try {
      await changePassword(parsed.data.current_password, parsed.data.new_password);
      setPassword({ current_password: "", new_password: "", confirm_password: "" });
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSavingPassword(false);
    }
  }

  function resetPasswordForm() {
    setPassword({ current_password: "", new_password: "", confirm_password: "" });
    setPasswordErrors({});
  }

  function resetLocalPreferences() {
    Object.values(LOCAL_STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
    setLocalPreferenceCount(0);
    toast.success("Local workspace preferences reset");
  }

  function recountLocalPreferences() {
    setLocalPreferenceCount(Object.values(LOCAL_STORAGE_KEYS).filter((key) => window.localStorage.getItem(key) !== null).length);
    toast.success("Preference count refreshed");
  }

  function exportLocalPreferences() {
    const preferences = Object.fromEntries(
      Object.entries(LOCAL_STORAGE_KEYS).map(([name, key]) => {
        const raw = window.localStorage.getItem(key);
        try {
          return [name, raw ? JSON.parse(raw) : null];
        } catch {
          return [name, raw];
        }
      })
    );
    downloadJson("careerpilot-local-preferences.json", {
      exported_at: new Date().toISOString(),
      preferences,
    });
  }

  function exportPreferenceInventory() {
    downloadCsv("careerpilot-preference-inventory.csv", Object.entries(LOCAL_STORAGE_KEYS).map(([name, key]) => ({
      preference: name,
      storage_key: key,
      saved: window.localStorage.getItem(key) !== null ? "yes" : "no",
    })));
  }

  function exportAccountSummary() {
    downloadJson("careerpilot-account-summary.json", {
      exported_at: new Date().toISOString(),
      profile: {
        full_name: profile.full_name || null,
        username: profile.username || null,
        email: user?.email || null,
        avatar_url: profile.avatar_url || null,
        plan: user?.plan || "free",
      },
      activity: {
        total_resumes: user?.total_resumes ?? 0,
        total_interviews: user?.total_interviews ?? 0,
      },
      local_preference_count: localPreferenceCount,
      planner: {
        total_actions: plannerTasks.length,
        completed_actions: plannerTasks.filter((task) => task.status === "done").length,
        recurring_actions: plannerTasks.filter((task) => task.recurrence && task.recurrence !== "none").length,
      },
      applications: {
        total: jobApplications.length,
        active: jobApplications.filter((application) => !application.archived && !["offer", "rejected", "withdrawn"].includes(application.stage)).length,
        scheduled_interviews: jobApplications.filter((application) => application.interviewAt).length,
      },
      weekly_reviews: {
        total: weeklyReviews.length,
        latest_week: weeklyReviews.map((review) => review.weekOf).sort().at(-1) || null,
      },
      networking: {
        total_contacts: networkingContacts.length,
        active_contacts: networkingContacts.filter((contact) => !contact.archived).length,
      },
    });
  }

  async function importLocalPreferences(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as { preferences?: Record<string, unknown> };
      Object.entries(parsed.preferences || {}).forEach(([name, value]) => {
        const storageKey = LOCAL_STORAGE_KEYS[name as keyof typeof LOCAL_STORAGE_KEYS];
        if (!storageKey) return;
        if (value === null || value === undefined) {
          window.localStorage.removeItem(storageKey);
        } else {
          window.localStorage.setItem(storageKey, JSON.stringify(value));
        }
      });
      setLocalPreferenceCount(Object.values(LOCAL_STORAGE_KEYS).filter((key) => window.localStorage.getItem(key) !== null).length);
      toast.success("Local preferences imported");
    } catch {
      toast.error("Could not import preferences");
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your profile, security, and privacy preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <UserRound className="mb-3 h-5 w-5 text-blue-400" />
          <div className="text-sm text-gray-500">Account</div>
          <div className="mt-1 text-lg font-bold text-white">{user?.plan || "free"} plan</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <CheckCircle className="mb-3 h-5 w-5 text-emerald-400" />
          <div className="text-sm text-gray-500">Resumes</div>
          <div className="mt-1 text-lg font-bold text-white">{user?.total_resumes ?? 0} uploaded</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <Shield className="mb-3 h-5 w-5 text-violet-400" />
          <div className="text-sm text-gray-500">Interviews</div>
          <div className="mt-1 text-lg font-bold text-white">{user?.total_interviews ?? 0} completed</div>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <button onClick={exportAccountSummary} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-gray-900 hover:text-white">
          <Download className="h-4 w-4" />
          Export account summary
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submitProfile} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-white">Profile</h3>
            <CopyButton value={profileSummary} label="Copy profile" />
          </div>
          <p className="mb-5 text-sm text-gray-500">Keep your workspace identity accurate for reports.</p>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-300">Full name</span>
              <input value={profile.full_name} maxLength={255} onChange={(e) => { setProfile((p) => ({ ...p, full_name: e.target.value })); setProfileErrors((errors) => ({ ...errors, full_name: "" })); }} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="Your name" />
              <span className="mt-1 block text-right text-xs text-gray-600">{profile.full_name.length}/255</span>
              {profileErrors.full_name && <span className="mt-1 block text-xs text-rose-400">{profileErrors.full_name}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-300">Username</span>
              <input value={profile.username} maxLength={50} onChange={(e) => { setProfile((p) => ({ ...p, username: e.target.value })); setProfileErrors((errors) => ({ ...errors, username: "" })); }} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="username" />
              <span className="mt-1 block text-right text-xs text-gray-600">{profile.username.length}/50</span>
              {profileErrors.username && <span className="mt-1 block text-xs text-rose-400">{profileErrors.username}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-300">Avatar URL</span>
              <input value={profile.avatar_url} maxLength={2048} onChange={(e) => { setProfile((p) => ({ ...p, avatar_url: e.target.value })); setProfileErrors((errors) => ({ ...errors, avatar_url: "" })); }} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="https://..." />
              {profileErrors.avatar_url && <span className="mt-1 block text-xs text-rose-400">{profileErrors.avatar_url}</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              <button disabled={savingProfile || !profileDirty} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
                {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
              </button>
              <button type="button" onClick={() => setProfile(initialProfile)} disabled={!profileDirty || savingProfile} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:text-white disabled:opacity-40">
                <RotateCcw className="h-4 w-4" />
                Reset changes
              </button>
            </div>
            {password.confirm_password && (
              <div className={`text-xs font-medium ${passwordsMatch ? "text-emerald-400" : "text-amber-400"}`}>
                {passwordsMatch ? "New passwords match" : "New passwords do not match yet"}
              </div>
            )}
          </div>
        </form>

        <form onSubmit={submitPassword} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-white"><KeyRound className="h-4 w-4 text-violet-400" /> Security</h3>
            <button type="button" onClick={() => setShowPasswords((value) => !value)} aria-pressed={showPasswords} aria-label={showPasswords ? "Hide passwords" : "Show passwords"} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-white">
              {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mb-5 text-sm text-gray-500">Change your password without disrupting current work.</p>
          <div className="space-y-4">
            {[
              ["current_password", "Current password"],
              ["new_password", "New password"],
              ["confirm_password", "Confirm new password"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>
                <input type={showPasswords ? "text" : "password"} autoComplete={key === "current_password" ? "current-password" : "new-password"} value={password[key as keyof typeof password]} onChange={(e) => { setPassword((p) => ({ ...p, [key]: e.target.value })); setPasswordErrors((errors) => ({ ...errors, [key]: "" })); }} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500" />
                {passwordErrors[key] && <span className="mt-1 block text-xs text-rose-400">{passwordErrors[key]}</span>}
                {key === "new_password" && password.new_password && (
                  <span className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => <span key={level} className={`h-1 flex-1 rounded-full ${newPasswordStrength >= level ? "bg-violet-500" : "bg-gray-800"}`} />)}
                  </span>
                )}
              </label>
            ))}
            <div className="flex flex-wrap gap-2">
              <button disabled={savingPassword || !password.current_password || !password.new_password || !password.confirm_password} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">
                {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />} Update password
              </button>
              <button type="button" onClick={resetPasswordForm} disabled={savingPassword} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:text-white disabled:opacity-40">
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h3 className="font-semibold text-emerald-300">Privacy promise</h3>
        <p className="mt-1 text-sm leading-6 text-gray-300">
          Your resume data is used only to generate your analysis, match jobs, and track progress. You can delete uploaded resumes from the Resume page whenever you need to reset your workspace.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-white">Workspace preferences</h3>
          <span className="rounded-full bg-gray-800 px-2 py-1 text-xs font-medium text-gray-400">{localPreferenceCount} saved</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Reset local-only UI preferences, saved job descriptions, recent matches, and pinned items.</p>
        {savedPreferenceNames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {savedPreferenceNames.map((name) => (
              <span key={name} className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-400">
                {name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportLocalPreferences} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
            <Download className="h-4 w-4" />
            Export local preferences
          </button>
          <button onClick={exportPreferenceInventory} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
            <Download className="h-4 w-4" />
            Export inventory
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
            <Upload className="h-4 w-4" />
            Import preferences
            <input type="file" accept="application/json,.json" onChange={importLocalPreferences} className="sr-only" />
          </label>
          <button onClick={resetLocalPreferences} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
            <RotateCcw className="h-4 w-4" />
            Reset local preferences
          </button>
          <button onClick={recountLocalPreferences} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
            <RefreshCw className="h-4 w-4" />
            Recount
          </button>
        </div>
      </div>
    </div>
  );
}
