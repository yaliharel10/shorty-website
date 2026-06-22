import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Play, Star } from "lucide-react";
import { getPublicFilm } from "@/lib/film-public";
import { getSiteUrl } from "@/lib/site-url";
import { formatRating } from "@/lib/utils";
import { FilmPublicActions } from "@/components/FilmPublicActions";
import { SiteFooter } from "@/components/SiteFooter";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const film = await getPublicFilm(id);
  if (!film) return { title: "Film not found" };

  const title = `${film.title} (${film.year})`;
  const description = film.description.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.movie",
      images: [{ url: film.posterUrl, width: 400, height: 600, alt: film.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [film.posterUrl],
    },
  };
}

export default async function FilmPublicPage({ params }: Props) {
  const { id } = await params;
  const film = await getPublicFilm(id);
  if (!film) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: film.title,
    description: film.description,
    image: film.posterUrl,
    datePublished: String(film.year),
    duration: `PT${film.duration}M`,
    genre: film.categoryLabel,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: film.rating,
      bestRating: 10,
      ratingCount: 1,
    },
    url: `${getSiteUrl()}/films/${film.id}`,
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/subscription" className="hidden text-sm text-[#888] hover:text-white sm:block">
              Plans
            </Link>
            <Link
              href="/?signin=1"
              className="rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold hover:bg-[#ff9533]"
            >
              Sign in to watch
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-2xl border border-[#222] shadow-2xl lg:mx-0">
            <Image
              src={film.posterUrl}
              alt={film.title}
              fill
              priority
              className="object-cover"
              sizes="280px"
            />
            {film.monthlyFree && (
              <span className="absolute left-3 top-3 rounded-full bg-[#ff7a18] px-3 py-1 text-xs font-bold">
                FREE THIS MONTH
              </span>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#ff7a18]">
              {film.categoryLabel}
            </p>
            <h1 className="text-3xl font-extrabold md:text-4xl">{film.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#aaa]">
              <span className="inline-flex items-center gap-1 font-bold text-yellow-400">
                <Star className="h-4 w-4 fill-yellow-400" />
                {formatRating(film.rating)}
              </span>
              <span>{film.year}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {film.duration} min
              </span>
            </div>

            <p className="mt-6 max-w-2xl leading-relaxed text-[#bbb]">{film.description}</p>

            {film.cast.length > 0 && (
              <p className="mt-4 text-sm text-[#888]">
                <span className="font-medium text-[#ccc]">Starring:</span>{" "}
                {film.cast.join(", ")}
              </p>
            )}

            <FilmPublicActions
              filmId={film.id}
              title={film.title}
              monthlyFree={film.monthlyFree}
            />

            {film.monthlyFree ? (
              <p className="mt-4 text-sm text-[#666]">
                This title is free to watch on the landing page — no account needed.
              </p>
            ) : (
              <p className="mt-4 text-sm text-[#666]">
                Sign in with a free trial or subscription to stream the full library.
              </p>
            )}
          </div>
        </div>

        <section className="mt-14 rounded-2xl border border-[#222] bg-[#111] p-8 text-center">
          <Play className="mx-auto mb-4 h-10 w-10 text-[#ff7a18]" />
          <h2 className="text-xl font-bold">Ready to watch {film.title}?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#888]">
            Join Shorty for curated short films under 25 minutes. Start with a 7-day free trial.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/?signin=1"
              className="rounded-lg bg-[#ff7a18] px-6 py-3 text-sm font-bold hover:bg-[#ff9533]"
            >
              Start free trial
            </Link>
            <Link
              href="/browse"
              className="rounded-lg border border-[#444] px-6 py-3 text-sm font-bold hover:bg-white/5"
            >
              Browse catalog
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
