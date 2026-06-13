import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div aria-busy="true" aria-label="Loading content" className={cn("bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse", className)}>
      <div className="h-3 bg-gray-800 rounded w-1/2 mb-3" />
      <div className="h-7 bg-gray-800 rounded w-1/3 mb-3" />
      {lines > 2 && <div className="h-2 bg-gray-800 rounded w-2/3" />}
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-900 border border-gray-800 rounded-xl flex items-center gap-3 px-4">
          <div className="w-8 h-8 bg-gray-800 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 bg-gray-800 rounded w-1/3" />
            <div className="h-2 bg-gray-800 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
