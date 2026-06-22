export type PersonSummary = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  imgUrl: string;
  primaryRole: string;
};

export type FilmCredit = {
  id: string;
  role: string;
  characterName?: string | null;
  person: PersonSummary;
};

export type Person = PersonSummary & {
  longBio: string;
  birthplace?: string | null;
  bornYear?: number | null;
  credits?: {
    id: string;
    role: string;
    characterName?: string | null;
    film: {
      id: string;
      title: string;
      posterUrl: string;
      category: string;
      year: number;
      rating: number;
    };
  }[];
};

export type Film = {
  id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  posterUrl: string;
  videoUrl: string;
  featured: boolean;
  monthlyFreeMonth?: string | null;
  duration: number;
  year: number;
  credits?: FilmCredit[];
  _count?: {
    ratings: number;
    favorites: number;
    views: number;
  };
};

export type User = {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  role: string;
  photoUrl: string | null;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  trialEndsAt: string | null;
  hasStreamingAccess: boolean;
  accessLabel: string;
};

export type FilmsResponse = {
  films: Film[];
  featured: Film | null;
  topRated: Film[];
  newReleases: Film[];
  recommendedForYou: Film[];
  continueWatching: Film[];
  byCategory: { category: string; films: Film[] }[];
  favoriteIds: string[];
  watchedIds: string[];
  newFilmIds: string[];
  watchProgress: Record<string, number>;
  userRatings: Record<string, number>;
  hasStreamingAccess: boolean;
};

// Legacy alias
export type CastMember = PersonSummary & { id: string };
