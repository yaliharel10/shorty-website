"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider, useToast } from "@/components/Toast";
import { FormField, inputClassName } from "@/components/FormField";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Missing reset token. Request a new link from the sign-in page.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      setDone(true);
      toast(data.message, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#222] bg-[#111] p-8">
        <Link href="/" className="text-xl font-extrabold">
          Shorty<span className="text-[#ff7a18]">.</span>
        </Link>

        {done ? (
          <div className="mt-8">
            <h1 className="text-2xl font-bold">Password updated</h1>
            <p className="mt-3 text-sm text-[#888]">
              Your password has been reset. Sign in with your new password.
            </p>
            <button
              onClick={() => router.push("/?signin=1")}
              className="mt-6 w-full rounded-lg bg-[#ff7a18] py-3 text-sm font-bold hover:bg-[#ff9533]"
            >
              Sign in
            </button>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-2xl font-bold">Set a new password</h1>
            <p className="mt-2 text-sm text-[#888]">
              Choose a strong password with at least 8 characters.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <FormField
                id="new-password"
                label="New password"
                hint="At least 8 characters with a letter and number"
              >
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClassName}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>
              <FormField id="confirm-password" label="Confirm password">
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClassName}
                  autoComplete="new-password"
                />
              </FormField>
              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-lg bg-[#ff7a18] py-3 text-sm font-bold hover:bg-[#ff9533] disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-[#666]">
              <Link href="/?signin=1" className="text-[#ff7a18] hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#080808]">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
