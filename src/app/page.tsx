import { Suspense } from "react";
import { LandingPage } from "@/components/LandingPage";

function LandingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingPage />
    </Suspense>
  );
}
