"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/Toast";

type ShareButtonProps = {
  filmId: string;
  title: string;
  className?: string;
};

export function ShareButton({ filmId, title, className }: ShareButtonProps) {
  const { toast } = useToast();

  const share = async () => {
    const url = `${window.location.origin}/films/${filmId}`;
    const text = `Watch "${title}" on Shorty — premium short films`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard", "success");
    } catch {
      toast("Could not share link", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={
        className ??
        "flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      }
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
      Share
    </button>
  );
}
