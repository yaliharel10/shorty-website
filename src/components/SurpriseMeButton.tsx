"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";

type SurpriseMeButtonProps = {
  onNeedAuth?: () => void;
  className?: string;
};

export function SurpriseMeButton({ onNeedAuth, className }: SurpriseMeButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) {
      onNeedAuth?.();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/films/surprise");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not pick a film");
      router.push(`/watch/${data.film.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Surprise pick failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-[#333] bg-[#1a1a1a]/80 px-4 py-2 text-sm font-medium text-[#ccc] transition hover:border-[#ff7a18]/50 hover:text-white disabled:opacity-50"
      }
    >
      <Shuffle className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Picking…" : "Surprise Me"}
    </button>
  );
}
