type FilmWithVideo = {
  id: string;
  videoUrl: string;
};

export type FilmAccessOptions = {
  hasStreamingAccess: boolean;
  monthlyFreeFilmId?: string | null;
};

export function sanitizeFilmForClient<T extends FilmWithVideo>(
  film: T,
  options: FilmAccessOptions
): Omit<T, "videoUrl"> | T {
  if (options.hasStreamingAccess || film.id === options.monthlyFreeFilmId) {
    return film;
  }
  const { videoUrl: _removed, ...rest } = film;
  return rest;
}

export function sanitizeFilmsForClient<T extends FilmWithVideo>(
  films: T[],
  options: FilmAccessOptions
) {
  return films.map((film) => sanitizeFilmForClient(film, options));
}
