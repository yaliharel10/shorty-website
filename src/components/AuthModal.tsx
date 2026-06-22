"use client";

import { useActionState, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "./Modal";
import { FormField, inputClassName } from "./FormField";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import {
  loginAction,
  registerAction,
  type AuthActionState,
} from "@/app/actions/auth";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMode?: "login" | "register";
  redirectTo?: string;
};

const initialState: AuthActionState = {};

export function AuthModal({
  open,
  onClose,
  defaultMode = "login",
  redirectTo = "/browse",
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [clientError, setClientError] = useState("");

  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    initialState
  );
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    initialState
  );

  const pending = isLogin ? loginPending : registerPending;
  const actionError = isLogin ? loginState.error : registerState.error;
  const error = clientError || actionError || "";

  useEffect(() => {
    if (open) {
      setIsLogin(defaultMode === "login");
      setClientError("");
      fetch("/api/health", { cache: "no-store" }).catch(() => {});
    }
  }, [open, defaultMode]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError("");
    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (!isLogin && password !== confirm) {
      e.preventDefault();
      setClientError("Passwords do not match");
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
      <form
        action={isLogin ? loginFormAction : registerFormAction}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        noValidate
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />

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
            disabled={pending}
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
              disabled={pending}
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
              disabled={pending}
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
              disabled={pending}
            />
          </FormField>
        )}

        {pending && (
          <p className="text-center text-xs text-[#888]">Signing in...</p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#ff7a18] py-3 text-sm font-bold transition hover:bg-[#ff9533] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a18] disabled:opacity-50"
        >
          {pending ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#888]">
        {isLogin ? "New to Shorty?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setClientError("");
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
