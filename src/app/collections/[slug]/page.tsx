import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollectionBySlug, serializeCollection } from "@/lib/collections";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection not found" };
  return {
    title: collection.title,
    description: collection.description,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const data = serializeCollection(collection);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <Link href="/browse" className="text-sm text-[#888] hover:text-white">
            Browse all films
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#ff7a18]">
          Curated collection
        </p>
        <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{data.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[#aaa]">{data.description}</p>
        <p className="mt-2 text-sm text-[#666]">{data.films.length} short films</p>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.films.map((film) => (
            <Link
              key={film.id}
              href={`/films/${film.id}`}
              className="group overflow-hidden rounded-xl bg-[#141414] transition hover:ring-1 hover:ring-[#ff7a18]/40"
            >
              <div className="relative aspect-[2/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={film.posterUrl}
                  alt={film.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute right-2 top-2 rounded-md bg-[#ff7a18] px-2 py-0.5 text-xs font-bold text-black">
                  {film.runtimeCompact ?? `${film.duration}m`}
                </span>
              </div>
              <div className="p-3">
                <h2 className="truncate text-sm font-semibold">{film.title}</h2>
                <p className="mt-1 text-xs capitalize text-[#888]">{film.category}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
