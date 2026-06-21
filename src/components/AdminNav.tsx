"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/films", label: "Films" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
];

type AdminNavProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
};

export function AdminNav({
  title,
  backHref = "/admin",
  backLabel = "Dashboard",
}: AdminNavProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#222] px-6 py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={backHref}
            className="text-sm text-[#888] hover:text-white"
          >
            ← {backLabel}
          </Link>
          <h1 className="mt-1 text-xl font-bold">{title}</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition",
                pathname === link.href
                  ? "bg-[#ff7a18]/15 font-bold text-[#ff7a18]"
                  : "text-[#888] hover:bg-[#111] hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
