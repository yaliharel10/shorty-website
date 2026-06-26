import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Help Center",
  description: "Get help with Shorty accounts, streaming, and subscriptions.",
};

const FAQ = [
  {
    q: "How do I start watching?",
    a: "Create a free account for a 7-day trial, verify your email, then browse films and click Play.",
  },
  {
    q: "Can I watch without an account?",
    a: "Yes — browse the catalog as a guest and watch the monthly free film on the homepage.",
  },
  {
    q: "How do subscriptions work?",
    a: "Choose Basic, Standard, or Premium on the Plans page. All plans include the full library with different screen limits.",
  },
  {
    q: "How do I cancel?",
    a: "Go to Account → Membership or Manage Plan. Cancel anytime — access continues until the billing period ends.",
  },
  {
    q: "How do I export my data?",
    a: "Go to Account settings and click Download my data for a JSON export of your account activity.",
  },
  {
    q: "I didn't receive a verification email",
    a: "Check spam, then use the Resend verification button on the browse page after signing in.",
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
          Need more help? Email{" "}
          <a href="mailto:support@shorty.app" className="text-[#ff7a18] hover:underline">
            support@shorty.app
          </a>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
