import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "People",
  description:
    "Discover directors, actors, writers, and crew behind Shorty's curated short films.",
};

export default function PeopleBrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
