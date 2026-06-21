"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  LogIn,
  Shield,
  Film,
  CreditCard,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider, useToast } from "@/components/Toast";

const DEMO_ACCOUNTS = [
  {
    username: "admin",
    password: "admin123",
    role: "Admin",
    note: "Full admin panel access",
    redirect: "/admin",
  },
  {
    username: "demo",
    password: "demo1234",
    role: "Standard",
    note: "Active Standard subscriber",
    redirect: "/browse",
  },
  {
    username: "trialuser",
    password: "demo1234",
    role: "Trial",
    note: "7-day free trial active",
    redirect: "/browse",
  },
  {
    username: "basicuser",
    password: "demo1234",
    role: "Basic",
    note: "Basic plan ($1.99/mo)",
    redirect: "/browse",
  },
  {
    username: "premiumuser",
    password: "demo1234",
    role: "Premium",
    note: "Premium plan ($5.99/mo)",
    redirect: "/browse",
  },
  {
    username: "expireduser",
    password: "demo1234",
    role: "Expired",
    note: "No access — subscribe paywall",
    redirect: "/browse",
  },
  {
    username: "guestplus",
    password: "demo1234",
    role: "Canceled",
    note: "Canceled sub, access until period ends",
    redirect: "/browse",
  },
];

function TestPageContent() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [siteUrl, setSiteUrl] = useState("");
  const [testLoginEnabled, setTestLoginEnabled] = useState(false);
  const [health, setHealth] = useState<"loading" | "ok" | "error">("loading");
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    setSiteUrl(window.location.origin);
    fetch("/api/test/login")
      .then((r) => r.json())
      .then((d) => {
        setTestLoginEnabled(Boolean(d.enabled));
        if (d.siteUrl) setSiteUrl(d.siteUrl);
      })
      .catch(() => {});

    fetch("/api/health")
      .then((r) => (r.ok ? setHealth("ok") : setHealth("error")))
      .catch(() => setHealth("error"));
  }, []);

  const quickLogin = async (username: string, redirect: string) => {
    setLoggingIn(username);
    try {
      const res = await fetch("/api/test/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.user) setUser(data.user);
      toast(`Signed in as ${username}`, "success");
      router.push(data.redirect || redirect);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setLoggingIn(null);
    }
  };

  const pages = [
    { label: "Landing page", path: "/", icon: Film },
    { label: "Browse films", path: "/browse", icon: Film },
    { label: "People search", path: "/browse/people", icon: Users },
    { label: "Plans & subscribe", path: "/subscription", icon: CreditCard },
    { label: "Account", path: "/account", icon: Users },
    { label: "Admin dashboard", path: "/admin", icon: Shield },
    { label: "Admin films", path: "/admin/films", icon: Shield },
    { label: "Admin users", path: "/admin/users", icon: Shield },
    { label: "Admin subscriptions", path: "/admin/subscriptions", icon: Shield },
    { label: "Sign in modal", path: "/?signin=1", icon: LogIn },
    { label: "API health", path: "/api/health", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Test hub</h1>
          <p className="mt-2 text-sm text-[#888]">
            Quick links and one-click logins for testing{" "}
            {siteUrl && (
              <a href={siteUrl} className="text-[#ff7a18] hover:underline">
                {siteUrl}
              </a>
            )}
          </p>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-4xl px-6 py-10">
        {/* Status */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#222] bg-[#111] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#666]">
              Server
            </p>
            <div className="mt-2 flex items-center gap-2">
              {health === "loading" && (
                <Loader2 className="h-5 w-5 animate-spin text-[#888]" />
              )}
              {health === "ok" && (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              {health === "error" && (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <span className="font-medium">
                {health === "loading"
                  ? "Checking..."
                  : health === "ok"
                    ? "Online"
                    : "Offline or waking up"}
              </span>
            </div>
            {health === "error" && (
              <p className="mt-2 text-xs text-[#666]">
                Free Render tier sleeps after ~15 min. Wait 30–60s and refresh.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[#222] bg-[#111] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#666]">
              Session
            </p>
            <p className="mt-2 font-medium">
              {user ? `Signed in as ${user.username}` : "Not signed in"}
            </p>
            {user && (
              <p className="mt-1 text-xs text-[#666]">{user.accessLabel}</p>
            )}
          </div>
        </section>

        {/* One-click login */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold">One-click test login</h2>
          {!testLoginEnabled ? (
            <p className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-4 text-sm text-yellow-200">
              One-click login is disabled. Set{" "}
              <code className="text-[#ff7a18]">ENABLE_TEST_LOGIN=true</code> in
              Render environment variables, then redeploy.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  onClick={() => quickLogin(account.username, account.redirect)}
                  disabled={loggingIn !== null}
                  className="flex items-start gap-3 rounded-xl border border-[#222] bg-[#111] p-4 text-left transition hover:border-[#ff7a18]/40 disabled:opacity-50"
                >
                  <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a18]" />
                  <div>
                    <p className="font-bold">{account.username}</p>
                    <p className="text-xs text-[#888]">
                      {account.role} · {account.note}
                    </p>
                    {loggingIn === account.username && (
                      <p className="mt-1 text-xs text-[#ff7a18]">Signing in...</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Demo credentials */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold">Demo credentials</h2>
          <div className="overflow-x-auto rounded-xl border border-[#222]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#111] text-xs uppercase tracking-wider text-[#666]">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3">Use case</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ACCOUNTS.map((a) => (
                  <tr key={a.username} className="border-t border-[#222]">
                    <td className="px-4 py-3 font-mono text-[#ff7a18]">
                      {a.username}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#888]">
                      {a.password}
                    </td>
                    <td className="px-4 py-3 text-[#666]">{a.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Page links */}
        <section>
          <h2 className="mb-4 text-lg font-bold">Test URLs</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {pages.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                href={path}
                className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#111] px-4 py-3 text-sm transition hover:border-[#ff7a18]/40 hover:text-[#ff7a18]"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                <span className="font-mono text-xs text-[#555]">{path}</span>
                <ExternalLink className="h-3 w-3 text-[#444]" />
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-[#444]">
          This page is for testing only — not linked from the main site.
        </p>
      </main>
    </div>
  );
}

export function TestPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <TestPageContent />
      </ToastProvider>
    </AuthProvider>
  );
}
