"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Eye,
  EyeOff,
  MonitorSmartphone,
  Shield,
  Trash2,
  User,
  History,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider, useToast } from "@/components/Toast";
import { FormField, inputClassName } from "@/components/FormField";
import { getPlan, trialDaysRemaining } from "@/lib/subscription";
import { cn } from "@/lib/utils";

type Section = "profile" | "membership" | "payment" | "devices" | "security" | "history";

type AccountStats = {
  favorites: number;
  ratings: number;
  views: number;
};

type DeviceSession = {
  id: string;
  deviceLabel: string;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
};

type BillingInfo = {
  stripeEnabled: boolean;
  hasBillingAccount: boolean;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
  subscription: {
    tier: string;
    planName: string | null;
    planPrice: number | null;
    status: string | null;
    nextBillingDate: string | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
    screens: number;
  };
};

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "history", label: "Watch History", icon: History },
  { id: "membership", label: "Membership", icon: CreditCard },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "devices", label: "Devices", icon: MonitorSmartphone },
  { id: "security", label: "Security", icon: Shield },
];

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function cardBrandLabel(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function AccountContent() {
  const { user, loading: authLoading, refresh, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const sectionParam = searchParams.get("section");
  const initialSection: Section =
    sectionParam === "membership" ||
    sectionParam === "payment" ||
    sectionParam === "devices" ||
    sectionParam === "security" ||
    sectionParam === "history"
      ? sectionParam
      : "profile";

  const [section, setSection] = useState<Section>(initialSection);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [canceling, setCanceling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [watchHistory, setWatchHistory] = useState<
    { film: { id: string; title: string; posterUrl: string; category: string; rating: number; duration: number; year: number }; watchedAt: string }[]
  >([]);
  const [historyProgress, setHistoryProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const param = searchParams.get("section");
    if (
      param === "profile" ||
      param === "membership" ||
      param === "payment" ||
      param === "devices" ||
      param === "security" ||
      param === "history"
    ) {
      setSection(param);
    }
  }, [searchParams]);

  const loadAccount = useCallback(async () => {
    const [accountRes, billingRes, devicesRes, historyRes] = await Promise.all([
      fetch("/api/account"),
      fetch("/api/account/billing"),
      fetch("/api/account/sessions"),
      fetch("/api/account/history"),
    ]);

    const accountData = await accountRes.json();
    if (accountData.stats) setStats(accountData.stats);
    if (accountData.memberSince) setMemberSince(accountData.memberSince);

    if (billingRes.ok) {
      setBilling(await billingRes.json());
    }

    if (devicesRes.ok) {
      const devicesData = await devicesRes.json();
      setDevices(devicesData.devices || []);
    }

    if (historyRes.ok) {
      const historyData = await historyRes.json();
      setWatchHistory(historyData.history || []);
      setHistoryProgress(historyData.progress || {});
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/?signin=1");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    setUsername(user.username);
    setPhotoUrl(user.photoUrl || "");
    setEmail(user.email);
    loadAccount().finally(() => setLoading(false));
  }, [user, loadAccount]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      await refresh();
      toast("Profile updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setProfileLoading(false);
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: emailPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email update failed");
      await refresh();
      setEmailPassword("");
      toast(data.message || "Email updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Email update failed", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password update failed");
      await refresh();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast(data.message, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Password update failed", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: "/account" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open billing portal");
      window.location.href = data.url;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Billing portal failed", "error");
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Cancel your subscription? You'll keep access until the end of your billing period."
      )
    ) {
      return;
    }
    setCanceling(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancel failed");
      await refresh();
      await loadAccount();
      toast(data.message, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Cancel failed", "error");
    } finally {
      setCanceling(false);
    }
  };

  const revokeDevice = async (sessionId: string) => {
    setDevicesLoading(true);
    try {
      const res = await fetch("/api/account/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sign out device");
      await loadAccount();
      toast(data.message, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setDevicesLoading(false);
    }
  };

  const revokeOtherDevices = async () => {
    if (!confirm("Sign out all other devices?")) return;
    setDevicesLoading(true);
    try {
      const res = await fetch("/api/account/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeOthers: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await loadAccount();
      toast(data.message, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setDevicesLoading(false);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !confirm(
        "This permanently deletes your account, watch history, and saved films. This cannot be undone."
      )
    ) {
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: deletePassword,
          confirm: deleteConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deletion failed");
      toast(data.message, "success");
      router.push("/");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Deletion failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  const plan = getPlan(user.subscriptionTier);
  const trialDays = user.trialEndsAt ? trialDaysRemaining(new Date(user.trialEndsAt)) : 0;
  const hasPaidSub =
    user.subscriptionStatus === "active" || user.subscriptionStatus === "canceled";
  const displayLabel = user.displayName || user.username;
  const otherDevices = devices.filter((d) => !d.isCurrent);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/browse" className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <Link href="/browse" className="text-sm text-[#888] hover:text-white">
            Back to Browse
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="mt-2 text-[#888]">
            Manage your profile, membership, payment, and devices for {displayLabel}
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <nav className="flex shrink-0 gap-2 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap transition",
                  section === id
                    ? "bg-[#ff7a18] text-white"
                    : "text-[#888] hover:bg-[#111] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 space-y-8">
            {section === "profile" && (
              <>
                <section className="rounded-2xl border border-[#222] bg-[#111] p-6">
                  <h2 className="text-lg font-bold">Profile details</h2>
                  <p className="mt-1 text-sm text-[#666]">
                    How you appear across Shorty
                  </p>
                  <form onSubmit={saveProfile} className="mt-4 space-y-4">
                    <FormField id="display-name" label="Display name">
                      <input
                        id="display-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={user.username}
                        maxLength={50}
                        className={inputClassName}
                      />
                    </FormField>
                    <FormField id="account-username" label="Username">
                      <input
                        id="account-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className={inputClassName}
                      />
                    </FormField>
                    <FormField
                      id="account-photo"
                      label="Avatar URL"
                      hint="Link to a square profile image"
                    >
                      <input
                        id="account-photo"
                        type="url"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className={inputClassName}
                      />
                    </FormField>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="rounded-lg bg-[#ff7a18] px-5 py-2.5 text-sm font-bold hover:bg-[#ff9533] disabled:opacity-50"
                    >
                      {profileLoading ? "Saving..." : "Save profile"}
                    </button>
                  </form>
                </section>

                <section className="rounded-2xl border border-[#222] bg-[#111] p-6">
                  <h2 className="text-lg font-bold">Email address</h2>
                  <p className="mt-1 text-sm text-[#666]">
                    Used for sign-in and account recovery
                  </p>
                  <form onSubmit={changeEmail} className="mt-4 space-y-4">
                    <FormField id="account-email" label="Email">
                      <input
                        id="account-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={inputClassName}
                        autoComplete="email"
                      />
                    </FormField>
                    <FormField
                      id="email-password"
                      label="Current password"
                      hint="Required to change your email"
                    >
                      <input
                        id="email-password"
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        required
                        className={inputClassName}
                        autoComplete="current-password"
                      />
                    </FormField>
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="rounded-lg border border-[#444] px-5 py-2.5 text-sm font-bold hover:bg-white/5 disabled:opacity-50"
                    >
                      {emailLoading ? "Updating..." : "Update email"}
                    </button>
                  </form>
                </section>

                {stats && (
                  <p className="text-xs text-[#555]">
                    {stats.views} views · {stats.favorites} saved · {stats.ratings}{" "}
                    ratings
                    {memberSince &&
                      ` · Member since ${new Date(memberSince).toLocaleDateString()}`}
                  </p>
                )}
              </>
            )}

            {section === "membership" && (
              <section className="rounded-2xl border border-[#222] bg-[#111] p-6">
                <h2 className="text-lg font-bold">Membership</h2>
                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-[#666]">Status</p>
                    <p className="font-medium">{user.accessLabel}</p>
                  </div>
                  {plan && hasPaidSub && (
                    <div>
                      <p className="text-[#666]">Plan</p>
                      <p className="font-medium">
                        {plan.name} — ${plan.price.toFixed(2)}/mo
                      </p>
                    </div>
                  )}
                  {trialDays > 0 && (
                    <div>
                      <p className="text-[#666]">Trial</p>
                      <p className="font-medium text-[#ff7a18]">
                        {trialDays} day{trialDays !== 1 ? "s" : ""} remaining
                      </p>
                    </div>
                  )}
                  {billing?.subscription.nextBillingDate && hasPaidSub && (
                    <div>
                      <p className="text-[#666]">
                        {billing.subscription.cancelAtPeriodEnd
                          ? "Access until"
                          : "Next billing date"}
                      </p>
                      <p className="font-medium">
                        {new Date(
                          billing.subscription.nextBillingDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {billing?.subscription.screens && (
                    <div>
                      <p className="text-[#666]">Simultaneous streams</p>
                      <p className="font-medium">
                        Up to {billing.subscription.screens} device
                        {billing.subscription.screens !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>

                {billing?.subscription.cancelAtPeriodEnd && (
                  <p className="mt-4 rounded-lg border border-yellow-900/50 bg-yellow-950/30 px-4 py-3 text-sm text-yellow-200">
                    Your subscription is set to cancel at the end of the current billing
                    period.
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/subscription"
                    className="rounded-lg bg-[#ff7a18] px-5 py-2.5 text-sm font-bold hover:bg-[#ff9533]"
                  >
                    {hasPaidSub ? "Change plan" : "View plans"}
                  </Link>
                  {hasPaidSub &&
                    user.subscriptionStatus === "active" &&
                    !billing?.subscription.cancelAtPeriodEnd && (
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={canceling}
                        className="rounded-lg border border-[#444] px-5 py-2.5 text-sm font-bold hover:bg-white/5 disabled:opacity-50"
                      >
                        {canceling ? "Canceling..." : "Cancel subscription"}
                      </button>
                    )}
                </div>
              </section>
            )}

            {section === "payment" && (
              <section className="rounded-2xl border border-[#222] bg-[#111] p-6">
                <h2 className="text-lg font-bold">Payment method</h2>
                <p className="mt-1 text-sm text-[#666]">
                  Manage cards and billing details
                </p>

                {billing?.paymentMethod ? (
                  <div className="mt-4 rounded-xl border border-[#333] bg-[#0a0a0a] p-4">
                    <p className="font-medium">
                      {cardBrandLabel(billing.paymentMethod.brand)} ····{" "}
                      {billing.paymentMethod.last4}
                    </p>
                    <p className="mt-1 text-sm text-[#666]">
                      Expires {billing.paymentMethod.expMonth}/
                      {billing.paymentMethod.expYear}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#666]">
                    {billing?.stripeEnabled
                      ? "No payment method on file. Subscribe to add a card."
                      : "Demo mode — no real payment method required."}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {billing?.stripeEnabled && billing.hasBillingAccount && (
                    <button
                      type="button"
                      onClick={openBillingPortal}
                      disabled={portalLoading}
                      className="rounded-lg bg-[#ff7a18] px-5 py-2.5 text-sm font-bold hover:bg-[#ff9533] disabled:opacity-50"
                    >
                      {portalLoading ? "Opening..." : "Manage payment & billing"}
                    </button>
                  )}
                  {!hasPaidSub && (
                    <Link
                      href="/subscription"
                      className="rounded-lg border border-[#444] px-5 py-2.5 text-sm font-bold hover:bg-white/5"
                    >
                      Subscribe
                    </Link>
                  )}
                </div>

                {billing?.stripeEnabled && (
                  <p className="mt-4 text-xs text-[#555]">
                    Payment updates are handled securely through Stripe.
                  </p>
                )}
              </section>
            )}

            {section === "devices" && (
              <section className="rounded-2xl border border-[#222] bg-[#111] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">Signed-in devices</h2>
                    <p className="mt-1 text-sm text-[#666]">
                      Manage where you&apos;re signed in to Shorty
                    </p>
                  </div>
                  {otherDevices.length > 0 && (
                    <button
                      type="button"
                      onClick={revokeOtherDevices}
                      disabled={devicesLoading}
                      className="text-sm font-bold text-[#ff7a18] hover:underline disabled:opacity-50"
                    >
                      Sign out all others
                    </button>
                  )}
                </div>

                <ul className="mt-4 space-y-3">
                  {devices.length === 0 ? (
                    <li className="text-sm text-[#666]">
                      Sign in on a device to see it listed here.
                    </li>
                  ) : (
                    devices.map((device) => (
                      <li
                        key={device.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#333] bg-[#0a0a0a] p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {device.deviceLabel}
                            {device.isCurrent && (
                              <span className="ml-2 rounded bg-[#ff7a18]/20 px-2 py-0.5 text-xs text-[#ff7a18]">
                                This device
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-[#666]">
                            Last active {formatRelativeTime(device.lastActiveAt)}
                            {device.ipAddress && ` · ${device.ipAddress}`}
                          </p>
                        </div>
                        {!device.isCurrent && (
                          <button
                            type="button"
                            onClick={() => revokeDevice(device.id)}
                            disabled={devicesLoading}
                            className="text-sm text-[#888] hover:text-red-400 disabled:opacity-50"
                          >
                            Sign out
                          </button>
                        )}
                      </li>
                    ))
                  )}
                </ul>

                {plan && (
                  <p className="mt-4 text-xs text-[#555]">
                    Your {plan.name} plan allows up to {plan.screens} simultaneous
                    stream{plan.screens !== 1 ? "s" : ""}.
                  </p>
                )}
              </section>
            )}

            {section === "history" && (
              <section className="rounded-2xl border border-[#222] bg-[#111] p-6">
                <h2 className="text-lg font-bold">Watch History</h2>
                <p className="mt-1 text-sm text-[#888]">
                  Films you&apos;ve opened recently, newest first.
                </p>
                {watchHistory.length === 0 ? (
                  <p className="mt-6 text-sm text-[#666]">
                    No watch history yet.{" "}
                    <Link href="/browse" className="text-[#ff7a18] hover:underline">
                      Start browsing
                    </Link>
                  </p>
                ) : (
                  <ul className="mt-6 space-y-3">
                    {watchHistory.map(({ film, watchedAt }) => (
                      <li
                        key={`${film.id}-${watchedAt}`}
                        className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#0a0a0a] p-3"
                      >
                        <Link href={`/browse?watch=${film.id}`} className="shrink-0">
                          <img
                            src={film.posterUrl}
                            alt={film.title}
                            className="h-16 w-11 rounded object-cover"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/browse?watch=${film.id}`}
                            className="font-medium hover:text-[#ff7a18]"
                          >
                            {film.title}
                          </Link>
                          <p className="text-xs capitalize text-[#666]">
                            {film.category} · {film.duration}m · ⭐ {film.rating.toFixed(1)}
                          </p>
                          <p className="text-xs text-[#555]">
                            Watched {formatRelativeTime(watchedAt)}
                            {historyProgress[film.id] > 0 &&
                              historyProgress[film.id] < 95 &&
                              ` · ${historyProgress[film.id]}% complete`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {section === "security" && (
              <>
                <section className="rounded-2xl border border-[#222] bg-[#111] p-6">
                  <h2 className="text-lg font-bold">Password</h2>
                  <form onSubmit={changePassword} className="mt-4 space-y-4">
                    <FormField id="current-password" label="Current password">
                      <input
                        id="current-password"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className={inputClassName}
                        autoComplete="current-password"
                      />
                    </FormField>
                    <FormField id="new-password" label="New password">
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          className={inputClassName}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormField>
                    <FormField id="confirm-new-password" label="Confirm new password">
                      <input
                        id="confirm-new-password"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className={inputClassName}
                        autoComplete="new-password"
                      />
                    </FormField>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="rounded-lg border border-[#444] px-5 py-2.5 text-sm font-bold hover:bg-white/5 disabled:opacity-50"
                    >
                      {passwordLoading ? "Updating..." : "Change password"}
                    </button>
                  </form>
                </section>

                <section className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-400" />
                    <h2 className="text-lg font-bold text-red-300">Delete account</h2>
                  </div>
                  <p className="mt-2 text-sm text-[#888]">
                    Permanently delete your account and all associated data.
                  </p>
                  <form onSubmit={deleteAccount} className="mt-4 space-y-4">
                    <FormField id="delete-password" label="Current password">
                      <input
                        id="delete-password"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        required
                        className={inputClassName}
                        autoComplete="current-password"
                      />
                    </FormField>
                    <FormField
                      id="delete-confirm"
                      label='Type "DELETE" to confirm'
                    >
                      <input
                        id="delete-confirm"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        required
                        placeholder="DELETE"
                        className={inputClassName}
                      />
                    </FormField>
                    <button
                      type="submit"
                      disabled={deleteLoading || deleteConfirm !== "DELETE"}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold hover:bg-red-500 disabled:opacity-50"
                    >
                      {deleteLoading ? "Deleting..." : "Delete my account"}
                    </button>
                  </form>
                </section>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="mt-10 text-sm text-[#666] hover:text-red-400"
        >
          Log out
        </button>
      </main>
    </div>
  );
}

export function AccountPage() {
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
          <AccountContent />
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
