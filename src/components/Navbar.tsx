"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Menu,
  X,
  LogOut,
  Settings,
  Heart,
  LayoutDashboard,
  SlidersHorizontal,
  User,
  CreditCard,
} from "lucide-react";
import { cn, avatarUrl, NAV_CATEGORIES } from "@/lib/utils";
import { useScrollY } from "@/hooks/useUI";
import { useAuth } from "./AuthProvider";
import { SearchInput } from "@/components/SearchInput";
import { NotificationBell } from "@/components/NotificationBell";

type NavbarProps = {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onShowFavorites: () => void;
  onOpenAuth: () => void;
  onGoHome: () => void;
  showingFavorites?: boolean;
  onOpenSubscribe?: () => void;
  favoriteCount?: number;
  filterCount?: number;
  onOpenFilters?: () => void;
  onPickFilm?: (id: string) => void;
  onPickPerson?: (slug: string) => void;
};

export function Navbar({
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  onShowFavorites,
  onOpenAuth,
  onGoHome,
  showingFavorites,
  onOpenSubscribe,
  favoriteCount = 0,
  filterCount = 0,
  onOpenFilters,
  onPickFilm,
  onPickPerson,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const scrolled = useScrollY(20);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 z-50 w-full px-4 py-3 transition-all duration-300 md:px-8 lg:px-12",
          scrolled
            ? "nav-scrolled py-3"
            : "bg-gradient-to-b from-black/80 to-transparent py-4"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              className="rounded-lg p-1 transition hover:bg-white/10 md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={onGoHome}
              className="text-2xl font-extrabold tracking-tight transition hover:opacity-80"
            >
              Shorty<span className="text-[#ff7a18]">.</span>
            </button>
            <div className="hidden items-center gap-0.5 lg:flex">
              {NAV_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm transition",
                    activeCategory === cat.id && !showingFavorites
                      ? "font-bold text-white"
                      : "text-[#aaa] hover:text-white"
                  )}
                >
                  {cat.label}
                </button>
              ))}
              <button
                onClick={onShowFavorites}
                className={cn(
                  "relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition",
                  showingFavorites
                    ? "font-bold text-[#ff7a18]"
                    : "text-[#aaa] hover:text-white"
                )}
              >
                <Heart className={cn("h-4 w-4", showingFavorites && "fill-[#ff7a18]")} />
                My List
                {favoriteCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-[#ff7a18] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {favoriteCount}
                  </span>
                )}
              </button>
              <Link
                href="/browse/people"
                className="rounded-lg px-3 py-1.5 text-sm text-[#aaa] transition hover:text-white"
              >
                People
              </Link>
              {user && !user.hasStreamingAccess && onOpenSubscribe && (
                <button
                  onClick={onOpenSubscribe}
                  className="rounded-lg bg-[#ff7a18] px-3 py-1.5 text-sm font-bold transition hover:bg-[#ff9533]"
                >
                  Subscribe
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenFilters && (
              <button
                type="button"
                onClick={onOpenFilters}
                className={cn(
                  "relative hidden items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition sm:inline-flex",
                  filterCount > 0
                    ? "border-[#ff7a18]/50 bg-[#ff7a18]/10 text-[#ff7a18]"
                    : "border-[#333] bg-[#1a1a1a]/80 text-[#aaa] hover:border-[#444] hover:text-white"
                )}
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden md:inline">Filters</span>
                {filterCount > 0 && (
                  <span className="rounded-full bg-[#ff7a18] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {filterCount}
                  </span>
                )}
              </button>
            )}
            <div className="relative hidden w-48 sm:block md:w-64">
              <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="Search films & people... (F)"
                onPickFilm={onPickFilm}
                onPickPerson={onPickPerson}
              />
            </div>

            {user ? (
              <div className="flex items-center gap-1">
                <NotificationBell />
                <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full glass px-2 py-1.5 transition hover:bg-white/10"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <Image
                    src={avatarUrl(user.username, user.photoUrl)}
                    alt={user.username}
                    width={32}
                    height={32}
                    className="rounded-full border border-[#ff7a18]/50"
                  />
                  <span className="hidden text-sm font-medium md:block">
                    {user.username}
                  </span>
                </button>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[#333] bg-[#111] shadow-xl animate-fade-in"
                    >
                      <div className="border-b border-[#222] px-4 py-3">
                        <p className="text-sm font-medium">
                          {user.displayName || user.username}
                        </p>
                        {user.displayName && (
                          <p className="text-xs text-[#666]">@{user.username}</p>
                        )}
                        <p className="truncate text-xs text-[#666]">{user.email}</p>
                      </div>
                      <Link
                        href="/subscription"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#ccc] transition hover:bg-[#222]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <CreditCard className="h-4 w-4" />
                        Manage Plan
                      </Link>
                      <Link
                        href="/account"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#ccc] transition hover:bg-[#222]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Manage Account
                      </Link>
                      <Link
                        href="/account?section=security"
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#ccc] transition hover:bg-[#222]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          className="flex items-center gap-2 px-4 py-3 text-sm text-[#ccc] transition hover:bg-[#222]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        role="menuitem"
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await logout();
                        }}
                        className="flex w-full items-center gap-2 border-t border-[#333] px-4 py-3 text-sm text-red-400 transition hover:bg-[#222]"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold shadow-lg shadow-[#ff7a18]/20 transition hover:bg-[#ff9533]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 animate-fade-in bg-[#0a0a0a] p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-xl font-extrabold">
                Shorty<span className="text-[#ff7a18]">.</span>
              </span>
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative mb-6">
              <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="Search films & people..."
                inputClassName="rounded-lg"
                onPickFilm={onPickFilm}
                onPickPerson={onPickPerson}
              />
            </div>
            <p className="mb-3 text-xs font-bold tracking-widest text-[#555]">
              BROWSE
            </p>
            {NAV_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onCategoryChange(cat.id);
                  setMenuOpen(false);
                }}
                className={cn(
                  "mb-1 block w-full rounded-lg px-4 py-3 text-left text-sm transition",
                  activeCategory === cat.id && !showingFavorites
                    ? "bg-[#ff7a18]/15 font-bold text-[#ff7a18]"
                    : "text-[#bbb] hover:bg-white/5"
                )}
              >
                {cat.label}
              </button>
            ))}
            <button
              onClick={() => {
                onShowFavorites();
                setMenuOpen(false);
              }}
              className={cn(
                "mt-2 block w-full rounded-lg px-4 py-3 text-left text-sm transition",
                showingFavorites
                  ? "bg-[#ff7a18]/15 font-bold text-[#ff7a18]"
                  : "text-[#bbb] hover:bg-white/5"
              )}
            >
              ❤️ My List
            </button>
            <Link
              href="/browse/people"
              className="mt-2 block rounded-lg px-4 py-3 text-sm text-[#bbb] transition hover:bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              People
            </Link>
            {user && (
              <>
                <p className="mb-3 mt-6 text-xs font-bold tracking-widest text-[#555]">
                  ACCOUNT
                </p>
                <Link
                  href="/subscription"
                  className="block rounded-lg px-4 py-3 text-sm text-[#bbb] transition hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Manage Plan
                </Link>
                <Link
                  href="/account"
                  className="block rounded-lg px-4 py-3 text-sm text-[#bbb] transition hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Manage Account
                </Link>
                <Link
                  href="/account?section=security"
                  className="block rounded-lg px-4 py-3 text-sm text-[#bbb] transition hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
              </>
            )}
            {user && !user.hasStreamingAccess && onOpenSubscribe && (
              <button
                onClick={() => {
                  onOpenSubscribe();
                  setMenuOpen(false);
                }}
                className="mt-4 block w-full rounded-lg bg-[#ff7a18] px-4 py-3 text-left text-sm font-bold"
              >
                Subscribe — from $1.99/mo
              </button>
            )}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="mt-4 block rounded-lg px-4 py-3 text-sm text-[#ff7a18]"
                onClick={() => setMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
