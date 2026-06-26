"use client";

import { useEffect } from "react";

export default function ReadingProgress() {
  useEffect(() => {
    function handleScroll() {
      const bar = document.getElementById("reading-progress");
      if (!bar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      bar.style.width = `${progress}%`;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div className="reading-progress" id="reading-progress" />;
}
