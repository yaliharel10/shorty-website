"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  isFavorite: boolean;
  onToggle: () => void | Promise<void>;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "pill";
  className?: string;
  label?: string;
  disabled?: boolean;
};

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = "md",
  variant = "icon",
  className,
  label,
  disabled,
}: FavoriteButtonProps) {
  const [animating, setAnimating] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!animating) return;
    const t = setTimeout(() => setAnimating(false), 450);
    return () => clearTimeout(t);
  }, [animating]);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(false), 600);
    return () => clearTimeout(t);
  }, [burst]);

  const handleClick = async () => {
    if (disabled) return;
    const wasFavorite = isFavorite;
    await onToggle();
    if (!wasFavorite) {
      setAnimating(true);
      setBurst(true);
    }
  };

  const heart = (
    <span className="relative inline-flex">
      {burst && (
        <span
          className="pointer-events-none absolute inset-0 animate-heart-burst rounded-full bg-red-500/30"
          aria-hidden="true"
        />
      )}
      <Heart
        className={cn(
          sizeMap[size],
          "transition-colors duration-200",
          isFavorite
            ? "fill-red-500 text-red-500"
            : "fill-none text-current",
          animating && "animate-heart-pop"
        )}
        aria-hidden="true"
      />
    </span>
  );

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Remove from My List" : "Add to My List"}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition hover:scale-[1.02]",
          isFavorite
            ? "bg-[#ff7a18] text-white shadow-lg shadow-[#ff7a18]/30"
            : "glass text-white hover:bg-white/10",
          className
        )}
      >
        {heart}
        {label ?? (isFavorite ? "In My List" : "My List")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from My List" : "Add to My List"}
      className={cn(
        "rounded-full p-2 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a18]",
        isFavorite ? "text-red-500" : "text-[#555] hover:text-red-400",
        className
      )}
    >
      {heart}
    </button>
  );
}
