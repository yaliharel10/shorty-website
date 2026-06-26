"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AdminShell, adminInputClass, adminLabelClass } from "@/components/admin/AdminShell";

type CollectionFilm = {
  filmId: string;
  sortOrder: number;
  film: { id: string; title: string; year: number; category: string };
};

export default function AdminCollectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [collection, setCollection] = useState<Record<string, unknown> | null>(null);
  const [allFilms, setAllFilms] = useState<{ id: string; title: string }[]>([]);
  const [addFilmId, setAddFilmId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/admin/collections/${id}`)
      .then((r) => r.json())
      .then((d) => setCollection(d.collection));
    fetch("/api/admin/films")
      .then((r) => r.json())
      .then((d) => setAllFilms((d.films || []).map((f: { id: string; title: string }) => ({ id: f.id, title: f.title }))));
  };

  useEffect(() => {
    load();
  }, [id]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await fetch(`/api/admin/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.get("slug"),
        title: form.get("title"),
        description: form.get("description"),
        heroUrl: form.get("heroUrl") || null,
        mood: form.get("mood") || null,
        country: form.get("country") || null,
        sortOrder: Number(form.get("sortOrder")),
        featured: form.get("featured") === "on",
        published: form.get("published") === "on",
      }),
    });
    setSaving(false);
    load();
  };

  const addFilm = async () => {
    if (!addFilmId) return;
    await fetch(`/api/admin/collections/${id}/films`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filmId: addFilmId }),
    });
    setAddFilmId("");
    load();
  };

  const removeFilm = async (filmId: string) => {
    await fetch(`/api/admin/collections/${id}/films`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filmId }),
    });
    load();
  };

  const remove = async () => {
    if (!confirm("Delete collection?")) return;
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    router.push("/admin/collections");
  };

  if (!collection) {
    return (
      <AdminShell title="Edit Collection">
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      </AdminShell>
    );
  }

  const films = (collection.films as CollectionFilm[]) ?? [];

  return (
    <AdminShell title={`Edit: ${collection.title as string}`}>
      <Link href="/admin/collections" className="mb-6 inline-block text-sm text-[#888] hover:text-white">
        ← Back to collections
      </Link>

      <form onSubmit={save} className="mb-8 max-w-2xl space-y-4 rounded-xl border border-[#222] bg-[#111] p-6">
        {[
          ["slug", "Slug"],
          ["title", "Title"],
          ["heroUrl", "Hero URL"],
          ["mood", "Mood"],
          ["country", "Country"],
          ["sortOrder", "Sort order"],
        ].map(([name, label]) => (
          <div key={name}>
            <label className={adminLabelClass}>{label}</label>
            <input name={name} defaultValue={String(collection[name] ?? "")} className={adminInputClass} />
          </div>
        ))}
        <div>
          <label className={adminLabelClass}>Description</label>
          <textarea name="description" defaultValue={String(collection.description)} rows={3} className={adminInputClass} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={Boolean(collection.featured)} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={Boolean(collection.published)} /> Published
        </label>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#ff7a18] px-6 py-3 font-bold">
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={remove} className="rounded-lg border border-red-900/50 px-6 py-3 text-red-400">
            Delete
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-3 font-bold">Films in collection</h2>
        <ul className="mb-4 space-y-2">
          {films.map((row) => (
            <li key={row.filmId} className="flex items-center justify-between rounded-lg bg-[#111] px-4 py-3 text-sm">
              <span>{row.film.title} ({row.film.year})</span>
              <button type="button" onClick={() => removeFilm(row.filmId)} className="text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <select value={addFilmId} onChange={(e) => setAddFilmId(e.target.value)} className={adminInputClass}>
            <option value="">Add film...</option>
            {allFilms.filter((f) => !films.some((row) => row.filmId === f.id)).map((f) => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
          <button type="button" onClick={addFilm} className="rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold">
            Add
          </button>
        </div>
      </section>
    </AdminShell>
  );
}
