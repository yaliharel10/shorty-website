import { prisma } from "@/lib/db";
import { isFilmMonthlyFree } from "@/lib/monthly-free";
import { genreLabel } from "@/lib/film-metadata";

export const publicFilmSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  rating: true,
  posterUrl: true,
  duration: true,
  year: true,
  featured: true,
  updatedAt: true,
  credits: {
    include: {
      person: {
        select: {
          name: true,
          slug: true,
          primaryRole: true,
        },
      },
    },
  },
} as const;

export async function getPublicFilm(id: string) {
  const film = await prisma.film.findFirst({
    where: { id, published: true },
    select: publicFilmSelect,
  });

  if (!film) return null;

  const monthlyFree = await isFilmMonthlyFree(id);

  return {
    ...film,
    categoryLabel: genreLabel(film.category),
    monthlyFree,
    cast: film.credits
      .filter((c) => c.person.primaryRole === "actor")
      .slice(0, 4)
      .map((c) => c.person.name),
  };
}

export type PublicFilm = NonNullable<Awaited<ReturnType<typeof getPublicFilm>>>;
