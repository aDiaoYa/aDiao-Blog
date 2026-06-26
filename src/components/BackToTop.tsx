"use client";

import { useEffect } from "react";

export default function BackToTop() {
  useEffect(() => {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;

    function handleScroll() {
      btn!.classList.toggle("visible", window.scrollY > 300);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      className="back-to-top"
      id="back-to-top"
      title="回到顶部"
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  );
}
