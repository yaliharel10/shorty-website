"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell, adminInputClass } from "@/components/admin/AdminShell";

type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  _count: { films: number };
};

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((d) => setCollections(d.collections || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.get("slug"),
        title: form.get("title"),
        description: form.get("description"),
        heroUrl: form.get("heroUrl") || null,
        mood: form.get("mood") || null,
        country: form.get("country") || null,
        sortOrder: Number(form.get("sortOrder") || 0),
        featured: form.get("featured") === "on",
        published: form.get("published") !== "off",
      }),
    });
    if (res.ok) {
      setShowForm(false);
      load();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell title="Manage Collections">
      <div className="mb-6 flex justify-end">
        <button type="button" onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold">
          <Plus className="h-4 w-4" /> Add Collection
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 grid gap-4 rounded-xl border border-[#222] bg-[#111] p-6 md:grid-cols-2">
          <input name="slug" required placeholder="slug-url" className={adminInputClass} />
          <input name="title" required placeholder="Title" className={adminInputClass} />
          <input name="heroUrl" placeholder="Hero image URL" className={`${adminInputClass} md:col-span-2`} />
          <textarea name="description" required placeholder="Description" rows={3} className={`${adminInputClass} md:col-span-2`} />
          <input name="mood" placeholder="Mood tag" className={adminInputClass} />
          <input name="country" placeholder="Country" className={adminInputClass} />
          <input name="sortOrder" type="number" defaultValue={0} placeholder="Sort order" className={adminInputClass} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" /> Featured on homepage
          </label>
          <button type="submit" className="rounded-lg bg-[#ff7a18] py-3 font-bold md:col-span-2">Create Collection</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#222] bg-[#111] p-4">
              <div>
                <h3 className="font-bold">{c.title}</h3>
                <p className="text-sm text-[#888]">
                  /{c.slug} · {c._count.films} films
                  {c.featured && " · Featured"}
                  {!c.published && " · Draft"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/collections/${c.id}`} className="rounded-lg border border-[#333] px-3 py-2">
                  <Pencil className="h-4 w-4" />
                </Link>
                <button type="button" onClick={() => handleDelete(c.id)} className="rounded-lg border border-red-900/50 px-3 py-2 text-red-400">
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
