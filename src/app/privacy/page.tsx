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
        <div className="prose prose-invert mt-8 max-w-none space-y-6 text-[#bbb]">
          <p>
            Shorty is a demo streaming platform. This policy describes how we handle information
            when you use the service.
          </p>
          <section>
            <h2 className="text-lg font-bold text-white">Information we collect</h2>
            <p className="mt-2">
              Account details (username, email, password hash), viewing activity (watch history,
              progress, ratings, favorites), and device session metadata when you sign in.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">How we use it</h2>
            <p className="mt-2">
              To provide streaming access, personalize recommendations, manage subscriptions, and
              secure your account. We do not sell personal data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Payments</h2>
            <p className="mt-2">
              When Stripe is enabled, payment details are processed by Stripe — not stored on our
              servers. Demo mode activates plans locally without real billing.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Your choices</h2>
            <p className="mt-2">
              Update your profile or delete your account anytime from{" "}
              <Link href="/account" className="text-[#ff7a18] hover:underline">
                Account settings
              </Link>
              . Deletion removes your data permanently.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
