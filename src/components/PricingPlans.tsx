"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/lib/subscription";

type PricingPlansProps = {
  onSelectPlan?: (planId: PlanId) => void;
  selectedPlan?: PlanId | null;
  showCompare?: boolean;
  compact?: boolean;
};

export function PricingPlans({
  onSelectPlan,
  selectedPlan,
  showCompare = true,
  compact = false,
}: PricingPlansProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        compact ? "md:grid-cols-3" : "md:grid-cols-3 lg:gap-8"
      )}
    >
      {SUBSCRIPTION_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-[#111] p-6 transition",
            plan.popular
              ? "border-[#ff7a18] shadow-lg shadow-[#ff7a18]/10"
              : "border-[#222] hover:border-[#333]",
            selectedPlan === plan.id && "ring-2 ring-[#ff7a18]"
          )}
        >
          {plan.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ff7a18] px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Most popular
            </span>
          )}
          <div className="mb-4">
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-1 text-sm text-[#888]">{plan.tagline}</p>
          </div>
          <div className="mb-6">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold">${plan.price.toFixed(2)}</span>
              <span className="mb-1 text-[#888]">/month</span>
            </div>
            {showCompare && (
              <p className="mt-1 text-xs text-[#666]">
                Netflix equivalent ~${plan.compareAt.toFixed(2)}/mo
              </p>
            )}
          </div>
          <ul className="mb-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-[#bbb]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a18]" />
                {feature}
              </li>
            ))}
          </ul>
          {onSelectPlan ? (
            <button
              onClick={() => onSelectPlan(plan.id)}
              className={cn(
                "w-full rounded-lg py-3 text-sm font-bold transition",
                plan.popular
                  ? "bg-[#ff7a18] text-white hover:bg-[#ff9533]"
                  : "border border-[#444] hover:bg-white/5"
              )}
            >
              Choose {plan.name}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
