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
            By accessing or using Shorty (&quot;the Service&quot;), you agree to these Terms of
            Service. If you do not agree, do not use the Service.
          </p>
          <section>
            <h2 className="text-lg font-bold text-white">The Service</h2>
            <p className="mt-2 text-sm">
              Shorty provides on-demand streaming of curated short films. Content is licensed for
              distribution through the platform. Availability may vary by region and device.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Accounts</h2>
            <p className="mt-2 text-sm">
              You must provide accurate information and keep your credentials secure. You are
              responsible for activity under your account. One household may use multiple profiles;
              concurrent streams are limited by your subscription plan.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Subscriptions & billing</h2>
            <p className="mt-2 text-sm">
              Paid plans renew monthly unless canceled before the renewal date. Free trials convert
              to paid subscriptions unless canceled. Payments are processed by Stripe. Refunds are
              handled per Stripe policy and applicable law.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Acceptable use</h2>
            <p className="mt-2 text-sm">
              Do not share accounts beyond your plan limits, scrape or redistribute content, bypass
              access controls, or use the Service for unlawful purposes. We may suspend accounts that
              violate these terms.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Content & copyright</h2>
            <p className="mt-2 text-sm">
              All films, artwork, and metadata are protected by copyright. You receive a limited,
              non-exclusive license to stream content for personal, non-commercial use. Filmmakers
              retain their rights; payout terms for rights holders are governed by separate agreements.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Limitation of liability</h2>
            <p className="mt-2 text-sm">
              The Service is provided &quot;as is.&quot; To the fullest extent permitted by law,
              Shorty is not liable for indirect damages, service interruptions, or third-party
              content availability.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Contact</h2>
            <p className="mt-2 text-sm">
              Questions:{" "}
              <a href="mailto:legal@shorty.app" className="text-[#ff7a18]">
                legal@shorty.app
              </a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
