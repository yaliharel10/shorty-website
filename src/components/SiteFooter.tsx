import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#222] px-6 py-10 text-sm text-[#666]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-extrabold text-white">
            Shorty<span className="text-[#ff7a18]">.</span>
          </p>
          <p className="mt-2 max-w-xs text-[#888]">
            Premium short films — curated stories under 25 minutes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#555]">
              Explore
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/browse" className="transition hover:text-white">
                  Browse films
                </Link>
              </li>
              <li>
                <Link href="/browse/people" className="transition hover:text-white">
                  People
                </Link>
              </li>
              <li>
                <Link href="/subscription" className="transition hover:text-white">
                  Plans & pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#555]">
              Account
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/?signin=1" className="transition hover:text-white">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/account" className="transition hover:text-white">
                  Account settings
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#555]">
              Legal
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="transition hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/help" className="transition hover:text-white">
                  Help
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-[#444]">
        © {new Date().getFullYear()} Shorty. Demo streaming platform — portfolio project, not
        affiliated with Netflix.
        {" · "}
        <Link href="/health" className="hover:text-[#666]">
          Status
        </Link>
      </p>
    </footer>
  );
}
