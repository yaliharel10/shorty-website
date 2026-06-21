"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Calendar, Film } from "lucide-react";
import { roleLabel } from "@/lib/person-utils";
import { formatRating } from "@/lib/utils";
import type { Person } from "@/types";

type PersonProfileProps = {
  person: Person;
  onFilmClick?: (filmId: string) => void;
};

export function PersonProfile({ person, onFilmClick }: PersonProfileProps) {
  const creditsByRole = person.credits?.reduce(
    (acc, credit) => {
      if (!acc[credit.role]) acc[credit.role] = [];
      acc[credit.role].push(credit);
      return acc;
    },
    {} as Record<string, NonNullable<Person["credits"]>>
  );

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#222] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link
            href="/browse"
            className="flex items-center gap-2 text-sm text-[#888] transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Browse
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="shrink-0">
            <Image
              src={person.imgUrl}
              alt={person.name}
              width={200}
              height={200}
              className="rounded-2xl border-2 border-[#333] object-cover shadow-xl"
            />
          </div>
          <div className="flex-1">
            <span className="mb-2 inline-block rounded-full bg-[#ff7a18]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#ff7a18]">
              {roleLabel(person.primaryRole)}
            </span>
            <h1 className="text-3xl font-extrabold md:text-4xl">{person.name}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#888]">
              {person.bornYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Born {person.bornYear}
                </span>
              )}
              {person.birthplace && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {person.birthplace}
                </span>
              )}
              {person.credits && (
                <span className="flex items-center gap-1">
                  <Film className="h-4 w-4" />
                  {person.credits.length} Shorty credits
                </span>
              )}
            </div>
            <p className="mt-6 leading-relaxed text-[#bbb]">{person.longBio}</p>
          </div>
        </div>

        {person.credits && person.credits.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 text-2xl font-bold">Filmography</h2>
            {creditsByRole &&
              Object.entries(creditsByRole).map(([role, credits]) => (
                <div key={role} className="mb-8">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#666]">
                    {roleLabel(role)}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {credits.map((credit) => (
                      <button
                        key={credit.id}
                        onClick={() => onFilmClick?.(credit.film.id)}
                        className="group overflow-hidden rounded-xl border border-[#222] bg-[#111] text-left transition hover:border-[#ff7a18]/40 hover:shadow-lg"
                      >
                        <div className="relative aspect-[2/3]">
                          <Image
                            src={credit.film.posterUrl}
                            alt={credit.film.title}
                            fill
                            className="object-cover transition group-hover:scale-105"
                            sizes="200px"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="truncate text-sm font-semibold">
                            {credit.film.title}
                          </h4>
                          <p className="mt-1 text-xs text-[#888]">
                            {credit.characterName
                              ? `as ${credit.characterName} · `
                              : ""}
                            {credit.film.year} · ⭐ {formatRating(credit.film.rating)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </section>
        )}
      </main>
    </div>
  );
}
