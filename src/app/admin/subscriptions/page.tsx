"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Users, TrendingUp, Sparkles } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPlan } from "@/lib/subscription";

type SubStats = {
  totalUsers: number;
  activeSubscribers: number;
  trialing: number;
  withStreamingAccess: number;
  mrr: number;
  byTier: { basic: number; standard: number; premium: number };
};

type Subscriber = {
  id: string;
  username: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  hasStreamingAccess: boolean;
  planPrice: number;
};

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState<SubStats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setSubscribers(d.subscribers || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminShell title="Subscriptions">
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Subscriptions">
      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Total users", value: stats.totalUsers },
            { icon: CreditCard, label: "Active subscribers", value: stats.activeSubscribers },
            { icon: Sparkles, label: "On free trial", value: stats.trialing },
            { icon: TrendingUp, label: "Est. MRR", value: `$${stats.mrr.toFixed(2)}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-[#222] bg-[#111] p-5">
              <Icon className="mb-2 h-5 w-5 text-[#ff7a18]" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-[#666]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="mb-8 flex flex-wrap gap-3">
          {(["basic", "standard", "premium"] as const).map((tier) => (
            <div
              key={tier}
              className="rounded-lg border border-[#222] bg-[#0a0a0a] px-4 py-2 text-sm"
            >
              <span className="capitalize text-[#888]">{tier}: </span>
              <span className="font-bold">{stats.byTier[tier]}</span>
              <span className="text-[#555]">
                {" "}
                (${getPlan(tier)?.price.toFixed(2)}/mo)
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#222]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111] text-xs uppercase tracking-wider text-[#666]">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Renews / ends</th>
              <th className="px-6 py-4">Access</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#666]">
                  No paid subscribers yet
                </td>
              </tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s.id} className="border-t border-[#222] bg-[#0a0a0a]">
                  <td className="px-6 py-4">
                    <p className="font-medium">{s.username}</p>
                    <p className="text-xs text-[#666]">{s.email}</p>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {s.subscriptionTier}
                    <span className="block text-xs text-[#555]">
                      ${s.planPrice.toFixed(2)}/mo
                    </span>
                  </td>
                  <td className="px-6 py-4 capitalize">{s.subscriptionStatus || "—"}</td>
                  <td className="px-6 py-4 text-xs text-[#666]">
                    {s.subscriptionEndsAt
                      ? new Date(s.subscriptionEndsAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        s.hasStreamingAccess
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {s.hasStreamingAccess ? "Active" : "Expired"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href="/admin/users"
                      className="text-xs text-[#ff7a18] hover:underline"
                    >
                      Manage in Users →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
