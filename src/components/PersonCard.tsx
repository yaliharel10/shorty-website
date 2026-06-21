"use client";

import Link from "next/link";
import Image from "next/image";
import { roleLabel } from "@/lib/person-utils";
import type { PersonSummary } from "@/types";

type PersonCardProps = {
  person: PersonSummary & { _count?: { credits: number } };
  compact?: boolean;
};

export function PersonCard({ person, compact }: PersonCardProps) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="group flex shrink-0 flex-col items-center text-center transition"
    >
      <div
        className={`relative overflow-hidden rounded-full border-2 border-[#333] transition group-hover:border-[#ff7a18] group-hover:shadow-lg group-hover:shadow-[#ff7a18]/20 ${
          compact ? "h-16 w-16" : "h-20 w-20 md:h-24 md:w-24"
        }`}
      >
        <Image
          src={person.imgUrl}
          alt={person.name}
          fill
          className="object-cover transition group-hover:scale-110"
          sizes="96px"
        />
      </div>
      <h4 className={`mt-2 font-medium group-hover:text-[#ff7a18] ${compact ? "text-xs" : "text-sm"}`}>
        {person.name}
      </h4>
      <p className="mt-0.5 text-xs capitalize text-[#666]">
        {roleLabel(person.primaryRole)}
      </p>
      {!compact && (
        <p className="mt-1 max-w-[120px] text-xs text-[#555] line-clamp-2">
          {person.bio}
        </p>
      )}
    </Link>
  );
}

type CreditRowProps = {
  credits: {
    id: string;
    role: string;
    characterName?: string | null;
    person: PersonSummary;
  }[];
  title?: string;
};

export function CreditsRow({ credits, title = "Cast & Crew" }: CreditRowProps) {
  if (!credits.length) return null;

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <div className="flex gap-5 overflow-x-auto pb-2">
        {credits.map((credit) => (
          <div key={credit.id} className="shrink-0">
            <PersonCard person={credit.person} />
            {credit.characterName && (
              <p className="mt-1 max-w-[96px] text-center text-[10px] text-[#555]">
                as {credit.characterName}
              </p>
            )}
            {credit.role !== credit.person.primaryRole && (
              <p className="text-center text-[10px] capitalize text-[#444]">
                {roleLabel(credit.role)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
