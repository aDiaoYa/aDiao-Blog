"use client";

import { useState, useEffect, useRef } from "react";
import type { CategoryInfo } from "@/types";

/** 文章列表分类筛选（客户端交互，CSS 控制显隐） */
export default function CategoryFilter({
  categories,
  totalCount,
}: {
  categories: CategoryInfo[];
  totalCount: number;
}) {
  const [active, setActive] = useState("all");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll<HTMLElement>(".waterfall-card");
    cards.forEach((card) => {
      const cardCat = card.dataset.category || "";
      if (active === "all" || cardCat === active) {
        card.style.display = "";
        card.style.opacity = "1";
        card.style.transform = "";
      } else {
        card.style.opacity = "0";
        card.style.transform = "scale(0.95)";
        setTimeout(() => {
          card.style.display = "none";
        }, 200);
      }
    });
  }, [active]);

  if (categories.length <= 1) return null;

  return (
    <div ref={containerRef}>
      <nav className="category-filter" aria-label="分类筛选">
        <button
          className={`cat-chip${active === "all" ? " active" : ""}`}
          onClick={() => setActive("all")}
        >
          全部
          <span className="cat-count">{totalCount}</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`cat-chip${active === cat.name ? " active" : ""}`}
            onClick={() => setActive(cat.name)}
          >
            {cat.name}
            <span className="cat-count">{cat.count}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
