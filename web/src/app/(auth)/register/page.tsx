"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { registerSchema } from "@/lib/validations";

const perks = [
  "Free ATS score analysis",
  "Resume-JD matching",
  "3 mock interview sessions",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: "", username: "", password: "", full_name: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordStrength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;
  const passwordStrengthLabel = passwordStrength >= 5 ? "Strong" : passwordStrength >= 3 ? "Good" : passwordStrength >= 1 ? "Weak" : "Not started";

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((errors) => ({ ...errors, [field]: "" }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedForm = {
      ...form,
      email: form.email.trim(),
      username: form.username.trim(),
      full_name: form.full_name.trim(),
    };
    const result = registerSchema.safeParse(normalizedForm);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((err) => { if (err.path[0]) errs[String(err.path[0])] = err.message; });
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      await register(normalizedForm.email, normalizedForm.username, normalizedForm.password, normalizedForm.full_name || undefined);
      toast.success("Account created! Welcome to CareerPilot AI.");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl">CareerPilot AI</span>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm mb-3">Free forever. No credit card required.</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
            {perks.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle className="w-3 h-3" />
                {p}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full name <span className="text-gray-600">(optional)</span></label>
              <input
                type="text"
                value={form.full_name}
                onChange={update("full_name")}
                placeholder="Alex Johnson"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                required
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              {fieldErrors.email && <p className="text-xs text-rose-400 mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={update("username")}
                required
                minLength={3}
                placeholder="alex_dev"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              {fieldErrors.username && <p className="text-xs text-rose-400 mt-1">{fieldErrors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 pr-11 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span key={level} className={`h-1 flex-1 rounded-full ${passwordStrength >= level ? "bg-blue-500" : "bg-gray-800"}`} />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-500">{passwordStrengthLabel}</span>
              </div>
              {fieldErrors.password && <p className="text-xs text-rose-400 mt-1">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
