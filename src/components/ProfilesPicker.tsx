"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, User } from "lucide-react";
import { avatarUrl, cn } from "@/lib/utils";
import { Modal } from "./Modal";
import { FormField, inputClassName } from "./FormField";

type Profile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isKids: boolean;
  isDefault: boolean;
};

const STORAGE_KEY = "shorty_active_profile";

export function ProfilesPicker({ onSelect }: { onSelect?: (profileId: string) => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/profiles")
      .then((r) => r.json())
      .then((data) => {
        const list = data.profiles ?? [];
        setProfiles(list);
        const stored = localStorage.getItem(STORAGE_KEY);
        const match = list.find((p: Profile) => p.id === stored);
        const id = match?.id ?? list.find((p: Profile) => p.isDefault)?.id ?? list[0]?.id;
        if (id) {
          setActiveId(id);
          localStorage.setItem(STORAGE_KEY, id);
        }
      })
      .catch(() => setProfiles([]));
  };

  useEffect(() => {
    load();
  }, []);

  const select = (id: string) => {
    setActiveId(id);
    localStorage.setItem(STORAGE_KEY, id);
    onSelect?.(id);
  };

  const createProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string).trim();
    const isKids = form.get("isKids") === "on";

    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isKids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create profile");
      setCreateOpen(false);
      load();
      if (data.profile?.id) select(data.profile.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (profiles.length <= 1) return null;

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => select(p.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
              activeId === p.id
                ? "border-[#ff7a18] bg-[#ff7a18]/10 text-white"
                : "border-[#333] text-[#888] hover:border-[#444] hover:text-white"
            )}
          >
            <Image
              src={avatarUrl(p.name, p.avatarUrl)}
              alt=""
              width={20}
              height={20}
              className="rounded-full"
            />
            {p.name}
            {p.isKids && <span className="text-[10px] text-[#ff7a18]">Kids</span>}
          </button>
        ))}
        {profiles.length < 5 && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-[#444] px-3 py-1.5 text-xs text-[#888] hover:border-[#ff7a18] hover:text-[#ff7a18]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add profile" size="sm">
        <form onSubmit={createProfile} className="flex flex-col gap-4">
          <FormField id="profile-name" label="Profile name">
            <input id="profile-name" name="name" required maxLength={30} className={inputClassName} />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-[#aaa]">
            <input type="checkbox" name="isKids" className="rounded" />
            Kids profile
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#ff7a18] py-3 text-sm font-bold disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create profile"}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function ProfileAvatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#222]">
      {url ? (
        <Image src={url} alt={name} width={40} height={40} className="rounded-full object-cover" />
      ) : (
        <User className="h-5 w-5 text-[#666]" />
      )}
    </div>
  );
}
