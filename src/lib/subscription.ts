import type { User } from "@prisma/client";
import { requiresEmailVerification } from "@/lib/email-verification";

export type PlanId = "basic" | "standard" | "premium";

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  price: number;
  compareAt: number;
  tagline: string;
  features: string[];
  screens: number;
  popular?: boolean;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 1.99,
    compareAt: 6.99,
    tagline: "Everything you need to start streaming",
    screens: 1,
    features: [
      "Full short film library",
      "Watch on 1 device at a time",
      "HD streaming",
      "My List & ratings",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 3.99,
    compareAt: 15.49,
    tagline: "Best value for everyday watching",
    screens: 2,
    popular: true,
    features: [
      "Full short film library",
      "Watch on 2 devices at a time",
      "HD streaming",
      "My List & ratings",
      "People search & profiles",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 5.99,
    compareAt: 22.99,
    tagline: "For households and film lovers",
    screens: 4,
    features: [
      "Full short film library",
      "Watch on 4 devices at a time",
      "HD streaming",
      "My List & ratings",
      "People search & profiles",
      "Early access to new releases",
    ],
  },
];

export const TRIAL_DAYS = 7;

export function getPlan(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
}

type AccessUser = Pick<
  User,
  | "role"
  | "emailVerified"
  | "subscriptionTier"
  | "subscriptionStatus"
  | "subscriptionEndsAt"
  | "trialEndsAt"
>;

export function hasStreamingAccess(user: AccessUser): boolean {
  if (user.role === "admin") return true;

  if (requiresEmailVerification(user.emailVerified)) {
    return false;
  }

  const now = new Date();

  if (user.trialEndsAt && user.trialEndsAt > now) {
    return true;
  }

  if (
    user.subscriptionStatus === "past_due" ||
    user.subscriptionStatus === "unpaid" ||
    user.subscriptionStatus === "incomplete"
  ) {
    return false;
  }

  if (
    user.subscriptionTier !== "none" &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "canceled" ||
      user.subscriptionStatus == null) &&
    (!user.subscriptionEndsAt || user.subscriptionEndsAt > now)
  ) {
    return true;
  }

  return false;
}

export function getAccessLabel(user: AccessUser): string {
  if (user.role === "admin") return "Admin access";
  if (user.trialEndsAt && user.trialEndsAt > new Date()) {
    return "Free trial";
  }
  if (hasStreamingAccess(user)) {
    const plan = getPlan(user.subscriptionTier);
    return plan ? `${plan.name} plan` : "Subscribed";
  }
  return "No active plan";
}

export function trialDaysRemaining(trialEndsAt: Date | null | undefined): number {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
}
