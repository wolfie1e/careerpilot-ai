"use client";

import { useState, useEffect } from "react";
import { ArrowUpDown, Download, FileText, HardDrive, Loader2, Search, Star } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadJson } from "@/lib/export-utils";
import { formatBytes, safeFilename } from "@/lib/utils";

interface Resume {
  id: string;
  filename: string;
  file_size: number | null;
  created_at: string;
}

interface ReportsView {
  search: string;
  sort: string;
}

export default function ReportsPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [reportsView, setReportsView] = useLocalStorage<ReportsView>(LOCAL_STORAGE_KEYS.reportsView, { search: "", sort: "newest" });
  const [pinnedResumeId] = useLocalStorage<string | null>(LOCAL_STORAGE_KEYS.pinnedResume, null);
  const orderedResumes = [...resumes].sort((a, b) => {
    if (a.id === pinnedResumeId) return -1;
    if (b.id === pinnedResumeId) return 1;
    if (reportsView.sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (reportsView.sort === "name") return a.filename.localeCompare(b.filename);
    if (reportsView.sort === "size_desc") return (b.file_size ?? 0) - (a.file_size ?? 0);
    if (reportsView.sort === "size_asc") return (a.file_size ?? Number.MAX_SAFE_INTEGER) - (b.file_size ?? Number.MAX_SAFE_INTEGER);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const visibleResumes = orderedResumes.filter((resume) => (
    resume.filename.toLowerCase().includes(reportsView.search.trim().toLowerCase())
  ));
  const totalStorage = resumes.reduce((sum, resume) => sum + (resume.file_size ?? 0), 0);
  const pinnedResume = pinnedResumeId ? resumes.find((resume) => resume.id === pinnedResumeId) ?? null : null;

  useEffect(() => {
    api.get<Resume[]>("/resume")
      .then(setResumes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function downloadReport(resumeId: string, format: "pdf" | "md", filename = "resume-report") {
    setDownloading(`${resumeId}-${format}`);
    try {
      const res = await fetch(`/api/reports/resume/${resumeId}?format=${format}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Report generation failed. Run analysis first.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFilename(filename)}-careerpilot-report.${format === "pdf" ? "pdf" : "md"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  async function downloadBoth(resumeId: string, filename: string) {
    await downloadReport(resumeId, "pdf", filename);
    await downloadReport(resumeId, "md", filename);
  }

  function exportManifest() {
    downloadJson("careerpilot-report-manifest.json", visibleResumes.map((resume) => ({
      id: resume.id,
      filename: resume.filename,
      file_size: resume.file_size,
      uploaded_at: resume.created_at,
      is_primary: resume.id === pinnedResumeId,
    })));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Reports</h2>
          <p className="text-sm text-gray-400 mt-1">
            {resumes.length > 0 ? `${visibleResumes.length} of ${resumes.length} resume reports` : "Download analysis reports for your resumes"}
          </p>
        </div>
        {resumes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pinnedResume && (
              <button onClick={() => downloadReport(pinnedResume.id, "pdf", pinnedResume.filename)} disabled={!!downloading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                {downloading === `${pinnedResume.id}-pdf` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 fill-white" />}
                Primary PDF
              </button>
            )}
            <button onClick={exportManifest} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white">
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No reports yet"
          description="Upload and analyze a resume to generate a detailed PDF or Markdown report."
          actionHref="/resume"
          actionLabel="Go to Resume Manager"
        />
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <FileText className="mb-2 h-4 w-4 text-blue-400" />
              <div className="text-lg font-bold text-white">{resumes.length}</div>
              <div className="text-xs text-gray-500">Report sources</div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <HardDrive className="mb-2 h-4 w-4 text-emerald-400" />
              <div className="text-lg font-bold text-white">{formatBytes(totalStorage)}</div>
              <div className="text-xs text-gray-500">Uploaded resume storage</div>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <Star className="mb-2 h-4 w-4 text-amber-400" />
              <div className="text-lg font-bold text-white">{pinnedResumeId ? "Set" : "Not set"}</div>
              <div className="text-xs text-gray-500">Primary resume</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                value={reportsView.search}
                onChange={(e) => setReportsView((view) => ({ ...view, search: e.target.value }))}
                placeholder="Search resume reports..."
                className="w-full rounded-xl border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </label>
            <label className="relative block">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <select
                value={reportsView.sort}
                onChange={(e) => setReportsView((view) => ({ ...view, sort: e.target.value }))}
                className="w-full appearance-none rounded-xl border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Filename A-Z</option>
                <option value="size_desc">Largest file</option>
                <option value="size_asc">Smallest file</option>
              </select>
            </label>
          </div>
          {visibleResumes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900 p-10 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-gray-700" />
              <p className="text-sm text-gray-400">No reports match your search</p>
              <button onClick={() => setReportsView((view) => ({ ...view, search: "" }))} className="mt-3 text-xs font-medium text-blue-400 transition hover:text-blue-300">
                Clear search
              </button>
            </div>
          ) : (
          <div className="divide-y divide-gray-800 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {visibleResumes.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4">
              <FileText className="w-8 h-8 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-white text-sm truncate">{r.filename}</div>
                  {pinnedResumeId === r.id && <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">Primary</span>}
                </div>
                <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()} · {formatBytes(r.file_size)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadReport(r.id, "pdf", r.filename)}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-all"
                >
                  {downloading === `${r.id}-pdf` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  PDF
                </button>
                <button
                  onClick={() => downloadReport(r.id, "md", r.filename)}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  {downloading === `${r.id}-md` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  MD
                </button>
                <button
                  onClick={() => downloadBoth(r.id, r.filename)}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-emerald-700/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 rounded-lg transition-all"
                >
                  Both
                </button>
              </div>
            </div>
          ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
