"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || user.emailVerified || user.role === "admin") return null;

  const resend = async () => {
    setLoading(true);
    await fetch("/api/auth/resend-verification", { method: "POST" });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="border-b border-amber-900/50 bg-amber-950/40 px-4 py-3 text-center text-sm text-amber-100">
      Verify your email to unlock streaming.{" "}
      <button
        type="button"
        onClick={resend}
        disabled={loading || sent}
        className="font-bold text-[#ff7a18] hover:underline disabled:opacity-50"
      >
        {sent ? "Email sent — check your inbox" : loading ? "Sending..." : "Resend verification"}
      </button>
    </div>
  );
}
