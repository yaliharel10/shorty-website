"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Pencil, Plus, Star as StarIcon, Trash2 } from "lucide-react";
import { AdminShell, adminInputClass } from "@/components/admin/AdminShell";
import type { Film } from "@/types";

type AdminFilm = Film & {
  published?: boolean;
  _count: { views: number; favorites: number; ratings: number; credits?: number };
};

export default function AdminFilmsPage() {
  const [films, setFilms] = useState<AdminFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadFilms = () => {
    fetch("/api/admin/films")
      .then((r) => r.json())
      .then((d) => setFilms(d.films || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFilms();
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/films", {
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
        published: form.get("published") !== "off",
      }),
    });
    if (res.ok) {
      setShowForm(false);
      loadFilms();
      (e.target as HTMLFormElement).reset();
    }
  };

  const patch = async (id: string, data: Record<string, unknown>) => {
    await fetch("/api/admin/films", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    loadFilms();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this film permanently?")) return;
    await fetch("/api/admin/films", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadFilms();
  };

  return (
    <AdminShell title="Manage Films">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#888]">{films.length} films in catalog</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold"
        >
          <Plus className="h-4 w-4" /> Add Film
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 grid gap-4 rounded-xl border border-[#222] bg-[#111] p-6 md:grid-cols-2">
          <input name="title" required placeholder="Title" className={adminInputClass} />
          <select name="category" required className={adminInputClass}>
            <option value="drama">Drama</option>
            <option value="comedy">Comedy</option>
            <option value="animation">Animation</option>
            <option value="sci-fi">Sci-Fi</option>
          </select>
          <input name="posterUrl" required placeholder="Poster URL" className={`${adminInputClass} md:col-span-2`} />
          <input name="videoUrl" required placeholder="YouTube URL" className={`${adminInputClass} md:col-span-2`} />
          <textarea name="description" required placeholder="Description" rows={3} className={`${adminInputClass} md:col-span-2`} />
          <input name="duration" type="number" defaultValue={15} placeholder="Duration (min)" className={adminInputClass} />
          <input name="year" type="number" defaultValue={2025} placeholder="Year" className={adminInputClass} />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="featured" /> Featured on homepage
          </label>
          <button type="submit" className="rounded-lg bg-[#ff7a18] py-3 font-bold md:col-span-2">
            Create Film
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {films.map((film) => (
            <div key={film.id} className="flex flex-col gap-4 rounded-xl border border-[#222] bg-[#111] p-4 sm:flex-row sm:items-center">
              <Image src={film.posterUrl} alt={film.title} width={60} height={90} className="rounded-lg object-cover" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{film.title}</h3>
                  {film.featured && <span className="rounded bg-[#ff7a18]/20 px-2 py-0.5 text-xs text-[#ff7a18]">Featured</span>}
                  {film.published === false && <span className="rounded bg-red-900/30 px-2 py-0.5 text-xs text-red-400">Draft</span>}
                </div>
                <p className="mt-1 text-sm capitalize text-[#888]">
                  {film.category} · {film.duration}m · ⭐ {film.rating.toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-[#555]">
                  {film._count.views} views · {film._count.favorites} favorites · {film._count.credits ?? 0} credits
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/films/${film.id}`} className="rounded-lg border border-[#333] px-3 py-2 text-sm hover:bg-[#222]">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button type="button" onClick={() => patch(film.id, { published: film.published === false })} className="rounded-lg border border-[#333] px-3 py-2">
                  {film.published === false ? <EyeOff className="h-4 w-4 text-red-400" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => patch(film.id, { featured: !film.featured })} className="rounded-lg border border-[#333] px-3 py-2">
                  <StarIcon className={`h-4 w-4 ${film.featured ? "fill-[#ff7a18] text-[#ff7a18]" : ""}`} />
                </button>
                <button type="button" onClick={() => handleDelete(film.id)} className="rounded-lg border border-red-900/50 px-3 py-2 text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
