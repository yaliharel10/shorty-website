"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AdminShell, adminInputClass, adminLabelClass } from "@/components/admin/AdminShell";
import { GENRES, MOODS } from "@/lib/film-metadata";
import { PERSON_ROLES } from "@/lib/person-utils";

type FilmDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  posterUrl: string;
  videoUrl: string;
  duration: number;
  year: number;
  featured: boolean;
  published: boolean;
  rating: number;
  language: string;
  country: string | null;
  monthlyFreeMonth: string | null;
  genres: string[];
  moods: string[];
  tags: string[];
  credits: {
    id: string;
    role: string;
    characterName: string | null;
    person: { id: string; name: string; primaryRole: string };
  }[];
};

type PersonOption = { id: string; name: string; primaryRole: string };

export default function AdminFilmEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [creditPersonId, setCreditPersonId] = useState("");
  const [creditRole, setCreditRole] = useState("actor");
  const [creditCharacter, setCreditCharacter] = useState("");

  const load = () => {
    fetch(`/api/admin/films/${id}`)
      .then((r) => r.json())
      .then((d) => setFilm(d.film));
    fetch("/api/admin/people")
      .then((r) => r.json())
      .then((d) => setPeople(d.people || []));
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!film) return;
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await fetch(`/api/admin/films/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        category: form.get("category"),
        posterUrl: form.get("posterUrl"),
        videoUrl: form.get("videoUrl"),
        duration: Number(form.get("duration")),
        year: Number(form.get("year")),
        rating: Number(form.get("rating")),
        language: form.get("language"),
        country: form.get("country") || null,
        monthlyFreeMonth: form.get("monthlyFreeMonth") || null,
        featured: form.get("featured") === "on",
        published: form.get("published") === "on",
        genres: form.getAll("genres"),
        moods: form.getAll("moods"),
        tags: String(form.get("tags") || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    setSaving(false);
    load();
  };

  const addCredit = async () => {
    if (!creditPersonId) return;
    await fetch(`/api/admin/films/${id}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: creditPersonId,
        role: creditRole,
        characterName: creditCharacter || null,
      }),
    });
    setCreditPersonId("");
    setCreditCharacter("");
    load();
  };

  const removeCredit = async (creditId: string) => {
    await fetch(`/api/admin/films/${id}/credits`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditId }),
    });
    load();
  };

  const deleteFilm = async () => {
    if (!confirm("Delete this film?")) return;
    await fetch(`/api/admin/films/${id}`, { method: "DELETE" });
    router.push("/admin/films");
  };

  if (!film) {
    return (
      <AdminShell title="Edit Film">
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Edit: ${film.title}`}>
      <div className="mb-6">
        <Link href="/admin/films" className="text-sm text-[#888] hover:text-white">
          ← Back to films
        </Link>
      </div>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-[#222] bg-[#111] p-6">
          <h2 className="font-bold">Details</h2>
          {[
            ["title", "Title", film.title],
            ["posterUrl", "Poster URL", film.posterUrl],
            ["videoUrl", "Video URL", film.videoUrl],
            ["duration", "Duration (min)", film.duration],
            ["year", "Year", film.year],
            ["rating", "Rating", film.rating],
            ["language", "Language", film.language],
            ["country", "Country", film.country ?? ""],
            ["monthlyFreeMonth", "Free month (YYYY-MM)", film.monthlyFreeMonth ?? ""],
          ].map(([name, label, value]) => (
            <div key={String(name)}>
              <label className={adminLabelClass}>{label}</label>
              <input name={String(name)} defaultValue={String(value)} className={adminInputClass} />
            </div>
          ))}
          <div>
            <label className={adminLabelClass}>Category</label>
            <select name="category" defaultValue={film.category} className={adminInputClass}>
              {["drama", "comedy", "animation", "sci-fi"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminLabelClass}>Description</label>
            <textarea name="description" defaultValue={film.description} rows={4} className={adminInputClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Tags (comma-separated)</label>
            <input name="tags" defaultValue={film.tags.join(", ")} className={adminInputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={film.featured} /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={film.published !== false} /> Published
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[#222] bg-[#111] p-6">
            <h2 className="mb-3 font-bold">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <label key={g.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="genres" value={g.id} defaultChecked={film.genres.includes(g.id)} />
                  {g.label}
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#111] p-6">
            <h2 className="mb-3 font-bold">Moods</h2>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <label key={m.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="moods" value={m.id} defaultChecked={film.moods.includes(m.id)} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#222] bg-[#111] p-6">
            <h2 className="mb-3 font-bold">Cast & Crew</h2>
            <ul className="mb-4 space-y-2">
              {film.credits.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm">
                  <span>
                    {c.person.name} · {c.role}
                    {c.characterName ? ` as ${c.characterName}` : ""}
                  </span>
                  <button type="button" onClick={() => removeCredit(c.id)} className="text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="grid gap-2 sm:grid-cols-3">
              <select value={creditPersonId} onChange={(e) => setCreditPersonId(e.target.value)} className={adminInputClass}>
                <option value="">Select person</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select value={creditRole} onChange={(e) => setCreditRole(e.target.value)} className={adminInputClass}>
                {PERSON_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
              <input value={creditCharacter} onChange={(e) => setCreditCharacter(e.target.value)} placeholder="Character (optional)" className={adminInputClass} />
            </div>
            <button type="button" onClick={addCredit} className="mt-2 rounded-lg border border-[#333] px-4 py-2 text-sm hover:bg-[#222]">
              Add credit
            </button>
          </div>
        </div>

        <div className="flex gap-3 lg:col-span-2">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#ff7a18] px-6 py-3 font-bold disabled:opacity-50">
            {saving ? "Saving..." : "Save Film"}
          </button>
          <button type="button" onClick={deleteFilm} className="rounded-lg border border-red-900/50 px-6 py-3 text-red-400">
            Delete Film
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
