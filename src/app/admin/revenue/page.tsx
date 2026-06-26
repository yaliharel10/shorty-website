"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Download,
  Clock,
  Eye,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminInputClass, adminLabelClass } from "@/components/admin/AdminShell";
import { formatWatchDuration } from "@/lib/payout";

type FilmRow = {
  filmId: string;
  title: string;
  durationMinutes: number;
  viewCount: number;
  uniqueViewers: number;
  totalWatchSeconds: number;
  avgWatchSeconds: number;
  watchSharePercent: number;
  estimatedPayout: number;
};

type RevenueData = {
  period: number | "all";
  summary: {
    mrr: number;
    activeSubscribers: number;
    creatorPoolPercent: number;
    creatorPoolAmount: number;
    totalWatchSeconds: number;
    totalWatchHours: number;
    totalViews: number;
    byTier: { basic: number; standard: number; premium: number };
  };
  films: FilmRow[];
};

const PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export default function AdminRevenuePage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [poolPercent, setPoolPercent] = useState(50);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/revenue?period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setPoolPercent(json.summary?.creatorPoolPercent ?? 50);
      })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const savePool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/revenue", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorPoolPercent: poolPercent }),
    });
    setSaving(false);
    setSaved(true);
    load();
  };

  const exportCsv = (type: "summary" | "raw") => {
    window.location.href = `/api/admin/analytics/export?type=${type}&period=${period}`;
  };

  if (loading || !data) {
    return (
      <AdminShell title="Revenue & Payouts">
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      </AdminShell>
    );
  }

  const { summary, films } = data;

  return (
    <AdminShell title="Revenue & Payouts">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#888]">
          Track subscription revenue and allocate creator payouts by watch time.
          View duration is recorded server-side only — not shown to viewers.
        </p>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                period === p.value
                  ? "bg-[#ff7a18]/15 font-bold text-[#ff7a18]"
                  : "border border-[#333] text-[#888] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: DollarSign, label: "Monthly revenue (MRR)", value: `$${summary.mrr.toFixed(2)}` },
          { icon: Users, label: "Active subscribers", value: summary.activeSubscribers },
          { icon: Eye, label: "Views in period", value: summary.totalViews.toLocaleString() },
          { icon: Clock, label: "Total watch time", value: `${summary.totalWatchHours}h` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-[#222] bg-[#111] p-5">
            <Icon className="mb-2 h-5 w-5 text-[#ff7a18]" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[#666]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={savePool}
          className="rounded-xl border border-[#222] bg-[#111] p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Percent className="h-5 w-5 text-[#ff7a18]" />
            <h2 className="font-bold">Creator payout pool</h2>
          </div>
          <p className="mb-4 text-sm text-[#888]">
            Set what share of MRR goes to filmmakers. Payouts below are estimated
            by each film&apos;s share of total watch seconds in this period.
          </p>
          <label className={adminLabelClass}>Pool percentage of MRR</label>
          <div className="flex gap-3">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={poolPercent}
              onChange={(e) => setPoolPercent(Number(e.target.value))}
              className={adminInputClass}
            />
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-lg bg-[#ff7a18] px-5 py-2 text-sm font-bold hover:bg-[#ff9533] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          {saved && (
            <p className="mt-2 text-xs text-green-400">Settings saved</p>
          )}
          <div className="mt-4 rounded-lg bg-[#0a0a0a] p-4">
            <p className="text-xs uppercase tracking-wider text-[#666]">Estimated pool</p>
            <p className="text-2xl font-bold text-[#ff7a18]">
              ${summary.creatorPoolAmount.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-[#555]">
              {summary.creatorPoolPercent}% of ${summary.mrr.toFixed(2)} MRR
            </p>
          </div>
        </form>

        <div className="rounded-xl border border-[#222] bg-[#111] p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#ff7a18]" />
            <h2 className="font-bold">Subscription breakdown</h2>
          </div>
          <div className="space-y-3">
            {(["basic", "standard", "premium"] as const).map((tier) => (
              <div
                key={tier}
                className="flex items-center justify-between rounded-lg bg-[#0a0a0a] px-4 py-3 text-sm"
              >
                <span className="capitalize text-[#888]">{tier}</span>
                <span className="font-bold">{summary.byTier[tier]} subscribers</span>
              </div>
            ))}
          </div>
          <Link
            href="/admin/subscriptions"
            className="mt-4 inline-block text-sm text-[#ff7a18] hover:underline"
          >
            View subscriber list →
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Watch analytics by film</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportCsv("summary")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#333] px-4 py-2 text-sm hover:border-[#ff7a18]"
          >
            <Download className="h-4 w-4" />
            Export summary CSV
          </button>
          <button
            type="button"
            onClick={() => exportCsv("raw")}
            className="inline-flex items-center gap-2 rounded-lg border border-[#333] px-4 py-2 text-sm hover:border-[#ff7a18]"
          >
            <Download className="h-4 w-4" />
            Export raw views CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#222]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111] text-xs uppercase tracking-wider text-[#666]">
            <tr>
              <th className="px-6 py-4">Film</th>
              <th className="px-6 py-4">Views</th>
              <th className="px-6 py-4">Unique viewers</th>
              <th className="px-6 py-4">Watch time</th>
              <th className="px-6 py-4">Avg session</th>
              <th className="px-6 py-4">Share</th>
              <th className="px-6 py-4">Est. payout</th>
            </tr>
          </thead>
          <tbody>
            {films.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#666]">
                  No view data in this period yet
                </td>
              </tr>
            ) : (
              films.map((f) => (
                <tr key={f.filmId} className="border-t border-[#222] bg-[#0a0a0a]">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/films/${f.filmId}`}
                      className="font-medium hover:text-[#ff7a18]"
                    >
                      {f.title}
                    </Link>
                    <p className="text-xs text-[#555]">{f.durationMinutes} min</p>
                  </td>
                  <td className="px-6 py-4">{f.viewCount.toLocaleString()}</td>
                  <td className="px-6 py-4">{f.uniqueViewers.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {formatWatchDuration(f.totalWatchSeconds)}
                  </td>
                  <td className="px-6 py-4">
                    {formatWatchDuration(f.avgWatchSeconds)}
                  </td>
                  <td className="px-6 py-4">{f.watchSharePercent}%</td>
                  <td className="px-6 py-4 font-bold text-[#ff7a18]">
                    ${f.estimatedPayout.toFixed(2)}
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
