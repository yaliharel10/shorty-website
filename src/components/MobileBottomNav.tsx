"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Heart, Home, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: Clapperboard },
  { href: "/browse?search=1", label: "Search", icon: Search, action: "search" as const },
  { href: "/browse?favorites=1", label: "My List", icon: Heart },
  { href: "/account", label: "Account", icon: User },
];

type MobileBottomNavProps = {
  onSearchFocus?: () => void;
};

export function MobileBottomNav({ onSearchFocus }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#222]/80 bg-[#080808]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {links.map(({ href, label, icon: Icon, action }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href.split("?")[0]) && href !== "/";

          if (action === "search") {
            return (
              <li key={href} className="flex-1">
                <button
                  type="button"
                  onClick={onSearchFocus}
                  className="flex w-full flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-[#888] transition hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              </li>
            );
          }

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition",
                  active ? "text-[#ff7a18]" : "text-[#888] hover:text-white"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-[#ff7a18]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
