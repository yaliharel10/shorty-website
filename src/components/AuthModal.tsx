"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "./Modal";
import { FormField, inputClassName } from "./FormField";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
  redirectTo?: string;
  initialError?: string;
};

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Invalid username or password",
  rate_limit: "Too many attempts — please wait a few minutes",
  server_error: "Something went wrong — please try again",
};

function warmAuthBackend() {
  return fetch("/api/health", { cache: "no-store" }).catch(() => {});
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 20000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function AuthModal({
  open,
  onClose,
  defaultMode = "login",
  redirectTo = "/browse",
  initialError = "",
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLogin(defaultMode === "login");
      setError(initialError);
      warmAuthBackend();
    }
  }, [open, defaultMode, initialError]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const identifier = (form.get("identifier") as string).trim();
    const email = (form.get("email") as string).trim();
    const passwordValue = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (passwordValue !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await warmAuthBackend();
      const res = await fetchWithTimeout(
        "/api/auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            action: "register",
            username: identifier,
            email,
            password: passwordValue,
          }),
        },
        20000
      );

      let data: { user?: unknown; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      window.location.replace(redirectTo);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Registration timed out — please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setLoading(false);
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
      {isLogin ? (
        <form
          action="/api/auth/signin"
          method="POST"
          className="flex flex-col gap-4"
          onSubmit={() => setLoading(true)}
        >
          <input type="hidden" name="redirect" value={redirectTo} />

          <FormField id="auth-identifier" label="Username or email">
            <input
              id="auth-identifier"
              name="identifier"
              required
              autoComplete="username"
              className={inputClassName}
              placeholder="Username or email"
              disabled={loading}
            />
          </FormField>

          <FormField id="auth-password" label="Password">
            <div className="relative">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="current-password"
                className={inputClassName}
                placeholder="Password"
                disabled={loading}
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
          </FormField>

          <div className="-mt-2 text-right">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-[#888] hover:text-[#ff7a18] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#ff7a18] py-3 text-sm font-bold transition hover:bg-[#ff9533] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
          <FormField
            id="auth-identifier"
            label="Username"
            hint="Letters, numbers, and underscores only"
          >
            <input
              id="auth-identifier"
              name="identifier"
              required
              autoComplete="username"
              className={inputClassName}
              placeholder="Choose a username"
              disabled={loading}
            />
          </FormField>

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

          <FormField
            id="auth-password"
            label="Password"
            hint="At least 8 characters with a letter and number"
          >
            <div className="relative">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
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
            <PasswordStrengthMeter password={password} />
          </FormField>

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

          {error && (
            <p role="alert" className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#ff7a18] py-3 text-sm font-bold transition hover:bg-[#ff9533] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-[#888]">
        {isLogin ? "New to Shorty?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="font-bold text-[#ff7a18] hover:underline"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </Modal>
  );
}

export function authErrorMessage(code: string | null) {
  if (!code) return "";
  return AUTH_ERRORS[code] ?? "Authentication failed";
}
