"use client";

import { useEffect, useState } from "react";
import { CreditCard, Sparkles } from "lucide-react";
import { Modal } from "@/components/Modal";
import { PricingPlans } from "@/components/PricingPlans";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { getPlan, type PlanId } from "@/lib/subscription";

type SubscribeModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPlan?: PlanId;
};

export function SubscribeModal({
  open,
  onClose,
  onSuccess,
  defaultPlan = "standard",
}: SubscribeModalProps) {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(defaultPlan);
  const [loading, setLoading] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);

  const plan = getPlan(selectedPlan);

  useEffect(() => {
    if (open) {
      fetch("/api/subscription/config")
        .then((r) => r.json())
        .then((d) => setStripeEnabled(Boolean(d.stripeEnabled)))
        .catch(() => setStripeEnabled(false));
    }
  }, [open]);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = stripeEnabled
        ? "/api/subscription/checkout"
        : "/api/subscription";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      await refresh();
      toast(data.message || "You're subscribed!", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Subscription failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Choose your plan">
      <div className="max-h-[70vh] overflow-y-auto px-1">
        <p className="mb-6 text-sm text-[#888]">
          Stream the full Shorty library for a fraction of Netflix pricing.
          {stripeEnabled
            ? " Secure checkout powered by Stripe."
            : " Demo mode — no card required locally."}
        </p>

        <PricingPlans
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          compact
        />

        <div className="mt-6 rounded-xl border border-[#333] bg-[#0a0a0a] p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 text-[#ff7a18]" />
            <div>
              <p className="text-sm font-medium">
                {stripeEnabled ? "Secure Stripe checkout" : "Demo checkout"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#666]">
                {stripeEnabled
                  ? "You'll be redirected to Stripe to enter payment details. Subscriptions renew monthly. Cancel anytime from your account."
                  : "Local demo mode — plan activates instantly without payment. Add Stripe keys on Render for real billing."}
              </p>
            </div>
          </div>
        </div>

        {plan && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-[#222] bg-[#111] px-4 py-3">
            <div>
              <p className="text-sm font-bold">{plan.name} plan</p>
              <p className="text-xs text-[#888]">${plan.price.toFixed(2)}/month</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#ff7a18]">
              <Sparkles className="h-3.5 w-3.5" />
              Cancel anytime
            </div>
          </div>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading || !user || stripeEnabled === null}
          className="mt-6 w-full rounded-lg bg-[#ff7a18] py-3.5 text-sm font-bold transition hover:bg-[#ff9533] disabled:opacity-50"
        >
          {loading
            ? "Redirecting..."
            : stripeEnabled
              ? `Continue to checkout — $${plan?.price.toFixed(2) ?? "0.00"}/mo`
              : `Subscribe — $${plan?.price.toFixed(2) ?? "0.00"}/mo`}
        </button>
      </div>
    </Modal>
  );
}
