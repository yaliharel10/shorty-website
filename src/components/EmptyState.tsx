"use client";

import { Heart, Film, SearchX } from "lucide-react";

type EmptyStateProps = {
  variant: "favorites" | "search" | "generic";
  query?: string;
};

export function EmptyState({ variant, query }: EmptyStateProps) {
  const config = {
    favorites: {
      icon: Heart,
      title: "Your list is empty",
      description: "Save films you love by clicking the heart icon while watching.",
    },
    search: {
      icon: SearchX,
      title: query ? `No results for "${query}"` : "No films found",
      description: "Try a different search term or browse by category.",
    },
    generic: {
      icon: Film,
      title: "Nothing here yet",
      description: "Check back soon for new short films.",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a]">
        <Icon className="h-8 w-8 text-[#555]" />
      </div>
      <h3 className="mb-2 text-xl font-bold">{config.title}</h3>
      <p className="max-w-sm text-sm text-[#888]">{config.description}</p>
    </div>
  );
}
