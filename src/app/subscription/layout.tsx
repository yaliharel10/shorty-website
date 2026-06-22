import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description:
    "Shorty subscription plans from $1.99/month. 7-day free trial, full short film library, cancel anytime.",
  openGraph: {
    title: "Shorty Plans & Pricing",
    description: "Stream curated short films for less than Netflix.",
  },
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
