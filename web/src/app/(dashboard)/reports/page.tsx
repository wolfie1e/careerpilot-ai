"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { formatBytes, safeFilename } from "@/lib/utils";

interface Resume {
  id: string;
  filename: string;
  file_size: number | null;
  created_at: string;
}

export default function ReportsPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [pinnedResumeId] = useLocalStorage<string | null>(LOCAL_STORAGE_KEYS.pinnedResume, null);
  const orderedResumes = [...resumes].sort((a, b) => {
    if (a.id === pinnedResumeId) return -1;
    if (b.id === pinnedResumeId) return 1;
    return 0;
  });

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

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Reports</h2>
        <p className="text-sm text-gray-400 mt-1">Download analysis reports for your resumes</p>
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
        <div className="divide-y divide-gray-800 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {orderedResumes.map((r) => (
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
  );
}
