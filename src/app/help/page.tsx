import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Help Center",
  description: "Get help with Shorty accounts, streaming, and subscriptions.",
};

const FAQ = [
  {
    q: "Is there a one-click demo login link?",
    a: "Yes — open /demo to sign in automatically as the demo user (Standard plan) and land on Browse. Requires ENABLE_TEST_LOGIN=true on the server.",
  },
  {
    q: "How do I start watching?",
    a: "Create a free account for a 7-day trial, or sign in with a demo account. Browse films and click Play to open the player.",
  },
  {
    q: "Why does sign-in take a while?",
    a: "On free hosting tiers the server may sleep — the first request can take 30–60 seconds. Refresh or try again.",
  },
  {
    q: "Can I watch without an account?",
    a: "Yes — browse the catalog as a guest and watch the monthly free film on the homepage without signing in.",
  },
  {
    q: "How do subscriptions work?",
    a: "Choose Basic, Standard, or Premium on the Plans page. Demo mode activates instantly; Stripe checkout is used when configured.",
  },
  {
    q: "How do I cancel?",
    a: "Go to Account → Membership or Manage Plan. Cancel anytime — access continues until the billing period ends.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <Link href="/browse" className="text-sm text-[#888] hover:text-white">
            Browse
          </Link>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="mt-2 text-[#888]">Quick answers about Shorty.</p>
        <div className="mt-10 space-y-6">
          {FAQ.map(({ q, a }) => (
            <section key={q} className="rounded-xl border border-[#222] bg-[#111] p-5">
              <h2 className="font-bold">{q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#aaa]">{a}</p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-[#666]">
          Demo accounts: <code className="text-[#888]">demo / demo1234</code> (Standard plan)
          {" · "}
          <Link href="/demo" className="text-[#ff7a18] hover:underline">
            Instant demo login
          </Link>
        </p>
        <p className="mt-4 text-sm text-[#555]">
          Production:{" "}
          <a
            href="https://shorty-website-five.vercel.app"
            className="text-[#ff7a18] hover:underline"
          >
            shorty-website-five.vercel.app
          </a>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
