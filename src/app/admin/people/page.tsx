"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell, adminInputClass } from "@/components/admin/AdminShell";
import { PERSON_ROLES } from "@/lib/person-utils";

type Person = {
  id: string;
  name: string;
  slug: string;
  imgUrl: string;
  primaryRole: string;
  _count: { credits: number };
};

export default function AdminPeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/admin/people${q}`)
      .then((r) => r.json())
      .then((d) => setPeople(d.people || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        bio: form.get("bio"),
        longBio: form.get("longBio"),
        imgUrl: form.get("imgUrl"),
        primaryRole: form.get("primaryRole"),
        birthplace: form.get("birthplace") || null,
        bornYear: form.get("bornYear") ? Number(form.get("bornYear")) : null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      load();
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this person and all their credits?")) return;
    await fetch(`/api/admin/people/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <AdminShell title="Manage People">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people..."
          className={`${adminInputClass} max-w-xs`}
        />
        <button type="button" onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold">
          <Plus className="h-4 w-4" /> Add Person
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 grid gap-4 rounded-xl border border-[#222] bg-[#111] p-6 md:grid-cols-2">
          <input name="name" required placeholder="Full name" className={adminInputClass} />
          <select name="primaryRole" required className={adminInputClass}>
            {PERSON_ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <input name="imgUrl" required placeholder="Photo URL" className={`${adminInputClass} md:col-span-2`} />
          <input name="birthplace" placeholder="Birthplace" className={adminInputClass} />
          <input name="bornYear" type="number" placeholder="Born year" className={adminInputClass} />
          <textarea name="bio" required placeholder="Short bio" rows={2} className={`${adminInputClass} md:col-span-2`} />
          <textarea name="longBio" required placeholder="Long bio" rows={4} className={`${adminInputClass} md:col-span-2`} />
          <button type="submit" className="rounded-lg bg-[#ff7a18] py-3 font-bold md:col-span-2">Create Person</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#111] p-4">
              <Image src={person.imgUrl} alt={person.name} width={48} height={48} className="rounded-full object-cover" />
              <div className="flex-1">
                <h3 className="font-bold">{person.name}</h3>
                <p className="text-sm capitalize text-[#888]">
                  {person.primaryRole} · {person._count.credits} credits
                </p>
              </div>
              <Link href={`/admin/people/${person.id}`} className="rounded-lg border border-[#333] px-3 py-2">
                <Pencil className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => handleDelete(person.id)} className="rounded-lg border border-red-900/50 px-3 py-2 text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
