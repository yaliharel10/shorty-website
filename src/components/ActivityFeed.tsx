"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

type ActivityItem = {
  id: string;
  type: string;
  label: string;
  href: string | null;
  at: string;
};

export function ActivityFeed({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => (r.ok ? r.json() : { activity: [] }))
      .then((data) => setItems((data.activity ?? []).slice(0, limit)))
      .catch(() => setItems([]));
  }, [limit]);

  if (items.length === 0) return null;

  return (
    <section className="px-4 md:px-8 lg:px-12">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-[#ff7a18]" />
        <h2 className="text-lg font-bold">Your activity</h2>
      </div>
      <ul className="space-y-2 rounded-xl border border-[#222] bg-[#111] p-4">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-[#aaa]">
            {item.href ? (
              <Link href={item.href} className="transition hover:text-[#ff7a18]">
                {item.label}
              </Link>
            ) : (
              item.label
            )}
            <span className="ml-2 text-xs text-[#555]">
              {new Date(item.at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
