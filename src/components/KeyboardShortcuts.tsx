"use client";

import { useEffect } from "react";
import { useSearch } from "@/contexts/SearchContext";

/** 全局键盘快捷键：Ctrl+K 打开搜索 */
export default function KeyboardShortcuts() {
  const { openSearch } = useSearch();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openSearch]);

  return null;
}
