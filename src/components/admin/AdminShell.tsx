"use client";

import Link from "next/link";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { AdminNav } from "@/components/AdminNav";

function AdminGate({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808] text-white">
        <p className="text-red-400">Admin access required</p>
        <Link href="/?signin=1" className="text-[#ff7a18] hover:underline">
          Sign in as admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <AdminNav title={title} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminGate title={title}>{children}</AdminGate>
    </AuthProvider>
  );
}

export const adminInputClass =
  "w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#ff7a18]";

export const adminLabelClass = "mb-1 block text-xs font-bold uppercase tracking-wider text-[#666]";
