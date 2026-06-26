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

export function RuntimeBadge({
  minutes,
  tier,
  className,
  prominent = false,
}: {
  minutes: number;
  tier?: "micro" | "short" | "extended";
  className?: string;
  prominent?: boolean;
}) {
  const tierColors = {
    micro: "bg-violet-500/90 text-white",
    short: "bg-[#ff7a18]/90 text-black",
    extended: "bg-white/90 text-black",
  } as const;

  const color = tier ? tierColors[tier] : "bg-black/75 text-white";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-bold tabular-nums shadow-sm backdrop-blur-sm",
        prominent ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
        color,
        className
      )}
    >
      {minutes}m
    </span>
  );
}

export function DurationTierBadge({
  tier,
  className,
}: {
  tier: "micro" | "short" | "extended";
  className?: string;
}) {
  const labels = {
    micro: "Micro",
    short: "Short",
    extended: "Extended",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#ccc]",
        className
      )}
    >
      {labels[tier]}
    </span>
  );
}
