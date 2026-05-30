"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Resume {
  id: string;
  filename: string;
  created_at: string;
}

export default function ReportsPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    api.get<Resume[]>("/resume")
      .then(setResumes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function downloadReport(resumeId: string, format: "pdf" | "md") {
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
      a.download = `resume-report.${format === "pdf" ? "pdf" : "md"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
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
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <Download className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white mb-1.5">No reports yet</h3>
          <p className="text-sm text-gray-400 mb-4 max-w-xs mx-auto">
            Upload and analyze a resume to generate a detailed PDF or Markdown report.
          </p>
          <a href="/resume" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Go to Resume Manager →
          </a>
        </div>
      ) : (
        <div className="divide-y divide-gray-800 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {resumes.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4">
              <FileText className="w-8 h-8 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm truncate">{r.filename}</div>
                <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadReport(r.id, "pdf")}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-all"
                >
                  {downloading === `${r.id}-pdf` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  PDF
                </button>
                <button
                  onClick={() => downloadReport(r.id, "md")}
                  disabled={!!downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  {downloading === `${r.id}-md` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  MD
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
