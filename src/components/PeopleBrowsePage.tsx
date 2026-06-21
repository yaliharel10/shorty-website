"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { PersonCard } from "@/components/PersonCard";
import { PERSON_ROLES } from "@/lib/person-utils";
import { cn } from "@/lib/utils";
import type { PersonSummary } from "@/types";

function PeopleBrowseContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [people, setPeople] = useState<(PersonSummary & { _count?: { credits: number } })[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/?signin=1");
    }
  }, [authLoading, user, router]);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    const res = await fetch(`/api/people?${params}`);
    const data = await res.json();
    setPeople(data.people || []);
    setLoading(false);
  }, [search, role]);

  useEffect(() => {
    if (user) fetchPeople();
  }, [fetchPeople, user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <Link href="/browse" className="text-sm text-[#888] hover:text-white">
              ← Back to Films
            </Link>
            <h1 className="mt-1 text-2xl font-bold">People</h1>
            <p className="text-sm text-[#666]">
              Search cast, directors, writers, and crew
            </p>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or bio..."
            className="flex-1 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm outline-none focus:border-[#ff7a18]"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setRole("")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition",
              !role
                ? "bg-[#ff7a18] font-bold text-white"
                : "border border-[#333] text-[#888] hover:text-white"
            )}
          >
            All
          </button>
          {PERSON_ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition",
                role === r.id
                  ? "bg-[#ff7a18] font-bold text-white"
                  : "border border-[#333] text-[#888] hover:text-white"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-[#1a1a1a]" />
                <div className="mx-auto mt-3 h-3 w-20 rounded bg-[#222]" />
              </div>
            ))}
          </div>
        ) : people.length === 0 ? (
          <p className="py-20 text-center text-[#888]">No people found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export function PeopleBrowsePage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#080808]">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
            </div>
          }
        >
          <PeopleBrowseContent />
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
