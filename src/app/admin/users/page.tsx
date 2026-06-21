"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Shield, User as UserIcon, Pencil } from "lucide-react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { AdminNav } from "@/components/AdminNav";
import { Modal } from "@/components/Modal";
import { FormField, inputClassName } from "@/components/FormField";
import { getPlan } from "@/lib/subscription";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  trialEndsAt: string | null;
  hasStreamingAccess: boolean;
  createdAt: string;
  _count: { favorites: number; ratings: number; views: number };
};

function AdminUsersContent() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      setError("Admin access required");
      setLoading(false);
      return;
    }
    loadUsers();
  }, [user, authLoading]);

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: newRole }),
    });
    loadUsers();
  };

  const handleDelete = async (id: string) => {
    if (id === user?.id) {
      alert("You cannot delete your own account");
      return;
    }
    if (!confirm("Delete this user?")) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadUsers();
  };

  const saveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const subscriptionTier = form.get("subscriptionTier") as string;
    const subscriptionStatus = form.get("subscriptionStatus") as string;
    const subscriptionEndsAt = (form.get("subscriptionEndsAt") as string) || null;
    const trialEndsAt = (form.get("trialEndsAt") as string) || null;
    const extendTrialDays = form.get("extendTrial") === "on" ? 7 : undefined;
    const clearSubscription = form.get("clearSubscription") === "on";

    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        subscriptionTier,
        subscriptionStatus: subscriptionStatus || null,
        subscriptionEndsAt: subscriptionEndsAt
          ? new Date(subscriptionEndsAt).toISOString()
          : null,
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
        extendTrialDays,
        clearSubscription: clearSubscription || undefined,
      }),
    });

    setSaving(false);
    setEditing(null);
    loadUsers();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808]">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="text-[#ff7a18]">Back to Shorty</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <AdminNav title="Manage Users & Accounts" backLabel="Admin" />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="overflow-x-auto rounded-xl border border-[#222]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] text-xs uppercase tracking-wider text-[#666]">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Access</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const plan = getPlan(u.subscriptionTier);
                return (
                  <tr key={u.id} className="border-t border-[#222] bg-[#0a0a0a]">
                    <td className="px-6 py-4">
                      <p className="font-medium">{u.username}</p>
                      <p className="text-xs text-[#666]">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                          u.role === "admin"
                            ? "bg-[#ff7a18]/20 text-[#ff7a18]"
                            : "bg-[#333] text-[#888]"
                        }`}
                      >
                        {u.role === "admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <UserIcon className="h-3 w-3" />
                        )}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {u.role === "admin" ? (
                        <span className="text-[#666]">Admin bypass</span>
                      ) : (
                        <>
                          <span className="capitalize font-medium">{u.subscriptionTier}</span>
                          {plan && u.subscriptionStatus === "active" && (
                            <span className="block text-[#555]">
                              ${plan.price.toFixed(2)}/mo
                            </span>
                          )}
                          {u.trialEndsAt && new Date(u.trialEndsAt) > new Date() && (
                            <span className="block text-[#ff7a18]">Trial active</span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${
                          u.hasStreamingAccess
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                      >
                        {u.hasStreamingAccess ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#666]">
                      {u._count.views} views · {u._count.favorites} favs
                    </td>
                    <td className="px-6 py-4 text-xs text-[#555]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(u)}
                          className="rounded border border-[#333] px-2 py-1 text-xs hover:bg-[#222]"
                          title="Edit account"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          className="rounded border border-[#333] px-2 py-1 text-xs hover:bg-[#222]"
                        >
                          {u.role === "admin" ? "Demote" : "Promote"}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={u.id === user?.id}
                          className="rounded border border-red-900/50 px-2 py-1 text-xs text-red-400 hover:bg-red-900/20 disabled:opacity-30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit account — ${editing?.username}`}
        size="md"
      >
        {editing && (
          <form onSubmit={saveUser} className="space-y-4">
            <p className="text-sm text-[#888]">{editing.email}</p>

            <FormField id="edit-tier" label="Subscription tier">
              <select
                id="edit-tier"
                name="subscriptionTier"
                defaultValue={editing.subscriptionTier}
                className={inputClassName}
              >
                <option value="none">None</option>
                <option value="basic">Basic ($1.99)</option>
                <option value="standard">Standard ($3.99)</option>
                <option value="premium">Premium ($5.99)</option>
              </select>
            </FormField>

            <FormField id="edit-status" label="Subscription status">
              <select
                id="edit-status"
                name="subscriptionStatus"
                defaultValue={editing.subscriptionStatus || ""}
                className={inputClassName}
              >
                <option value="">None</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
              </select>
            </FormField>

            <FormField id="edit-ends" label="Subscription ends">
              <input
                id="edit-ends"
                name="subscriptionEndsAt"
                type="datetime-local"
                defaultValue={
                  editing.subscriptionEndsAt
                    ? new Date(editing.subscriptionEndsAt).toISOString().slice(0, 16)
                    : ""
                }
                className={inputClassName}
              />
            </FormField>

            <FormField id="edit-trial" label="Trial ends">
              <input
                id="edit-trial"
                name="trialEndsAt"
                type="datetime-local"
                defaultValue={
                  editing.trialEndsAt
                    ? new Date(editing.trialEndsAt).toISOString().slice(0, 16)
                    : ""
                }
                className={inputClassName}
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm text-[#bbb]">
              <input type="checkbox" name="extendTrial" className="rounded" />
              Extend trial by 7 days
            </label>

            <label className="flex items-center gap-2 text-sm text-red-400">
              <input type="checkbox" name="clearSubscription" className="rounded" />
              Clear all subscription & trial data
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#ff7a18] py-3 text-sm font-bold hover:bg-[#ff9533] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthProvider>
      <AdminUsersContent />
    </AuthProvider>
  );
}
