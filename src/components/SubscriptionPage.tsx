"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider, useToast } from "@/components/Toast";
import { AuthModal } from "@/components/AuthModal";
import { SubscribeModal } from "@/components/SubscribeModal";
import { PricingPlans } from "@/components/PricingPlans";
import { TRIAL_DAYS, SUBSCRIPTION_PLANS, getPlan, trialDaysRemaining } from "@/lib/subscription";
import type { PlanId } from "@/lib/subscription";

function SubscriptionContent() {
  const { user, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("standard");
  const [canceling, setCanceling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/subscription/config")
      .then((r) => r.json())
      .then((d) => setStripeEnabled(Boolean(d.stripeEnabled)))
      .catch(() => setStripeEnabled(false));
  }, []);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      fetch("/api/subscription/sync", { method: "POST" })
        .then((r) => r.json())
        .then(async () => {
          await refresh();
          toast("Subscription active — welcome to Shorty!", "success");
          router.replace("/subscription");
        })
        .catch(() => toast("Payment received — refresh if access isn't updated yet", "info"));
    }
    if (searchParams.get("canceled") === "1") {
      toast("Checkout canceled", "info");
      router.replace("/subscription");
    }
  }, [searchParams, refresh, toast, router]);

  const handleSelectPlan = (planId: PlanId) => {
    setSelectedPlan(planId);
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSubscribeOpen(true);
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the end of your billing period.")) {
      return;
    }
    setCanceling(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      await refresh();
      toast(data.message, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Cancel failed", "error");
    } finally {
      setCanceling(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open billing portal");
      window.location.href = data.url;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Billing portal failed", "error");
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  const trialDays = user?.trialEndsAt ? trialDaysRemaining(new Date(user.trialEndsAt)) : 0;
  const currentPlan = user ? getPlan(user.subscriptionTier) : null;
  const hasPaidSub =
    user?.subscriptionStatus === "active" || user?.subscriptionStatus === "canceled";

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href={user ? "/browse" : "/"} className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          {user ? (
            <Link href="/browse" className="text-sm text-[#888] hover:text-white">
              Back to Browse
            </Link>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="text-sm font-bold text-[#ff7a18] hover:underline"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#ff7a18]">
            Plans & Pricing
          </p>
          <h1 className="text-3xl font-extrabold md:text-5xl">
            Netflix-style streaming.
            <br />
            <span className="text-[#ff7a18]">A fraction of the price.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[#888]">
            Short films in under 25 minutes. Full library access from $
            {Math.min(...SUBSCRIPTION_PLANS.map((p) => p.price)).toFixed(2)}/mo.
            Start with a {TRIAL_DAYS}-day free trial when you sign up.
          </p>
        </div>

        {user && (
          <div className="mb-10 rounded-2xl border border-[#222] bg-[#111] p-6">
            <h2 className="text-lg font-bold">Your membership</h2>
            <p className="mt-2 text-sm text-[#888]">
              Status: <span className="text-white">{user.accessLabel}</span>
            </p>
            {user.hasStreamingAccess && trialDays > 0 && (
              <p className="mt-1 text-sm text-[#ff7a18]">
                {trialDays} day{trialDays !== 1 ? "s" : ""} left on your free trial
              </p>
            )}
            {currentPlan && hasPaidSub && (
              <p className="mt-1 text-sm text-[#666]">
                ${currentPlan.price.toFixed(2)}/month
                {user.subscriptionEndsAt &&
                  ` · ${user.subscriptionStatus === "canceled" ? "Access until" : "Renews"} ${new Date(user.subscriptionEndsAt).toLocaleDateString()}`}
              </p>
            )}
            {user.subscriptionStatus === "past_due" && (
              <p className="mt-1 text-sm text-red-400">
                Payment failed — update your billing info to restore access.
              </p>
            )}
            {user.subscriptionStatus === "canceled" && (
              <p className="mt-1 text-sm text-yellow-500">Canceled — access until period ends</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {!user.hasStreamingAccess && (
                <button
                  onClick={() => setSubscribeOpen(true)}
                  className="rounded-lg bg-[#ff7a18] px-5 py-2 text-sm font-bold hover:bg-[#ff9533]"
                >
                  Subscribe now
                </button>
              )}
              {stripeEnabled && hasPaidSub && user.role !== "admin" && (
                <button
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="rounded-lg border border-[#444] px-5 py-2 text-sm text-[#aaa] hover:text-white disabled:opacity-50"
                >
                  {portalLoading ? "Opening..." : "Manage billing"}
                </button>
              )}
              {user.subscriptionStatus === "active" && user.role !== "admin" && !stripeEnabled && (
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="rounded-lg border border-[#444] px-5 py-2 text-sm text-[#aaa] hover:text-white disabled:opacity-50"
                >
                  {canceling ? "Canceling..." : "Cancel subscription"}
                </button>
              )}
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                }}
                className="rounded-lg px-5 py-2 text-sm text-[#666] hover:text-white"
              >
                Log out
              </button>
            </div>
          </div>
        )}

        <PricingPlans onSelectPlan={handleSelectPlan} selectedPlan={selectedPlan} />

        <p className="mt-10 text-center text-xs text-[#555]">
          {stripeEnabled
            ? "Payments secured by Stripe. Compare-at prices are approximate Netflix US tiers."
            : "Add Stripe keys on Render for live billing. Compare-at prices are approximate Netflix US tiers."}
        </p>
      </main>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode="register"
        onSuccess={() => {
          toast(`Welcome! Enjoy your ${TRIAL_DAYS}-day free trial.`, "success");
          setSubscribeOpen(false);
        }}
      />
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        defaultPlan={selectedPlan}
        onSuccess={() => router.push("/browse")}
      />
    </div>
  );
}

export function SubscriptionPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#080808]">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
            </div>
          }
        >
          <SubscriptionContent />
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
