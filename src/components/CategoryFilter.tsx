"use client";

import { useState } from "react";
import type { CategoryInfo } from "@/types";

/** 文章列表分类筛选（客户端交互） */
export default function CategoryFilter({
  categories,
  totalCount,
}: {
  categories: CategoryInfo[];
  totalCount: number;
}) {
  const [active, setActive] = useState("all");

  function handleClick(cat: string) {
    setActive(cat);
    const cards = document.querySelectorAll<HTMLElement>(".waterfall-card");
    cards.forEach((card) => {
      const cardCat = card.dataset.category || "";
      if (cat === "all" || cardCat === cat) {
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
  }

  if (categories.length <= 1) return null;

  return (
    <nav className="category-filter" aria-label="分类筛选">
      <button
        className={`cat-chip${active === "all" ? " active" : ""}`}
        onClick={() => handleClick("all")}
      >
        全部
        <span className="cat-count">{totalCount}</span>
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          className={`cat-chip${active === cat.name ? " active" : ""}`}
          onClick={() => handleClick(cat.name)}
        >
          {cat.name}
          <span className="cat-count">{cat.count}</span>
        </button>
      ))}
    </nav>
  );
}
