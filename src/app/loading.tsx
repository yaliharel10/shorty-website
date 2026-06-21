export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent"
          role="status"
          aria-label="Loading"
        />
        <p className="text-sm text-[#666]">Loading Shorty...</p>
      </div>
    </div>
  );
}
