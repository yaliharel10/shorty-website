"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Trash2, Star as StarIcon } from "lucide-react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import type { Film } from "@/types";

type AdminFilm = Film & {
  _count: { views: number; favorites: number; ratings: number };
};

function AdminFilmsContent() {
  const { user, loading: authLoading } = useAuth();
  const [films, setFilms] = useState<AdminFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const loadFilms = () => {
    fetch("/api/admin/films")
      .then((r) => r.json())
      .then((d) => setFilms(d.films || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      setError("Admin access required");
      setLoading(false);
      return;
    }
    loadFilms();
  }, [user, authLoading]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        category: form.get("category"),
        posterUrl: form.get("posterUrl"),
        videoUrl: form.get("videoUrl"),
        duration: Number(form.get("duration")),
        year: Number(form.get("year")),
        featured: form.get("featured") === "on",
      }),
    });
    if (res.ok) {
      setShowForm(false);
      loadFilms();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this film?")) return;
    await fetch("/api/admin/films", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadFilms();
  };

  const toggleFeatured = async (film: AdminFilm) => {
    await fetch("/api/admin/films", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: film.id, featured: !film.featured }),
    });
    loadFilms();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808]">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="text-[#ff7a18]">Back to Shorty</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-sm text-[#888] hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <h1 className="text-xl font-bold">Manage Films</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold hover:bg-[#ff9533]"
          >
            <Plus className="h-4 w-4" /> Add Film
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="mb-8 grid gap-4 rounded-xl border border-[#222] bg-[#111] p-6 md:grid-cols-2"
          >
            <input name="title" required placeholder="Title" className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18]" />
            <select name="category" required className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18]">
              <option value="drama">Drama</option>
              <option value="comedy">Comedy</option>
              <option value="animation">Animation</option>
              <option value="sci-fi">Sci-Fi</option>
            </select>
            <input name="posterUrl" required placeholder="Poster URL" className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18] md:col-span-2" />
            <input name="videoUrl" required placeholder="YouTube embed URL" className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18] md:col-span-2" />
            <textarea name="description" required placeholder="Description" rows={3} className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18] md:col-span-2" />
            <input name="duration" type="number" defaultValue={15} placeholder="Duration (min)" className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18]" />
            <input name="year" type="number" defaultValue={2025} placeholder="Year" className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18]" />
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" name="featured" /> Featured on homepage
            </label>
            <button type="submit" className="rounded-lg bg-[#ff7a18] py-3 font-bold md:col-span-2">
              Add Film
            </button>
          </form>
        )}

        <div className="space-y-3">
          {films.map((film) => (
            <div
              key={film.id}
              className="flex flex-col gap-4 rounded-xl border border-[#222] bg-[#111] p-4 sm:flex-row sm:items-center"
            >
              <Image
                src={film.posterUrl}
                alt={film.title}
                width={60}
                height={90}
                className="rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{film.title}</h3>
                  {film.featured && (
                    <span className="rounded bg-[#ff7a18]/20 px-2 py-0.5 text-xs text-[#ff7a18]">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm capitalize text-[#888]">
                  {film.category} · {film.duration}m · ⭐ {film.rating.toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-[#555]">
                  {film._count.views} views · {film._count.favorites} favorites · {film._count.ratings} ratings
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleFeatured(film)}
                  className="rounded-lg border border-[#333] px-3 py-2 text-sm hover:bg-[#222]"
                  title="Toggle featured"
                >
                  <StarIcon className={`h-4 w-4 ${film.featured ? "fill-[#ff7a18] text-[#ff7a18]" : ""}`} />
                </button>
                <button
                  onClick={() => handleDelete(film.id)}
                  className="rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function AdminFilmsPage() {
  return (
    <AuthProvider>
      <AdminFilmsContent />
    </AuthProvider>
  );
}
