"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { SITE, NAV_ITEMS } from "@/lib/constants";
import { useSearch } from "@/contexts/SearchContext";

export default function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { openSearch } = useSearch();

  if (isLanding) return null;

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={SITE.shortName}>
        <span className="brand-icon" aria-hidden="true">
          {SITE.icon}
        </span>
        <span>
          <strong>{SITE.title}</strong>
          <small>{SITE.tagline}</small>
        </span>
      </Link>

      <nav className="site-nav" aria-label="主导航">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={isActive ? "active" : ""}>
              {label}
            </Link>
          );
        })}
        <button
          className="search-btn"
          onClick={() => openSearch()}
          title="搜索 (Ctrl+K)"
          aria-label="搜索文章"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <ThemeToggle />
      </nav>
    </header>
  );
}
