"use client";

import { useEffect, useRef } from "react";

export default function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      bar!.style.width = `${progress}%`;
    }

    window.addEventListener("scroll", update, { passive: true });

    // 监听内容变化（如图片加载导致高度变化）
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return <div className="reading-progress" ref={barRef} />;
}
