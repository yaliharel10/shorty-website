import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Short Films",
  description:
    "Stream curated short films — drama, comedy, animation, and sci-fi. Continue watching, personalized picks, and advanced search.",
  openGraph: {
    title: "Browse Short Films | Shorty",
    description: "Discover hand-picked short films under 25 minutes.",
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
