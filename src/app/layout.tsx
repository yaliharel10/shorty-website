import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SkipLink } from "@/components/SkipLink";
import { ServerWake } from "@/components/ServerWake";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shorty | Premium Short Films",
    template: "%s | Shorty",
  },
  description:
    "Stream hand-picked short films — drama, comedy, animation, and sci-fi. Create your list, rate films, and discover stories under 25 minutes.",
  keywords: [
    "short films",
    "streaming",
    "indie cinema",
    "drama",
    "comedy",
    "animation",
    "sci-fi",
  ],
  authors: [{ name: "Shorty" }],
  creator: "Shorty",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Shorty",
    title: "Shorty | Premium Short Films",
    description:
      "Stream hand-picked short films. Drama, comedy, animation, sci-fi and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shorty | Premium Short Films",
    description:
      "Stream hand-picked short films. Drama, comedy, animation, sci-fi and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff7a18",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SkipLink />
        <ServerWake />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
