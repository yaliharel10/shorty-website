import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy Policy",
  description: "How Shorty handles your data and privacy.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <Link href="/" className="text-xl font-extrabold">
          Shorty<span className="text-[#ff7a18]">.</span>
        </Link>
      </header>
      <main id="main-content" className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#666]">Last updated: June 2026</p>
        <div className="mt-8 space-y-6 text-[#bbb]">
          <p>
            Shorty (&quot;we&quot;, &quot;us&quot;) operates the Shorty streaming service. This policy
            explains what information we collect, how we use it, and your rights.
          </p>
          <section>
            <h2 className="text-lg font-bold text-white">Information we collect</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>Account details: username, email, password hash, profile information</li>
              <li>Viewing activity: watch history, progress, ratings, favorites, watch duration</li>
              <li>Device sessions: sign-in metadata for security</li>
              <li>Payment data: processed by Stripe — we do not store card numbers</li>
              <li>OAuth: if you sign in with Google, we receive your name, email, and profile photo</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">How we use your information</h2>
            <p className="mt-2 text-sm">
              To provide streaming access, personalize recommendations, manage subscriptions,
              send transactional emails (verification, password reset, billing), calculate creator
              payouts, and secure your account. We do not sell personal data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Legal basis (EEA/UK)</h2>
            <p className="mt-2 text-sm">
              We process data to perform our contract with you (providing the service), with your
              consent (marketing cookies where applicable), and for legitimate interests (security,
              fraud prevention, analytics).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Data retention</h2>
            <p className="mt-2 text-sm">
              Account data is kept while your account is active. You may export or delete your data
              anytime from Account settings. Aggregated viewing statistics may be retained for payout
              reporting.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Your rights</h2>
            <p className="mt-2 text-sm">
              You may access, export, correct, or delete your data. Contact{" "}
              <a href="mailto:privacy@shorty.app" className="text-[#ff7a18]">
                privacy@shorty.app
              </a>{" "}
              for requests. EU/UK users may lodge a complaint with their supervisory authority.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Processors</h2>
            <p className="mt-2 text-sm">
              We use Stripe (payments), Resend (email), Turso (database hosting), Vercel (hosting),
              and optional Sentry (error monitoring). Each operates under their own privacy terms.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
