import { cn } from "@/lib/utils";

export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[#ff7a18] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
        className
      )}
    >
      New
    </span>
  );
}

export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={cn("h-1 w-full overflow-hidden rounded-full bg-white/20", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[#ff7a18] transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
