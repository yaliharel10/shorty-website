"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell, adminInputClass, adminLabelClass } from "@/components/admin/AdminShell";
import { PERSON_ROLES } from "@/lib/person-utils";

export default function AdminPersonEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/people/${id}`)
      .then((r) => r.json())
      .then((d) => setPerson(d.person));
  }, [id]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    await fetch(`/api/admin/people/${id}`, {
      method: "PATCH",
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
    setSaving(false);
  };

  const remove = async () => {
    if (!confirm("Delete this person?")) return;
    await fetch(`/api/admin/people/${id}`, { method: "DELETE" });
    router.push("/admin/people");
  };

  if (!person) {
    return (
      <AdminShell title="Edit Person">
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      </AdminShell>
    );
  }

  const credits = (person.credits as { film: { title: string; year: number }; role: string }[]) ?? [];

  return (
    <AdminShell title={`Edit: ${person.name as string}`}>
      <Link href="/admin/people" className="mb-6 inline-block text-sm text-[#888] hover:text-white">
        ← Back to people
      </Link>

      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-xl border border-[#222] bg-[#111] p-6">
        {[
          ["name", "Name"],
          ["imgUrl", "Photo URL"],
          ["birthplace", "Birthplace"],
          ["bornYear", "Born year"],
        ].map(([name, label]) => (
          <div key={name}>
            <label className={adminLabelClass}>{label}</label>
            <input name={name} defaultValue={String(person[name] ?? "")} className={adminInputClass} />
          </div>
        ))}
        <div>
          <label className={adminLabelClass}>Primary role</label>
          <select name="primaryRole" defaultValue={String(person.primaryRole)} className={adminInputClass}>
            {PERSON_ROLES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={adminLabelClass}>Short bio</label>
          <textarea name="bio" defaultValue={String(person.bio)} rows={2} className={adminInputClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Long bio</label>
          <textarea name="longBio" defaultValue={String(person.longBio)} rows={5} className={adminInputClass} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#ff7a18] px-6 py-3 font-bold">
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={remove} className="rounded-lg border border-red-900/50 px-6 py-3 text-red-400">
            Delete
          </button>
        </div>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 font-bold">Filmography ({credits.length})</h2>
        <ul className="space-y-2">
          {credits.map((c, i) => (
            <li key={i} className="rounded-lg bg-[#111] px-4 py-3 text-sm">
              {c.film.title} ({c.film.year}) · {c.role}
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
