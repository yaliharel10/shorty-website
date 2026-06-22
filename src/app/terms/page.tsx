import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Terms of Service",
  description: "Terms for using the Shorty streaming platform.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <Link href="/" className="text-xl font-extrabold">
          Shorty<span className="text-[#ff7a18]">.</span>
        </Link>
      </header>
      <main id="main-content" className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#666]">Last updated: June 2026</p>
        <div className="mt-8 space-y-6 text-[#bbb]">
          <p>
            By using Shorty you agree to these terms. This is a demonstration product — content
            is licensed for portfolio/demo use via third-party embeds and placeholders.
          </p>
          <section>
            <h2 className="text-lg font-bold text-white">Subscriptions</h2>
            <p className="mt-2">
              Paid plans renew monthly unless canceled. Free trials convert to paid tiers unless
              you cancel before the trial ends. Refunds follow Stripe policies when live billing
              is enabled.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Acceptable use</h2>
            <p className="mt-2">
              Do not share accounts beyond your plan&apos;s screen limit, scrape the catalog, or
              attempt to bypass access controls. Admin accounts are for authorized operators only.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Content</h2>
            <p className="mt-2">
              Films are streamed via embedded players. Shorty does not guarantee availability of
              third-party video sources. Catalog and pricing may change during development.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
