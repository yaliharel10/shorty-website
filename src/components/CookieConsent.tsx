"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "shorty_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#333] bg-[#111]/95 p-4 backdrop-blur md:p-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[#bbb]">
          Shorty uses essential cookies for sign-in and optional analytics to improve the
          service. See our{" "}
          <Link href="/cookies" className="text-[#ff7a18] hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-lg bg-[#ff7a18] px-5 py-2.5 text-sm font-bold hover:bg-[#ff9533]"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
