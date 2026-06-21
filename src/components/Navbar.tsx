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
  User,
} from "lucide-react";
import { cn, avatarUrl, CATEGORIES } from "@/lib/utils";
import { useScrollY } from "@/hooks/useUI";
import { useAuth } from "./AuthProvider";

type NavbarProps = {
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onShowFavorites: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onGoHome: () => void;
  showingFavorites?: boolean;
  onOpenSubscribe?: () => void;
};

export function Navbar({
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  onShowFavorites,
  onOpenAuth,
  onOpenProfile,
  onGoHome,
  showingFavorites,
  onOpenSubscribe,
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
              {CATEGORIES.slice(0, 5).map((cat) => (
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
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition",
                  showingFavorites
                    ? "font-bold text-[#ff7a18]"
                    : "text-[#aaa] hover:text-white"
                )}
              >
                <Heart className={cn("h-4 w-4", showingFavorites && "fill-[#ff7a18]")} />
                My List
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
              <Link
                href="/subscription"
                className="rounded-lg px-3 py-1.5 text-sm text-[#aaa] transition hover:text-white"
              >
                Plans
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search films & people... (F)"
                className="w-48 rounded-full border border-[#333] bg-[#1a1a1a]/80 py-2 pl-9 pr-4 text-sm text-white outline-none transition focus:border-[#ff7a18] focus:ring-1 focus:ring-[#ff7a18]/30 md:w-64"
              />
            </div>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full glass px-2 py-1.5 transition hover:bg-white/10"
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
                    <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[#333] bg-[#111] shadow-xl animate-fade-in">
                      <div className="border-b border-[#222] px-4 py-3">
                        <p className="text-sm font-medium">
                          {user.displayName || user.username}
                        </p>
                        {user.displayName && (
                          <p className="text-xs text-[#666]">@{user.username}</p>
                        )}
                        <p className="truncate text-xs text-[#666]">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-[#ccc] transition hover:bg-[#222]"
                      >
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </button>
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-[#ccc] transition hover:bg-[#222]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Account & Password
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-3 text-sm text-[#ccc] transition hover:bg-[#222]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search films & people..."
                className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#ff7a18]"
              />
            </div>
            <p className="mb-3 text-xs font-bold tracking-widest text-[#555]">
              BROWSE
            </p>
            {CATEGORIES.map((cat) => (
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
            <Link
              href="/subscription"
              className="mt-2 block rounded-lg px-4 py-3 text-sm text-[#bbb] transition hover:bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              Plans & Pricing
            </Link>
            {user && !user.hasStreamingAccess && onOpenSubscribe && (
              <button
                onClick={() => {
                  onOpenSubscribe();
                  setMenuOpen(false);
                }}
                className="mt-2 block w-full rounded-lg bg-[#ff7a18] px-4 py-3 text-left text-sm font-bold"
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
