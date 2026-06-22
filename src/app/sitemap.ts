import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/browse/people`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/subscription`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [films, people] = await Promise.all([
      prisma.film.findMany({ select: { id: true, updatedAt: true } }),
      prisma.person.findMany({ select: { slug: true, updatedAt: true } }),
    ]);

    return [
      ...staticRoutes,
      ...films.map((film) => ({
        url: `${baseUrl}/films/${film.id}`,
        lastModified: film.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...people.map((person) => ({
        url: `${baseUrl}/people/${person.slug}`,
        lastModified: person.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
