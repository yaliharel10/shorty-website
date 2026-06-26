"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "./Modal";
import { FormField, inputClassName } from "./FormField";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { loginTimeoutMs } from "@/lib/hosting";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
  redirectTo?: string;
};

const LOGIN_TIMEOUT_MS = loginTimeoutMs();

export function AuthModal({
  open,
  onClose,
  defaultMode = "login",
  redirectTo = "/browse",
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setIsLogin(defaultMode === "login");
      setError("");
      setLoadingHint("");
      fetch("/api/health", { cache: "no-store" }).catch(() => {});
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open, defaultMode]);

  useEffect(() => {
    if (!loading) return;
    const slow = setTimeout(
      () => setLoadingHint("Still connecting — first sign-in can take a few seconds"),
      4000
    );
    const stuck = setTimeout(() => {
      abortRef.current?.abort();
      setLoading(false);
      setLoadingHint("");
      setError(
        "Sign-in timed out. Confirm you're on https://shorty-website-five.vercel.app and try again."
      );
    }, LOGIN_TIMEOUT_MS + 1000);
    return () => {
      clearTimeout(slow);
      clearTimeout(stuck);
    };
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLoadingHint("Signing in...");

    const form = new FormData(e.currentTarget);
    const identifier = (form.get("identifier") as string).trim();
    const email = (form.get("email") as string).trim();
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (!isLogin && password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      setLoadingHint("");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify(
          isLogin
            ? { action: "login", identifier, password }
            : { action: "register", username: identifier, email, password }
        ),
      });

      let data: { user?: unknown; error?: string };
      try {
        data = await res.json();
      } catch {
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            "Site access is blocked — disable Vercel Deployment Protection in project settings"
          );
        }
        if (res.status === 502 || res.status === 503) {
          throw new Error(
            "Server unavailable — use https://shorty-website-five.vercel.app (wrong URL returns 502)"
          );
        }
        throw new Error(`Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Full-page navigation — reliably commits cookie and never leaves UI stuck.
      window.location.assign(redirectTo);
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out — check your connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setLoading(false);
      setLoadingHint("");
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isLogin ? "Welcome back" : "Create your account"}
      description={
        isLogin
          ? "Sign in to save films, rate titles, and continue watching."
          : "Join Shorty to build your list and track what you watch."
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          id="auth-identifier"
          label={isLogin ? "Username or email" : "Username"}
          hint={!isLogin ? "Letters, numbers, and underscores only" : undefined}
        >
          <input
            id="auth-identifier"
            name="identifier"
            required
            autoComplete="username"
            className={inputClassName}
            placeholder={isLogin ? "Username or email" : "Choose a username"}
            disabled={loading}
          />
        </FormField>

        {!isLogin && (
          <FormField id="auth-email" label="Email address">
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={inputClassName}
              placeholder="you@example.com"
              disabled={loading}
            />
          </FormField>
        )}

        <FormField
          id="auth-password"
          label="Password"
          hint={!isLogin ? "At least 8 characters with a letter and number" : undefined}
        >
          <div className="relative">
            <input
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className={inputClassName}
              placeholder="Password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {!isLogin && <PasswordStrengthMeter password={password} />}
        </FormField>

        {isLogin && (
          <div className="-mt-2 text-right">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-[#888] hover:text-[#ff7a18] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {!isLogin && (
          <FormField id="auth-confirm" label="Confirm password">
            <input
              id="auth-confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClassName}
              placeholder="Confirm password"
              disabled={loading}
            />
          </FormField>
        )}

        {loadingHint && (
          <p className="text-center text-xs text-[#888]">{loadingHint}</p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#ff7a18] py-3 text-sm font-bold transition hover:bg-[#ff9533] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a18] disabled:opacity-50"
        >
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#888]">
        {isLogin ? "New to Shorty?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="font-bold text-[#ff7a18] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a18]"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />
    </Modal>
  );
}
