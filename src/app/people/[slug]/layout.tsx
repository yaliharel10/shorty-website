import type { Metadata } from "next";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const person = await prisma.person.findUnique({
    where: { slug },
    select: { name: true, bio: true, imgUrl: true, primaryRole: true },
  });

  if (!person) {
    return { title: "Person not found" };
  }

  const title = `${person.name} — ${person.primaryRole}`;
  const description = person.bio.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: person.imgUrl, alt: person.name }],
    },
  };
}

export default function PersonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
