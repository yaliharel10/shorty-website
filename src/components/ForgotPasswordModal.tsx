"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { FormField, inputClassName } from "./FormField";

type ForgotPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  defaultEmail?: string;
};

export function ForgotPasswordModal({
  open,
  onClose,
  defaultEmail = "",
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDevResetUrl(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setSuccess(data.message);
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Forgot password?"
      description="Enter your email and we'll send reset instructions."
      size="sm"
    >
      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-[#bbb]">{success}</p>
          {devResetUrl && (
            <div className="rounded-lg border border-[#333] bg-[#111] p-3 text-xs text-[#888]">
              <p className="mb-2 font-bold text-[#ff7a18]">Dev mode — reset link:</p>
              <a href={devResetUrl} className="break-all text-[#ff7a18] hover:underline">
                {devResetUrl}
              </a>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-[#ff7a18] py-3 text-sm font-bold hover:bg-[#ff9533]"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField id="forgot-email" label="Email address">
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClassName}
              placeholder="you@example.com"
            />
          </FormField>
          {error && (
            <p role="alert" className="text-center text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#ff7a18] py-3 text-sm font-bold hover:bg-[#ff9533] disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </Modal>
  );
}
