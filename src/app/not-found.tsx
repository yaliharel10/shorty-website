import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4 text-center">
      <p className="mb-2 text-6xl font-extrabold text-[#ff7a18]">404</p>
      <h1 className="mb-3 text-2xl font-bold">Page not found</h1>
      <p className="mb-8 max-w-md text-sm text-[#888]">
        This page doesn&apos;t exist or may have been moved. Head back to browse short films.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[#ff7a18] px-6 py-3 text-sm font-bold transition hover:bg-[#ff9533]"
      >
        Back to Shorty
      </Link>
    </div>
  );
}
