"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "关于" },
  { href: "/home", label: "文章" },
  { href: "/archives", label: "归档" },
  { href: "/plan", label: "计划" },
  { href: "/news", label: "资讯" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) return null;

  function openSearch() {
    const fn = (window as unknown as Record<string, () => void>).__openSearch;
    fn?.();
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="aDiaoYa">
        <span className="brand-icon" aria-hidden="true">
          🐟
        </span>
        <span>
          <strong>aDiaoYa · 啊叼一只鱼</strong>
          <small>越努力越幸运的美少女</small>
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
          onClick={openSearch}
          title="搜索"
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
