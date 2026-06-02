"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, KeyRound, Loader2, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { passwordSchema, profileSchema } from "@/lib/validations";

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
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "",
    avatar_url: user?.avatar_url || "",
  });
  const [password, setPassword] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submitProfile} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-1 font-semibold text-white">Profile</h3>
          <p className="mb-5 text-sm text-gray-500">Keep your workspace identity accurate for reports.</p>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-300">Full name</span>
              <input value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="Your name" />
              {profileErrors.full_name && <span className="mt-1 block text-xs text-rose-400">{profileErrors.full_name}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-300">Username</span>
              <input value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="username" />
              {profileErrors.username && <span className="mt-1 block text-xs text-rose-400">{profileErrors.username}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-300">Avatar URL</span>
              <input value={profile.avatar_url} onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500" placeholder="https://..." />
              {profileErrors.avatar_url && <span className="mt-1 block text-xs text-rose-400">{profileErrors.avatar_url}</span>}
            </label>
            <button disabled={savingProfile} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
            </button>
          </div>
        </form>

        <form onSubmit={submitPassword} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-1 flex items-center gap-2 font-semibold text-white"><KeyRound className="h-4 w-4 text-violet-400" /> Security</h3>
          <p className="mb-5 text-sm text-gray-500">Change your password without disrupting current work.</p>
          <div className="space-y-4">
            {[
              ["current_password", "Current password"],
              ["new_password", "New password"],
              ["confirm_password", "Confirm new password"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>
                <input type="password" value={password[key as keyof typeof password]} onChange={(e) => setPassword((p) => ({ ...p, [key]: e.target.value }))} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-violet-500" />
                {passwordErrors[key] && <span className="mt-1 block text-xs text-rose-400">{passwordErrors[key]}</span>}
              </label>
            ))}
            <button disabled={savingPassword} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">
              {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />} Update password
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h3 className="font-semibold text-emerald-300">Privacy promise</h3>
        <p className="mt-1 text-sm leading-6 text-gray-300">
          Your resume data is used only to generate your analysis, match jobs, and track progress. You can delete uploaded resumes from the Resume page whenever you need to reset your workspace.
        </p>
      </div>
    </div>
  );
}
