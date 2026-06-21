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
  ArrowLeft,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

type Stats = {
  stats: {
    userCount: number;
    filmCount: number;
    viewCount: number;
    favoriteCount: number;
    ratingCount: number;
  };
  recentViews: {
    id: string;
    createdAt: string;
    film: { title: string };
    user: { username: string } | null;
  }[];
  topFilms: {
    id: string;
    title: string;
    rating: number;
    _count: { views: number };
  }[];
  recentUsers: {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
  viewsChart: { date: string; count: number }[];
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <div className="mb-3 flex items-center gap-2 text-[#ff7a18]">
        <Icon className="h-5 w-5" />
        <span className="text-xs font-bold uppercase tracking-wider text-[#666]">
          {label}
        </span>
      </div>
      <p className="text-3xl font-extrabold">{value.toLocaleString()}</p>
    </div>
  );
}

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      setError("Admin access required");
      setLoading(false);
      return;
    }
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Forbidden");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808]">
        <p className="text-red-400">{error || "Access denied"}</p>
        <Link href="/" className="text-[#ff7a18] hover:underline">
          Back to Shorty
        </Link>
      </div>
    );
  }

  const maxViews = Math.max(...data.viewsChart.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-[#080808]">
      <header className="border-b border-[#222] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[#888] transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="text-xl font-bold">
              Shorty Admin
            </h1>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="font-bold text-[#ff7a18]">
              Dashboard
            </Link>
            <Link href="/admin/films" className="text-[#888] hover:text-white">
              Films
            </Link>
            <Link href="/admin/users" className="text-[#888] hover:text-white">
              Users
            </Link>
            <Link href="/admin/subscriptions" className="text-[#888] hover:text-white">
              Subscriptions
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={Users} label="Users" value={data.stats.userCount} />
          <StatCard icon={Film} label="Films" value={data.stats.filmCount} />
          <StatCard icon={Eye} label="Views" value={data.stats.viewCount} />
          <StatCard icon={Heart} label="Favorites" value={data.stats.favoriteCount} />
          <StatCard icon={Star} label="Ratings" value={data.stats.ratingCount} />
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
                    className="w-full rounded-t bg-[#ff7a18]/80 transition-all"
                    style={{
                      height: `${Math.max((day.count / maxViews) * 100, 4)}%`,
                      minHeight: day.count > 0 ? "8px" : "4px",
                    }}
                  />
                  <span className="text-[10px] text-[#555]">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#222] bg-[#111] p-6">
            <h2 className="mb-4 font-bold">Top Films</h2>
            <div className="space-y-3">
              {data.topFilms.map((film, i) => (
                <div
                  key={film.id}
                  className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#ff7a18]">
                      #{i + 1}
                    </span>
                    <span className="font-medium">{film.title}</span>
                  </div>
                  <div className="text-sm text-[#888]">
                    ⭐ {film.rating.toFixed(1)} · {film._count.views} views
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#222] bg-[#111] p-6">
            <h2 className="mb-4 font-bold">Recent Activity</h2>
            <div className="space-y-2">
              {data.recentViews.length === 0 ? (
                <p className="text-sm text-[#666]">No views yet</p>
              ) : (
                data.recentViews.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-4 py-2.5 text-sm"
                  >
                    <span>
                      <span className="text-[#ff7a18]">
                        {view.user?.username || "Guest"}
                      </span>{" "}
                      watched {view.film.title}
                    </span>
                    <span className="text-xs text-[#555]">
                      {new Date(view.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#222] bg-[#111] p-6">
            <h2 className="mb-4 font-bold">New Users</h2>
            <div className="space-y-2">
              {data.recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-4 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium">{u.username}</span>
                    <span className="ml-2 text-xs text-[#555]">{u.email}</span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      u.role === "admin"
                        ? "bg-[#ff7a18]/20 text-[#ff7a18]"
                        : "bg-[#333] text-[#888]"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  );
}
