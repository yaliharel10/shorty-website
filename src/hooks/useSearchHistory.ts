"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "shorty_recent_searches";
const MAX_ITEMS = 8;

export function useSearchHistory() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      setRecent([]);
    }
  }, []);

  const persist = useCallback((items: string[]) => {
    setRecent(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota */
    }
  }, []);

  const addSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) return;
      const next = [trimmed, ...recent.filter((q) => q !== trimmed)].slice(0, MAX_ITEMS);
      persist(next);
    },
    [recent, persist]
  );

  const clearHistory = useCallback(() => persist([]), [persist]);

  return { recent, addSearch, clearHistory };
}

export const TRENDING_SEARCHES = [
  "drama",
  "animation",
  "sci-fi",
  "under 10 minutes",
  "top rated",
];
