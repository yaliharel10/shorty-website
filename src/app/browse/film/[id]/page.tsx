import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { FilmDetailView } from "@/components/FilmDetailView";
import { getPublicFilm } from "@/lib/film-public";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const film = await getPublicFilm(id);
  if (!film) return { title: "Film" };
  return {
    title: film.title,
    description: film.description.slice(0, 160),
  };
}

export default async function BrowseFilmPage({ params }: Props) {
  const { id } = await params;
  return (
    <AuthProvider>
      <ToastProvider>
        <FilmDetailView filmId={id} />
      </ToastProvider>
    </AuthProvider>
  );
}
