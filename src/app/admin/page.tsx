"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Film,
  Eye,
  Heart,
  Star,
  TrendingUp,
  DollarSign,
  UserCheck,
  Clapperboard,
  Layers,
  Bell,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

type Stats = {
  stats: {
    userCount: number;
    filmCount: number;
    viewCount: number;
    favoriteCount: number;
    ratingCount: number;
    activeSubscribers: number;
    trialingUsers: number;
    estimatedMrr: number;
    personCount: number;
    collectionCount: number;
  };
  recentViews: { id: string; createdAt: string; film: { title: string }; user: { username: string } | null }[];
  topFilms: { id: string; title: string; rating: number; _count: { views: number } }[];
  recentUsers: { id: string; username: string; email: string; role: string; createdAt: string }[];
  viewsChart: { date: string; count: number }[];
};

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <div className="mb-3 flex items-center gap-2 text-[#ff7a18]">
        <Icon className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#666]">{label}</span>
      </div>
      <p className="text-3xl font-extrabold">{value.toLocaleString()}</p>
    </div>
  );
}

const quickLinks = [
  { href: "/admin/films", label: "Manage Films", icon: Film },
  { href: "/admin/people", label: "Manage People", icon: Clapperboard },
  { href: "/admin/collections", label: "Manage Collections", icon: Layers },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: DollarSign },
  { href: "/admin/notifications", label: "Send Notifications", icon: Bell },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <AdminShell title="Admin Dashboard">
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        </div>
      </AdminShell>
    );
  }

  const maxViews = Math.max(...data.viewsChart.map((d) => d.count), 1);

  return (
    <AdminShell title="Admin Dashboard">
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Users} label="Users" value={data.stats.userCount} />
        <StatCard icon={Film} label="Films" value={data.stats.filmCount} />
        <StatCard icon={Clapperboard} label="People" value={data.stats.personCount} />
        <StatCard icon={Layers} label="Collections" value={data.stats.collectionCount} />
        <StatCard icon={Eye} label="Views" value={data.stats.viewCount} />
        <StatCard icon={Heart} label="Favorites" value={data.stats.favoriteCount} />
        <StatCard icon={Star} label="Ratings" value={data.stats.ratingCount} />
        <StatCard icon={UserCheck} label="Subscribers" value={data.stats.activeSubscribers} />
        <StatCard icon={DollarSign} label="Est. MRR" value={data.stats.estimatedMrr} />
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#111] p-4 transition hover:border-[#ff7a18]/40 hover:bg-[#151515]"
          >
            <Icon className="h-5 w-5 text-[#ff7a18]" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#222] bg-[#111] p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#ff7a18]" />
            <h2 className="font-bold">Views (Last 7 Days)</h2>
          </div>
          <div className="flex h-40 items-end gap-2">
            {data.viewsChart.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[#ff7a18]/80"
                  style={{ height: `${Math.max((day.count / maxViews) * 100, 4)}%`, minHeight: day.count > 0 ? "8px" : "4px" }}
                />
                <span className="text-[10px] text-[#555]">{day.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#222] bg-[#111] p-6">
          <h2 className="mb-4 font-bold">Top Films</h2>
          <div className="space-y-3">
            {data.topFilms.map((film, i) => (
              <div key={film.id} className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#ff7a18]">#{i + 1}</span>
                  <Link href={`/admin/films/${film.id}`} className="font-medium hover:text-[#ff7a18]">
                    {film.title}
                  </Link>
                </div>
                <span className="text-sm text-[#888]">⭐ {film.rating.toFixed(1)} · {film._count.views} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#222] bg-[#111] p-6">
          <h2 className="mb-4 font-bold">Recent Activity</h2>
          <div className="space-y-2">
            {data.recentViews.map((view) => (
              <div key={view.id} className="rounded-lg bg-[#1a1a1a] px-4 py-2.5 text-sm">
                <span className="text-[#ff7a18]">{view.user?.username || "Guest"}</span> watched {view.film.title}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#111] p-6">
          <h2 className="mb-4 font-bold">New Users</h2>
          <div className="space-y-2">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-4 py-2.5 text-sm">
                <Link href="/admin/users" className="font-medium hover:text-[#ff7a18]">{u.username}</Link>
                <span className="text-xs text-[#555]">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
