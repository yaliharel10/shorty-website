import { getDurationTier } from "@/lib/film-metadata";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilmCreditRef = {
  personId: string;
  role?: string;
};

export type RecommendableFilm = {
  id: string;
  category: string;
  rating: number;
  duration: number;
  year: number;
  createdAt: Date | string;
  language?: string | null;
  country?: string | null;
  genres?: string[];
  moods?: string[];
  tags?: string[];
  credits?: FilmCreditRef[];
};

export type UserRatingRow = {
  userId: string;
  filmId: string;
  score: number;
};

export type UserSignals = {
  favoriteIds: string[];
  ratings: Record<string, number>;
  watchProgress: Record<string, number>;
  watchedIds: string[];
};

export type RecommendationOptions = {
  limit?: number;
  /** 0 = max diversity, 1 = max relevance */
  diversityLambda?: number;
  globalRatings?: UserRatingRow[];
};

/** @deprecated Use RecommendableFilm */
export type FilmWithPeople = RecommendableFilm;

// ─── Sparse vector math ───────────────────────────────────────────────────────

type SparseVector = Map<string, number>;

function addTo(vec: SparseVector, key: string, weight: number) {
  if (weight === 0) return;
  vec.set(key, (vec.get(key) ?? 0) + weight);
}

function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  if (a.size === 0 || b.size === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of a) {
    normA += valA * valA;
    const valB = b.get(key);
    if (valB !== undefined) dot += valA * valB;
  }

  for (const valB of b.values()) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Feature extraction ─────────────────────────────────────────────────────

const WEIGHTS = {
  genre: 2.0,
  mood: 2.5,
  tag: 1.0,
  category: 2.0,
  director: 3.0,
  cast: 1.5,
  crew: 1.0,
  durationTier: 1.5,
  language: 1.0,
  country: 0.8,
  quality: 0.4,
  recency: 0.15,
} as const;

function filmFeatureVector(film: RecommendableFilm): SparseVector {
  const vec: SparseVector = new Map();

  for (const genre of film.genres?.length ? film.genres : [film.category]) {
    addTo(vec, `genre:${genre}`, WEIGHTS.genre);
  }

  for (const mood of film.moods ?? []) {
    addTo(vec, `mood:${mood}`, WEIGHTS.mood);
  }

  for (const tag of film.tags ?? []) {
    addTo(vec, `tag:${tag}`, WEIGHTS.tag);
  }

  addTo(vec, `category:${film.category}`, WEIGHTS.category);

  for (const credit of film.credits ?? []) {
    const role = credit.role?.toLowerCase() ?? "";
    if (role === "director") {
      addTo(vec, `director:${credit.personId}`, WEIGHTS.director);
    } else if (role === "actor") {
      addTo(vec, `actor:${credit.personId}`, WEIGHTS.cast);
    } else {
      addTo(vec, `crew:${credit.personId}`, WEIGHTS.crew);
    }
  }

  addTo(vec, `duration:${getDurationTier(film.duration)}`, WEIGHTS.durationTier);

  if (film.language) addTo(vec, `lang:${film.language}`, WEIGHTS.language);
  if (film.country) addTo(vec, `country:${film.country}`, WEIGHTS.country);

  // Global quality prior (normalized 0–1)
  addTo(vec, "quality", (film.rating / 10) * WEIGHTS.quality);

  return vec;
}

function ratingToWeight(score: number): number {
  if (score >= 9) return 4;
  if (score >= 8) return 3;
  if (score >= 7) return 2;
  if (score >= 5) return 0.5;
  if (score >= 1) return -2;
  return 0;
}

function buildUserTasteProfile(
  films: Map<string, RecommendableFilm>,
  signals: UserSignals
): SparseVector {
  const profile: SparseVector = new Map();

  const contribute = (filmId: string, multiplier: number) => {
    const film = films.get(filmId);
    if (!film || multiplier === 0) return;
    const features = filmFeatureVector(film);
    for (const [key, val] of features) {
      addTo(profile, key, val * multiplier);
    }
  };

  for (const filmId of signals.favoriteIds) {
    contribute(filmId, 5);
  }

  for (const [filmId, score] of Object.entries(signals.ratings)) {
    contribute(filmId, ratingToWeight(score));
  }

  for (const [filmId, progress] of Object.entries(signals.watchProgress)) {
    if (progress >= 90) contribute(filmId, 1.5);
    else if (progress >= 50) contribute(filmId, 0.75);
    else if (progress > 0 && progress < 15) contribute(filmId, -1);
  }

  return profile;
}

function hasPositiveTaste(signals: UserSignals): boolean {
  if (signals.favoriteIds.length > 0) return true;
  if (Object.values(signals.ratings).some((s) => s >= 7)) return true;
  if (Object.values(signals.watchProgress).some((p) => p >= 90)) return true;
  return false;
}

