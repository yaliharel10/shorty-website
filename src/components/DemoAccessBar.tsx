import Link from "next/link";

type DemoAccessBarProps = {
  className?: string;
};

/** Shown on public pages so testers can sign in without hunting for credentials. */
export function DemoAccessBar({ className }: DemoAccessBarProps) {
  return (
    <div
      className={
        className ??
        "border-b border-[#222] bg-[#111] px-4 py-3 text-center text-sm md:px-8"
      }
    >
      <span className="text-[#888]">Full access demo: </span>
      <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#ddd]">
        demo
      </code>
      <span className="text-[#555]"> / </span>
      <code className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-xs text-[#ddd]">
        demo1234
      </code>
      <span className="mx-2 hidden text-[#444] sm:inline">·</span>
      <Link href="/demo" className="font-bold text-[#ff7a18] hover:underline">
        Instant demo login
      </Link>
      <span className="mx-2 hidden text-[#444] sm:inline">·</span>
      <Link href="/test" className="font-bold text-[#ff7a18] hover:underline">
        All test accounts
      </Link>
      <span className="mx-2 hidden text-[#444] md:inline">·</span>
      <Link href="/help" className="hidden text-[#666] hover:text-white md:inline">
        Help
      </Link>
    </div>
  );
}
