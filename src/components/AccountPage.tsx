"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider, useToast } from "@/components/Toast";
import { FormField, inputClassName } from "@/components/FormField";
import { getPlan, trialDaysRemaining } from "@/lib/subscription";

type AccountStats = {
  favorites: number;
  ratings: number;
  views: number;
};

function AccountContent() {
  const { user, loading: authLoading, refresh, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/?signin=1");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setPhotoUrl(user.photoUrl || "");
    fetch("/api/account")
      .then((r) => r.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.memberSince) setMemberSince(data.memberSince);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, photoUrl }),
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

  if (authLoading || !user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  const plan = getPlan(user.subscriptionTier);
  const trialDays = user.trialEndsAt ? trialDaysRemaining(new Date(user.trialEndsAt)) : 0;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/browse" className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <Link href="/browse" className="text-sm text-[#888] hover:text-white">
            Back to Browse
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="mt-2 text-[#888]">{user.email}</p>

        <section className="mt-8 rounded-2xl border border-[#222] bg-[#111] p-6">
          <h2 className="text-lg font-bold">Membership</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[#666]">Status</p>
              <p className="font-medium">{user.accessLabel}</p>
            </div>
            {plan && user.subscriptionStatus === "active" && (
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
            {memberSince && (
              <div>
                <p className="text-[#666]">Member since</p>
                <p className="font-medium">
                  {new Date(memberSince).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          {stats && (
            <p className="mt-4 text-xs text-[#555]">
              {stats.views} views · {stats.favorites} saved · {stats.ratings} ratings
            </p>
          )}
          <Link
            href="/subscription"
            className="mt-4 inline-block text-sm font-bold text-[#ff7a18] hover:underline"
          >
            Manage subscription →
          </Link>
        </section>

        <section className="mt-8 rounded-2xl border border-[#222] bg-[#111] p-6">
          <h2 className="text-lg font-bold">Profile</h2>
          <form onSubmit={saveProfile} className="mt-4 space-y-4">
            <FormField id="account-username" label="Username">
              <input
                id="account-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={inputClassName}
              />
            </FormField>
            <FormField id="account-photo" label="Avatar URL">
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

        <section className="mt-8 rounded-2xl border border-[#222] bg-[#111] p-6">
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="mt-8 text-sm text-[#666] hover:text-red-400"
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