// ─── Item–item collaborative filtering (Pearson on co-rated users) ───────────

type RatingMatrix = Map<string, Map<string, number>>;

function buildRatingMatrix(rows: UserRatingRow[]): RatingMatrix {
  const matrix: RatingMatrix = new Map();

  for (const { userId, filmId, score } of rows) {
    if (!matrix.has(filmId)) matrix.set(filmId, new Map());
    matrix.get(filmId)!.set(userId, score);
  }

  return matrix;
}

function pearsonItemSimilarity(
  filmA: string,
  filmB: string,
  matrix: RatingMatrix
): number {
  const ratingsA = matrix.get(filmA);
  const ratingsB = matrix.get(filmB);
  if (!ratingsA || !ratingsB) return 0;

  const sharedUsers: string[] = [];
  for (const userId of ratingsA.keys()) {
    if (ratingsB.has(userId)) sharedUsers.push(userId);
  }

  if (sharedUsers.length < 2) return 0;

  let sumA = 0;
  let sumB = 0;
  for (const userId of sharedUsers) {
    sumA += ratingsA.get(userId)!;
    sumB += ratingsB.get(userId)!;
  }
  const meanA = sumA / sharedUsers.length;
  const meanB = sumB / sharedUsers.length;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (const userId of sharedUsers) {
    const diffA = ratingsA.get(userId)! - meanA;
    const diffB = ratingsB.get(userId)! - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denom = Math.sqrt(denomA) * Math.sqrt(denomB);
  if (denom === 0) return 0;
  return numerator / denom;
}

function collaborativeScore(
  candidateId: string,
  likedFilmIds: string[],
  matrix: RatingMatrix
): number {
  if (likedFilmIds.length === 0 || matrix.size === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;

  for (const likedId of likedFilmIds) {
    if (likedId === candidateId) continue;
    const sim = pearsonItemSimilarity(likedId, candidateId, matrix);
    if (sim > 0) {
      weightedSum += sim;
      weightTotal += Math.abs(sim);
    }
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

function likedFilmIdsFromSignals(signals: UserSignals): string[] {
  const ids = new Set<string>(signals.favoriteIds);

  for (const [filmId, score] of Object.entries(signals.ratings)) {
    if (score >= 7) ids.add(filmId);
  }

  for (const [filmId, progress] of Object.entries(signals.watchProgress)) {
    if (progress >= 90) ids.add(filmId);
  }

  return [...ids];
}

// ─── Cold start (no taste data) ──────────────────────────────────────────────

function coldStartRecommendations<T extends RecommendableFilm>(
  films: T[],
  excludeIds: Set<string>,
  limit: number
): T[] {
  const candidates = films.filter((f) => !excludeIds.has(f.id));
  const byCategory = new Map<string, T[]>();

  for (const film of candidates) {
    const list = byCategory.get(film.category) ?? [];
    list.push(film);
    byCategory.set(film.category, list);
  }

  for (const list of byCategory.values()) {
    list.sort((a, b) => b.rating - a.rating || b.year - a.year);
  }

  const picked: T[] = [];
  const seen = new Set<string>();
  const categories = [...byCategory.keys()].sort(
    (a, b) => (byCategory.get(b)?.[0]?.rating ?? 0) - (byCategory.get(a)?.[0]?.rating ?? 0)
  );

  while (picked.length < limit && categories.length > 0) {
    for (const cat of categories) {
      const list = byCategory.get(cat) ?? [];
      while (list.length > 0 && seen.has(list[0].id)) list.shift();
      if (list.length === 0) continue;
      const film = list.shift()!;
      picked.push(film);
      seen.add(film.id);
      if (picked.length >= limit) break;
    }
    if (picked.length < limit) {
      const remainder = candidates
        .filter((f) => !seen.has(f.id))
        .sort((a, b) => b.rating - a.rating);
      for (const film of remainder) {
        picked.push(film);
        seen.add(film.id);
        if (picked.length >= limit) break;
      }
      break;
    }
  }

  return picked;
}

// ─── MMR re-ranking (diversity) ──────────────────────────────────────────────

function maximalMarginalRelevance<T extends RecommendableFilm>(
  scored: Array<{ film: T; score: number }>,
  limit: number,
  lambda: number
): T[] {
  if (scored.length === 0) return [];

  const featureCache = new Map<string, SparseVector>();
  const getFeatures = (film: T) => {
    if (!featureCache.has(film.id)) {
      featureCache.set(film.id, filmFeatureVector(film));
    }
    return featureCache.get(film.id)!;
  };

  const remaining = [...scored].sort((a, b) => b.score - a.score);
  const selected: T[] = [];

  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestMmr = -Infinity;

    for (let i = 0; i < remaining.length; i += 1) {
      const { film, score } = remaining[i];
      let maxSim = 0;

      if (selected.length > 0) {
        const candidateVec = getFeatures(film);
        for (const picked of selected) {
          const sim = cosineSimilarity(candidateVec, getFeatures(picked));
          if (sim > maxSim) maxSim = sim;
        }
      }

      const mmr = lambda * score - (1 - lambda) * maxSim;
      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    selected.push(remaining[bestIdx].film);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function scoreFilmForUser(
  film: RecommendableFilm,
  tasteProfile: SparseVector,
  likedIds: string[],
  matrix: RatingMatrix
): number {
  const content = cosineSimilarity(tasteProfile, filmFeatureVector(film));
  const collaborative = collaborativeScore(film.id, likedIds, matrix);
  const quality = film.rating / 10;

  const created = new Date(film.createdAt).getTime();
  const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 1 - ageDays / 365) * WEIGHTS.recency;

  // Weighted hybrid: content-heavy when little collaborative data exists
  const collabWeight = matrix.size > 0 && likedIds.length > 0 ? 0.35 : 0;
  const contentWeight = 0.55 - collabWeight * 0.15;
  const qualityWeight = 0.1;

  return (
    content * contentWeight +
    collaborative * collabWeight +
    quality * qualityWeight +
    recency
  );
}

export function getRecommendedForUser<T extends RecommendableFilm>(
  allFilms: T[],
  signals: UserSignals,
  options: RecommendationOptions = {}
): Omit<T, "credits">[] {
  const limit = options.limit ?? 10;
  const lambda = options.diversityLambda ?? 0.72;
  const matrix = buildRatingMatrix(options.globalRatings ?? []);

  const filmMap = new Map(allFilms.map((f) => [f.id, f]));
  const exclude = new Set([
    ...signals.watchedIds.filter((id) => {
      const progress = signals.watchProgress[id] ?? 0;
      return progress >= 95;
    }),
  ]);

  if (!hasPositiveTaste(signals)) {
    return coldStartRecommendations(allFilms, exclude, limit).map((f) => {
      const { credits: _credits, ...rest } = f;
      return rest;
    });
  }

  const tasteProfile = buildUserTasteProfile(filmMap, signals);
  const likedIds = likedFilmIdsFromSignals(signals);

  const scored = allFilms
    .filter((f) => !exclude.has(f.id))
    .map((film) => ({
      film,
      score: scoreFilmForUser(film, tasteProfile, likedIds, matrix),
    }))
    .filter(({ score }) => score > 0);

  const picked = maximalMarginalRelevance(scored, limit, lambda);

  return picked.map((f) => {
    const { credits: _credits, ...rest } = f;
    return rest;
  });
}

export function getSimilarFilms<T extends RecommendableFilm>(
  source: T,
  allFilms: T[],
  limit = 8,
  globalRatings: UserRatingRow[] = []
): Omit<T, "credits">[] {
  const matrix = buildRatingMatrix(globalRatings);
  const sourceVec = filmFeatureVector(source);

  const scored = allFilms
    .filter((f) => f.id !== source.id)
    .map((film) => {
      const content = cosineSimilarity(sourceVec, filmFeatureVector(film));
      const collaborative = pearsonItemSimilarity(source.id, film.id, matrix);
      const quality = (film.rating / 10) * 0.1;

      const score = content * 0.7 + Math.max(0, collaborative) * 0.2 + quality;
      return { film, score };
    })
    .filter(({ score }) => score > 0.05);

  return maximalMarginalRelevance(scored, limit, 0.75).map((f) => {
    const { credits: _credits, ...rest } = f;
    return rest;
  });
}

/** Explain why a film was recommended (for debugging / future UI). */
export function explainRecommendation(
  film: RecommendableFilm,
  signals: UserSignals,
  allFilms: RecommendableFilm[],
  globalRatings: UserRatingRow[] = []
): { score: number; topFactors: string[] } {
  const filmMap = new Map(allFilms.map((f) => [f.id, f]));
  const taste = buildUserTasteProfile(filmMap, signals);
  const matrix = buildRatingMatrix(globalRatings);
  const likedIds = likedFilmIdsFromSignals(signals);
  const score = scoreFilmForUser(film, taste, likedIds, matrix);

  const filmVec = filmFeatureVector(film);
  const factors: Array<{ label: string; strength: number }> = [];

  for (const [key, val] of filmVec) {
    const tasteVal = taste.get(key) ?? 0;
    if (tasteVal > 0 && val > 0) {
      factors.push({ label: key, strength: tasteVal * val });
    }
  }

  factors.sort((a, b) => b.strength - a.strength);

  return {
    score,
    topFactors: factors.slice(0, 5).map((f) => f.label),
  };
}

export function isNewFilm(createdAt: Date | string, days = 14) {
  const created = new Date(createdAt).getTime();
  return Date.now() - created <= days * 24 * 60 * 60 * 1000;
}
