import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Cookie Policy",
  description: "How Shorty uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <Link href="/" className="text-xl font-extrabold">
          Shorty<span className="text-[#ff7a18]">.</span>
        </Link>
      </header>
      <main id="main-content" className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold">Cookie Policy</h1>
        <p className="mt-2 text-sm text-[#666]">Last updated: June 2026</p>
        <div className="mt-8 space-y-6 text-[#bbb]">
          <p className="text-sm">
            Shorty uses cookies and similar technologies to operate the streaming service and improve
            your experience.
          </p>
          <section>
            <h2 className="text-lg font-bold text-white">Essential cookies</h2>
            <p className="mt-2 text-sm">
              <strong className="text-white">shorty_session</strong> — keeps you signed in securely.
              Required for account features. Duration: 7 days.
            </p>
            <p className="mt-2 text-sm">
              <strong className="text-white">shorty_profile</strong> — remembers your selected
              profile on shared devices.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Preference storage</h2>
            <p className="mt-2 text-sm">
              We use browser local storage for cookie consent choice, active profile selection, and
              UI preferences. This data stays on your device.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Analytics (optional)</h2>
            <p className="mt-2 text-sm">
              When configured, we may use PostHog or similar tools to understand usage patterns.
              These are not required for the Service to function.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">Managing cookies</h2>
            <p className="mt-2 text-sm">
              You can clear cookies in your browser settings. Clearing essential cookies will sign
              you out. See also our{" "}
              <Link href="/privacy" className="text-[#ff7a18] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
