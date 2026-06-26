"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminShell, adminInputClass, adminLabelClass } from "@/components/admin/AdminShell";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
  user: { username: string; email: string };
};

type UserOption = { id: string; username: string; email: string };

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [total, setTotal] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setTotal(d.total || 0);
      });
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  };

  useEffect(() => {
    load();
  }, []);

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const userId = String(form.get("userId") || "");
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId || undefined,
        type: form.get("type"),
        title: form.get("title"),
        body: form.get("body"),
        href: form.get("href") || null,
      }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setMessage(`Sent to ${data.sent} user(s)`);
      (e.target as HTMLFormElement).reset();
      load();
    } else {
      setMessage(data.error || "Send failed");
    }
  };

  const remove = async (id: string) => {
    await fetch("/api/admin/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <AdminShell title="Notifications">
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={send} className="space-y-4 rounded-xl border border-[#222] bg-[#111] p-6">
          <h2 className="font-bold">Send notification</h2>
          <div>
            <label className={adminLabelClass}>Recipient</label>
            <select name="userId" className={adminInputClass}>
              <option value="">All users (broadcast)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminLabelClass}>Type</label>
            <input name="type" defaultValue="announcement" required className={adminInputClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Title</label>
            <input name="title" required className={adminInputClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Message</label>
            <textarea name="body" required rows={3} className={adminInputClass} />
          </div>
          <div>
            <label className={adminLabelClass}>Link (optional)</label>
            <input name="href" placeholder="/browse" className={adminInputClass} />
          </div>
          {message && <p className="text-sm text-[#ff7a18]">{message}</p>}
          <button type="submit" disabled={sending} className="rounded-lg bg-[#ff7a18] px-6 py-3 font-bold disabled:opacity-50">
            {sending ? "Sending..." : "Send"}
          </button>
        </form>

        <div>
          <h2 className="mb-3 font-bold">Recent ({total} total)</h2>
          <ul className="max-h-[32rem] space-y-2 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id} className="rounded-lg border border-[#222] bg-[#111] p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-1 text-[#888]">{n.body}</p>
                    <p className="mt-2 text-xs text-[#555]">
                      {n.user.username} · {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button type="button" onClick={() => remove(n.id)} className="text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
