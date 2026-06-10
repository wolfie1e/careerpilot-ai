"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Mic, MessageSquare, Loader2, ChevronRight, CheckCircle, RotateCcw, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { INTERVIEW_TYPES, DIFFICULTY_LEVELS, QUESTION_COUNTS, INTERVIEW_PREP_TIPS, ROLE_PRESETS, LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { interviewSetupSchema } from "@/lib/validations";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface SessionResponse {
  session_id: string;
  session_mode: string;
}

const DEFAULT_INTERVIEW_SETUP = {
  role_title: "",
  difficulty: "intermediate",
  interview_type: "behavioral",
  session_mode: "text",
  question_count: 5,
};
const MAX_RECENT_ROLES = 6;

export default function InterviewSetupPage() {
  const router = useRouter();
  const [recentRoles, setRecentRoles] = useLocalStorage<string[]>(LOCAL_STORAGE_KEYS.recentInterviewRoles, []);
  const [form, setForm] = useLocalStorage(LOCAL_STORAGE_KEYS.interviewSetup, DEFAULT_INTERVIEW_SETUP);
  const [loading, setLoading] = useState(false);
  const [roleError, setRoleError] = useState("");

  const update = (field: string, value: unknown) => setForm((f) => {
    const next = { ...f, [field]: value };
    return next;
  });
  const prepTip = INTERVIEW_PREP_TIPS[form.interview_type as keyof typeof INTERVIEW_PREP_TIPS];
  const estimatedMinutes = form.question_count * (form.session_mode === "voice" ? 4 : 3);
  const sessionPlan = [
    form.role_title.trim() ? form.role_title.trim() : "Choose a target role",
    `${form.question_count} ${form.interview_type.replace("_", " ")} questions`,
    `${form.session_mode} answers · ${estimatedMinutes}-${estimatedMinutes + 5} min`,
  ];

  async function handleStart() {
    const parsed = interviewSetupSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setRoleError(first.path[0] === "role_title" ? first.message : "");
      toast.error(first.message);
      return;
    }
    setRoleError("");
    setLoading(true);
    try {
      const session = await api.post<SessionResponse>("/interview/sessions", parsed.data);
      setRecentRoles((prev) => [parsed.data.role_title, ...prev.filter((role) => role !== parsed.data.role_title)].slice(0, MAX_RECENT_ROLES));
      const path = `/interview/${form.session_mode}/${session.session_id}`;
      router.push(path);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setLoading(false);
    }
  }

  function resetSetup() {
    setForm(DEFAULT_INTERVIEW_SETUP);
    setRoleError("");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Set Up Your Interview</h2>
        <p className="text-sm text-gray-400 mt-1">Configure your practice session and let the AI generate targeted questions</p>
      </div>

      <div className="space-y-5">
        {/* Role */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">Target Role <span className="text-rose-400">*</span></label>
          <input
            type="text"
            value={form.role_title}
            onChange={(e) => { update("role_title", e.target.value); setRoleError(""); }}
            placeholder="e.g. Senior Software Engineer, Product Manager, Data Scientist"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          {roleError && <p className="mt-1.5 text-xs text-rose-400">{roleError}</p>}
          {recentRoles.length > 0 && (
            <>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-gray-500">Recent roles</div>
                <button type="button" onClick={() => setRecentRoles([])} className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 transition hover:text-rose-300">
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {recentRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { update("role_title", role); setRoleError(""); }}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:border-blue-400/50 transition-colors"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {ROLE_PRESETS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { update("role_title", role); setRoleError(""); }}
                className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Interview type */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">Interview Type</label>
          <div className="grid grid-cols-3 gap-2">
            {INTERVIEW_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => update("interview_type", t.value)}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-medium transition-all border",
                  form.interview_type === t.value
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">{prepTip}</p>
        </div>

        {/* Difficulty */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTY_LEVELS.map((d) => (
              <button
                key={d.value}
                onClick={() => update("difficulty", d.value)}
                className={cn(
                  "py-2 px-3 rounded-lg text-xs font-medium transition-all border",
                  form.difficulty === d.value
                    ? "bg-violet-600 border-violet-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">Number of Questions</label>
          <div className="flex gap-2">
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => update("question_count", n)}
                className={cn(
                  "w-12 h-10 rounded-lg text-sm font-medium transition-all border",
                  form.question_count === n
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-300 mb-3">Answer Mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => update("session_mode", "text")}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                form.session_mode === "text"
                  ? "bg-blue-600/20 border-blue-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              )}
            >
              <MessageSquare className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-medium text-sm">Text</div>
                <div className="text-xs opacity-60">Type your answers</div>
              </div>
            </button>
            <button
              onClick={() => update("session_mode", "voice")}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                form.session_mode === "voice"
                  ? "bg-violet-600/20 border-violet-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              )}
            >
              <Mic className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-medium text-sm">Voice</div>
                <div className="text-xs opacity-60">Record your answers</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Session Plan</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {sessionPlan.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-xs text-gray-300">
                <CheckCircle className={cn("h-3.5 w-3.5 shrink-0", form.role_title.trim() ? "text-emerald-400" : "text-gray-600")} />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={loading || !form.role_title.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:bg-blue-600/40"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Generating questions…</>
            ) : (
              <>Start Interview <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
          <button onClick={resetSetup} disabled={loading} title="Reset setup" className="rounded-xl border border-gray-700 px-4 text-gray-400 transition hover:bg-gray-900 hover:text-white disabled:opacity-40">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          Estimated session time: {estimatedMinutes}-{estimatedMinutes + 5} minutes
        </div>
      </div>
    </div>
  );
}
