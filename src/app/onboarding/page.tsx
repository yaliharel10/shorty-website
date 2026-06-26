"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";

type Film = { id: string; title: string; posterUrl: string; category: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [films, setFilms] = useState<Film[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/films/catalog?limit=12")
      .then((r) => r.json())
      .then((d) => setFilms(d.films?.slice(0, 12) ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  const finish = async () => {
    setSaving(true);
    for (const filmId of picked) {
      await fetch(`/api/favorites/${filmId}`, { method: "POST" }).catch(() => {});
    }
    await fetch("/api/account/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoriteIds: [...picked] }),
    });
    router.push("/browse");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <Link href="/" className="text-xl font-extrabold">
          Shorty<span className="text-[#ff7a18]">.</span>
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">Pick films for your list</h1>
        <p className="mt-2 text-[#888]">
          Choose up to 5 short films to get started. You can always add more later.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {films.map((film) => (
            <button
              key={film.id}
              type="button"
              onClick={() => toggle(film.id)}
              className={`rounded-xl border p-4 text-left transition ${
                picked.has(film.id)
                  ? "border-[#ff7a18] bg-[#ff7a18]/10"
                  : "border-[#222] bg-[#111] hover:border-[#444]"
              }`}
            >
              <p className="font-semibold">{film.title}</p>
              <p className="mt-1 text-xs capitalize text-[#666]">{film.category}</p>
            </button>
          ))}
        </div>
        <div className="mt-10 flex gap-4">
          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className="rounded-lg bg-[#ff7a18] px-8 py-3 font-bold hover:bg-[#ff9533] disabled:opacity-50"
          >
            {saving ? "Saving..." : picked.size > 0 ? `Continue (${picked.size} selected)` : "Skip for now"}
          </button>
          <button
            type="button"
            onClick={finish}
            className="text-sm text-[#888] hover:text-white"
          >
            Skip
          </button>
        </div>
      </main>
    </div>
  );
}
