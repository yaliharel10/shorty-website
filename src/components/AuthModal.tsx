"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Modal } from "./Modal";
import { FormField, inputClassName } from "./FormField";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { fetchJsonWithRetry } from "@/lib/server-wake";
import type { User } from "@/types";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultMode?: "login" | "register";
};

type AuthResponse = { user?: User; error?: string };

export function AuthModal({
  open,
  onClose,
  onSuccess,
  defaultMode = "login",
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { setUser } = useAuth();

  useEffect(() => {
    if (open) {
      setIsLogin(defaultMode === "login");
      setError("");
      setLoadingHint("");
    }
  }, [open, defaultMode]);

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

    try {
      const { res, data } = await fetchJsonWithRetry<AuthResponse>(
        "/api/auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isLogin
              ? { action: "login", identifier, password }
              : { action: "register", username: identifier, email, password }
          ),
        },
        {
          onProgress: setLoadingHint,
        }
      );

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.user) {
        setUser(data.user);
      }

      setLoadingHint("Success! Redirecting...");
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "Server is still waking up. Please wait a few seconds — it should connect automatically on the next try."
        );
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
      setLoadingHint("");
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
            autoComplete={isLogin ? "username" : "username"}
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
