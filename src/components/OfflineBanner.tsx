"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-[70] flex items-center justify-center gap-2 rounded-xl border border-[#333] bg-[#111]/95 px-4 py-3 text-sm text-[#ccc] shadow-xl backdrop-blur-md md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-[#ff7a18]" />
      You&apos;re offline. Some features may be unavailable.
    </div>
  );
}
