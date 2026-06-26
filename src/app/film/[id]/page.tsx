import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Alias route: /film/:id → /films/:id */
export default async function FilmAliasPage({ params }: Props) {
  const { id } = await params;
  redirect(`/films/${id}`);
}
