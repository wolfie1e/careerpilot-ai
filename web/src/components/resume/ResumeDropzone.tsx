"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface ResumeDropzoneProps {
  onUploaded: (resume: { id: string; filename: string; parsed_sections: Record<string, unknown> }) => void;
}

export default function ResumeDropzone({ onUploaded }: ResumeDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext || "")) {
        toast.error("Unsupported file type. Use PDF, DOCX, or TXT.");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error("File too large. Max 10MB.");
        return;
      }
      setFile(f);
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", f);
        const resume = await api.postForm<{ id: string; filename: string; parsed_sections: Record<string, unknown> }>(
          "/resume",
          form
        );
        setDone(true);
        toast.success("Resume uploaded and parsed!");
        onUploaded(resume);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        toast.error(msg);
        setFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "text/plain": [".txt"] },
    maxFiles: 1,
    disabled: uploading,
  });

  if (done && file) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <div className="text-sm font-medium text-white">{file.name}</div>
          <div className="text-xs text-emerald-400">Uploaded and parsed successfully</div>
        </div>
        <button
          onClick={() => { setFile(null); setDone(false); }}
          className="ml-auto text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
        isDragActive
          ? "border-blue-500 bg-blue-500/10"
          : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/30",
        uploading && "cursor-not-allowed opacity-60"
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <div className="text-sm text-gray-300">Uploading and parsing…</div>
          <div className="text-xs text-gray-500">{file?.name}</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors", isDragActive ? "bg-blue-500/20" : "bg-gray-800")}>
            {isDragActive ? <Upload className="w-7 h-7 text-blue-400" /> : <FileText className="w-7 h-7 text-gray-400" />}
          </div>
          <div>
            <div className="text-sm font-medium text-white mb-1">
              {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
            </div>
            <div className="text-xs text-gray-500">PDF, DOCX, or TXT · Max 10MB</div>
          </div>
          {!isDragActive && (
            <div className="text-xs text-blue-400 hover:text-blue-300 font-medium">or click to browse</div>
          )}
        </div>
      )}
    </div>
  );
}
