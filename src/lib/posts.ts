import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Post, PostMeta, CategoryInfo, TagInfo, SearchItem } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => getPostBySlug(file.replace(/\.md$/, "")))
    .filter((p): p is Post => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || "未命名",
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    tags: data.tags || [],
    categories: data.categories
      ? Array.isArray(data.categories)
        ? data.categories
        : [data.categories]
      : [],
    content,
    excerpt: extractExcerpt(content),
    abbrlink: data.abbrlink,
    visibility: data.visibility,
  };
}

export function getPublicPosts(): Post[] {
  return getAllPosts().filter((p) => !p.visibility || p.visibility !== "private");
}

export function getPostsMeta(): PostMeta[] {
  return getPublicPosts().map(({ content: _c, ...meta }) => ({
    ...meta,
    excerpt: meta.excerpt || "",
  }));
}

export function getCategories(): CategoryInfo[] {
  const map = new Map<string, number>();
  getPublicPosts().forEach((p) => {
    p.categories.forEach((c) => map.set(c, (map.get(c) || 0) + 1));
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getTags(): TagInfo[] {
  const map = new Map<string, number>();
  getPublicPosts().forEach((p) => {
    p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1));
  });
  const tags = Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return tags;
}

export function getPostsByCategory(category: string): Post[] {
  return getPublicPosts().filter((p) => p.categories.includes(category));
}

export function getPostsByTag(tag: string): Post[] {
  return getPublicPosts().filter((p) => p.tags.includes(tag));
}

export function getSearchData(): SearchItem[] {
  return getPublicPosts().map((p) => ({
    title: p.title,
    url: `/posts/${p.slug}`,
    text: stripMarkdown(p.content),
    tags: p.tags,
  }));
}

function extractExcerpt(content: string): string {
  const cleaned = stripMarkdown(content).trim();
  return cleaned.slice(0, 200) + (cleaned.length > 200 ? "..." : "");
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/>\s/g, "")
    .replace(/[-*+]\s/g, "")
    .replace(/\|\s/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/[#*`|>\-\[\]()!]/g, "");
}
