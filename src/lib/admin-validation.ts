import { z } from "zod";

export const adminFilmSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  posterUrl: z.string().url(),
  videoUrl: z.string().url(),
  duration: z.number().int().positive().optional(),
  year: z.number().int().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  genres: z.array(z.string()).optional(),
  moods: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  country: z.string().optional().nullable(),
  monthlyFreeMonth: z.string().optional().nullable(),
  rating: z.number().min(0).max(10).optional(),
});

export const adminPersonSchema = z.object({
  name: z.string().min(1).max(120),
  bio: z.string().min(1),
  longBio: z.string().min(1),
  imgUrl: z.string().url(),
  primaryRole: z.string().min(1),
  birthplace: z.string().optional().nullable(),
  bornYear: z.number().int().optional().nullable(),
});

export const adminCollectionSchema = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1),
  description: z.string().min(1),
  heroUrl: z.string().url().optional().nullable(),
  featured: z.boolean().optional(),
  country: z.string().optional().nullable(),
  mood: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const adminCreditSchema = z.object({
  personId: z.string().min(1),
  role: z.string().min(1),
  characterName: z.string().optional().nullable(),
});

export const adminNotificationSchema = z.object({
  userId: z.string().optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  href: z.string().optional().nullable(),
});

export const adminUserProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  displayName: z.string().max(50).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
});

export function jsonArrayField(values?: string[]) {
  return JSON.stringify(values ?? []);
}
