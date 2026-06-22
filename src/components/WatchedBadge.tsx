import { Check, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type WatchedBadgeProps = {
  variant?: "watched" | "continue";
  className?: string;
};

export function WatchedBadge({ variant = "watched", className }: WatchedBadgeProps) {
  const isContinue = variant === "continue";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm",
        isContinue
          ? "bg-[#ff7a18]/90 text-white"
          : "bg-emerald-600/90 text-white",
        className
      )}
    >
      {isContinue ? (
        <>
          <Play className="h-2.5 w-2.5 fill-white" aria-hidden="true" />
          Continue
        </>
      ) : (
        <>
          <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
          Watched
        </>
      )}
    </span>
  );
}
