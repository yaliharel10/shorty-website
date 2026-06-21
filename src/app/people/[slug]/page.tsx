"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { PersonProfile } from "@/components/PersonProfile";
import { FilmModal } from "@/components/FilmModal";
import type { Person } from "@/types";

function PersonPageContent() {
  const params = useParams();
  const slug = params.slug as string;
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/people/${slug}`)
      .then((r) => r.json())
      .then((data) => setPerson(data.person))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] gap-4">
        <p className="text-[#888]">Person not found</p>
        <a href="/browse" className="text-[#ff7a18] hover:underline">
          Back to Browse
        </a>
      </div>
    );
  }

  return (
    <>
      <PersonProfile
        person={person}
        onFilmClick={(id) => setSelectedFilmId(id)}
      />
      <FilmModal
        filmId={selectedFilmId}
        onClose={() => setSelectedFilmId(null)}
        onFavoriteChange={() => {}}
      />
    </>
  );
}

export default function PersonPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PersonPageContent />
      </ToastProvider>
    </AuthProvider>
  );
}
