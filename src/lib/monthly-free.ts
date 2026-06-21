import { prisma } from "@/lib/db";

export function getCurrentMonthKey() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}`;
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const filmInclude = {
  credits: {
    include: {
      person: {
        select: {
          id: true,
          slug: true,
          name: true,
          bio: true,
          imgUrl: true,
          primaryRole: true,
        },
      },
    },
  },
  _count: { select: { ratings: true, favorites: true, views: true } },
} as const;

export async function getMonthlyFreeFilm() {
  const monthKey = getCurrentMonthKey();

  let film = await prisma.film.findFirst({
    where: { monthlyFreeMonth: monthKey },
    include: filmInclude,
  });

  if (!film) {
    const allFilms = await prisma.film.findMany({
      orderBy: { createdAt: "asc" },
      include: filmInclude,
    });

    if (allFilms.length === 0) return null;

    const [year, month] = monthKey.split("-").map(Number);
    const index = (year * 12 + month) % allFilms.length;
    film = allFilms[index];
  }

  return { film, monthKey, monthLabel: formatMonthLabel(monthKey) };
}

export async function isFilmMonthlyFree(filmId: string) {
  const current = await getMonthlyFreeFilm();
  return current?.film.id === filmId;
}
