"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SITE } from "@/lib/constants";
import { useSearch } from "@/contexts/SearchContext";

interface SearchItem {
  title: string;
  url: string;
  text: string;
  tags: string[];
}

export default function SearchOverlay() {
  const { isOpen, closeSearch } = useSearch();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (loadedRef.current || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${SITE.basePath}/search.json`);
      const json = await res.json();
      setData(json);
      loadedRef.current = true;
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      loadData();
    } else {
      setQuery("");
    }
  }, [isOpen, loadData]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeSearch();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeSearch]);

  const filtered =
    data && query.trim()
      ? data
          .filter(
            (p) =>
              p.title.toLowerCase().includes(query.toLowerCase()) ||
              p.text.toLowerCase().includes(query.toLowerCase()) ||
              p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
          )
          .slice(0, 10)
      : null;

  return (
    <div
      className={`search-overlay${isOpen ? " active" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearch();
      }}
    >
      <div className="search-modal">
        <div className="search-header">
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
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索文章..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-close" onClick={closeSearch} aria-label="关闭">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="search-results">
          {!data && !loading && (
            <p className="search-hint">输入关键词搜索文章</p>
          )}
          {loading && <p className="search-hint">搜索数据加载中...</p>}
          {data && !query.trim() && (
            <p className="search-hint">输入关键词搜索文章</p>
          )}
          {filtered && filtered.length === 0 && (
            <p className="search-none">没有找到相关文章</p>
          )}
          {filtered &&
            filtered.map((item, i) => {
              const idx = item.text.toLowerCase().indexOf(query.toLowerCase());
              const excerpt =
                idx >= 0
                  ? item.text.slice(Math.max(0, idx - 30), idx + 120) + "..."
                  : item.text.slice(0, 120) + "...";
              return (
                <a
                  key={i}
                  className="search-item"
                  href={`${SITE.basePath}${item.url}`}
                  onClick={closeSearch}
                >
                  <strong>{item.title}</strong>
                  <span>{excerpt}</span>
                </a>
              );
            })}
        </div>
      </div>
    </div>
  );
}
