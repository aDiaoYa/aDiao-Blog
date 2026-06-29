import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Post, PostMeta, CategoryInfo, TagInfo, SearchItem } from "@/types";
import { stripMarkdown, extractExcerpt, toUrlSafeSlug } from "@/lib/markdown";

// 优先读取 content/posts/，为空时回退到 source/_posts/（Legacy Hexo 文章）
const CANDIDATE_DIRS = [
  path.join(process.cwd(), "content", "posts"),
  path.join(process.cwd(), "source", "_posts"),
];

function resolvePostsDir(): string {
  for (const dir of CANDIDATE_DIRS) {
    if (fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith(".md"))) {
      return dir;
    }
  }
  // 都为空时返回主目录（让后续代码返回空数组，避免崩溃）
  return CANDIDATE_DIRS[0];
}

const POSTS_DIR = resolvePostsDir();

/** 缓存 slug → 真实文件名的映射（处理非 ASCII 文件名） */
let _slugFileMap: Map<string, string> | null = null;
function getSlugFileMap(): Map<string, string> {
  if (_slugFileMap) return _slugFileMap;
  _slugFileMap = new Map();
  if (!fs.existsSync(POSTS_DIR)) return _slugFileMap;
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const slug = toUrlSafeSlug(file);
    _slugFileMap.set(slug, file);
  }
  return _slugFileMap;
}

export function getAllPosts(): Post[] {
  const map = getSlugFileMap();
  const posts: Post[] = [];
  for (const [slug, file] of map.entries()) {
    const post = readPostFile(file, slug);
    if (post) posts.push(post);
  }
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function readPostFile(file: string, slug: string): Post | null {
  const filePath = path.join(POSTS_DIR, file);
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

export function getPostBySlug(slug: string): Post | null {
  const map = getSlugFileMap();
  const file = map.get(slug);
  if (!file) return null;
  return readPostFile(file, slug);
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
