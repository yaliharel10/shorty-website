"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.notifications ?? []);
    setUnread(data.unread ?? 0);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-[#aaa] transition hover:bg-white/10 hover:text-white"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff7a18] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#333] bg-[#111] shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
              <span className="text-sm font-bold">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-[#ff7a18] hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-[#666]">
                  No notifications yet
                </li>
              ) : (
                items.map((n) => (
                  <li key={n.id}>
                    {n.href ? (
                      <Link
                        href={n.href}
                        onClick={() => {
                          if (!n.read) markRead(n.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "block px-4 py-3 transition hover:bg-[#1a1a1a]",
                          !n.read && "bg-[#ff7a18]/5"
                        )}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 text-xs text-[#888]">{n.body}</p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.read && markRead(n.id)}
                        className={cn(
                          "block w-full px-4 py-3 text-left transition hover:bg-[#1a1a1a]",
                          !n.read && "bg-[#ff7a18]/5"
                        )}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 text-xs text-[#888]">{n.body}</p>
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
