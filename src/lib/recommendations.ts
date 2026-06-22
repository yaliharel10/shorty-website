import type { Film } from "@/types";

export type FilmWithPeople = Omit<Film, "credits"> & {
  credits?: { personId: string }[];
};

export function getSimilarFilms(
  film: FilmWithPeople,
  allFilms: FilmWithPeople[],
  limit = 8
): Omit<Film, "credits">[] {
  const personIds = new Set(film.credits?.map((c) => c.personId) ?? []);

  return allFilms
    .filter((f) => f.id !== film.id)
    .map((f) => {
      let score = 0;
      if (f.category === film.category) score += 3;
      for (const credit of f.credits ?? []) {
        if (personIds.has(credit.personId)) score += 2;
      }
      score += f.rating / 10;
      return { film: f, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ film: f }) => {
      const { credits: _credits, ...rest } = f;
      return rest;
    });
}

export function getRecommendedForUser(
  allFilms: FilmWithPeople[],
  watchedIds: string[],
  favoriteIds: string[],
  userRatings: Record<string, number>,
  limit = 10
): Omit<Film, "credits">[] {
  const watched = new Set(watchedIds);
  const tasteIds = new Set([
    ...favoriteIds,
    ...Object.entries(userRatings)
      .filter(([, score]) => score >= 7)
      .map(([id]) => id),
  ]);

  const categoryWeight = new Map<string, number>();
  for (const id of tasteIds) {
    const film = allFilms.find((f) => f.id === id);
    if (film) {
      categoryWeight.set(film.category, (categoryWeight.get(film.category) ?? 0) + 1);
    }
  }

  return allFilms
    .filter((f) => !watched.has(f.id))
    .map((f) => ({
      film: f,
      score: (categoryWeight.get(f.category) ?? 0) * 3 + f.rating,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ film: f }) => {
      const { credits: _credits, ...rest } = f;
      return rest;
    });
}

export function isNewFilm(createdAt: Date | string, days = 14) {
  const created = new Date(createdAt).getTime();
  return Date.now() - created <= days * 24 * 60 * 60 * 1000;
}
