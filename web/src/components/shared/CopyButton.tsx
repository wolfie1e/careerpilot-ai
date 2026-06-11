"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value.trim()}
      title={!value.trim() ? "Nothing to copy" : label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white",
        copied && "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        !value.trim() && "cursor-not-allowed opacity-40",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
