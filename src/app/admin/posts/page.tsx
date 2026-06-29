"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { listPosts, deletePost, getPostContent } from "@/lib/github";
import type { PostMeta } from "@/types";

interface PostWithMeta {
  slug: string;
  title: string;
  date: string;
  categories: string;
  tags: string[];
}

function parseFrontmatterTitle(content: string): PostWithMeta {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { slug: "", title: "", date: "", categories: "", tags: [] };
  const result: PostWithMeta = { slug: "", title: "", date: "", categories: "", tags: [] };
  let inTags = false;
  for (const line of match[1].split("\n")) {
    if (line.startsWith("title:")) {
      result.title = line.replace(/^title:\s*["']?/, "").replace(/["']$/, "").trim();
    } else if (line.startsWith("date:")) {
      result.date = line.replace("date:", "").trim().slice(0, 10);
    } else if (line.startsWith("categories:")) {
      result.categories = line.replace("categories:", "").trim();
    } else if (line.startsWith("tags:")) {
      inTags = true;
    } else if (inTags && line.trim().startsWith("-")) {
      result.tags.push(line.replace(/^\s*-\s*/, "").trim());
    } else {
      inTags = false;
    }
  }
  return result;
}

type TabKey = "all" | string;

const POSTS_CACHE_KEY = "admin_posts_cache";
const DELETED_SLUGS_KEY = "admin_deleted_slugs";

// ── 已删除文章标记（防止静态 JSON 缓存导致已删文章重新出现）──
function getDeletedSlugs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_SLUGS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markAsDeleted(slug: string): void {
  if (typeof window === "undefined") return;
  const deleted = getDeletedSlugs();
  deleted.add(slug);
  // 只保留最近 200 条删除记录
  const arr = Array.from(deleted).slice(-200);
  localStorage.setItem(DELETED_SLUGS_KEY, JSON.stringify(arr));
}

function loadPostsCache(): PostWithMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(POSTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePostsCache(posts: PostWithMeta[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts));
  } catch {
    // localStorage 满了则忽略
  }
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  const filterDeleted = useCallback((list: PostWithMeta[]): PostWithMeta[] => {
    const deleted = getDeletedSlugs();
    if (deleted.size === 0) return list;
    return list.filter((p) => !deleted.has(p.slug));
  }, []);

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    setError("");
    setFromCache(false);
    try {
      // 1. 优先从静态 posts-metadata.json 加载（生产环境零依赖）
      const metaRes = await fetch("/aDiao-Blog/posts-metadata.json");
      if (metaRes.ok) {
        const rawPosts: { title: string; slug: string; date: string; categories: string | string[]; tags: string[] }[] = await metaRes.json();
        let allPosts = rawPosts.map((p) => ({
          ...p,
          categories: Array.isArray(p.categories) ? p.categories.join(", ") : (p.categories || ""),
        }));
        // 过滤已删除文章
        allPosts = filterDeleted(allPosts);
        allPosts.sort((a, b) => b.date.localeCompare(a.date));
        setPosts(allPosts);
        savePostsCache(allPosts);
        setLoading(false);
        return;
      }

      // 2. 开发环境：从本地文件读取（确保刚保存的文章立即可见）
      let files: { name: string; content: string }[];
      try {
        const res = await fetch("/aDiao-Blog/api/local-list");
        if (res.ok) {
          files = await res.json();
        } else {
          throw new Error("本地列表不可用");
        }
      } catch {
        // 3. 回退到 GitHub API
        const githubFiles = await listPosts();
        const enriched = await Promise.all(
          githubFiles.filter((f) => f.name.endsWith(".md")).map(async (f) => {
            const slug = f.name.replace(/\.md$/, "");
            try {
              const { content } = await getPostContent(slug);
              return { name: f.name, content };
            } catch {
              return { name: f.name, content: "" };
            }
          })
        );
        files = enriched;
      }

      const mdFiles = files.filter((f) => f.name.endsWith(".md"));
      let enriched = mdFiles.map((f) => {
        const slug = f.name.replace(/\.md$/, "");
        const frontmatter = parseFrontmatterTitle(f.content);
        return { ...frontmatter, slug };
      });
      enriched = filterDeleted(enriched);
      enriched.sort((a, b) => b.date.localeCompare(a.date));
      setPosts(enriched);
      savePostsCache(enriched);
    } catch (e) {
      // API 全部失败时，降级使用 localStorage 缓存
      let cached = loadPostsCache();
      cached = filterDeleted(cached);
      if (cached.length > 0) {
        setPosts(cached);
        setFromCache(true);
      } else {
        setError((e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`确定要删除「${slug}」吗？此操作不可撤销。`)) return;
    let deleted = false;

    try {
      // 开发环境：同时删除本地文件
      const localRes = await fetch(`/aDiao-Blog/api/local-posts?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (localRes.ok) deleted = true;
    } catch {
      // 本地删除失败不影响 GitHub 操作
    }

    try {
      // GitHub 删除
      const { sha } = await getPostContent(slug);
      await deletePost(slug, sha);
      deleted = true;
    } catch (e) {
      if (!deleted) {
        alert("删除失败：" + (e as Error).message);
        return;
      }
      // 本地已删除但 GitHub 失败，提示用户
      alert("本地已删除，但 GitHub 同步失败：" + (e as Error).message);
    }

    // 标记为已删除（防止静态 JSON 缓存中重新出现）
    markAsDeleted(slug);
    // 从状态和缓存中移除
    setPosts((prev) => {
      const updated = prev.filter((p) => p.slug !== slug);
      savePostsCache(updated);
      return updated;
    });
  }

  // 同步文章到本地后跳转前台
  async function syncAndView(slug: string) {
    try {
      await fetch(`/aDiao-Blog/api/sync-posts?slug=${encodeURIComponent(slug)}`);
    } catch {
      // 同步失败也不影响跳转
    }
    window.open(`/aDiao-Blog/posts/${encodeURIComponent(slug)}`, "_blank");
  }

  // 同步所有文章到本地
  async function syncAll() {
    setSyncing(true);
    try {
      const res = await fetch("/aDiao-Blog/api/sync-posts", { method: "POST" });
      const data = await res.json();
      alert(data.message || "同步完成");
    } catch (e) {
      alert("同步失败：" + (e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  // 分类和标签统计
  const catMap = useMemo(() => {
    const map = new Map<string, PostWithMeta[]>();
    for (const post of posts) {
      const cat = post.categories || "未分类";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(post);
    }
    return map;
  }, [posts]);

  const tagMap = useMemo(() => {
    const map = new Map<string, PostWithMeta[]>();
    for (const post of posts) {
      const tags = post.tags.length > 0 ? post.tags : ["未分类"];
      for (const tag of tags) {
        if (!map.has(tag)) map.set(tag, []);
        map.get(tag)!.push(post);
      }
    }
    return map;
  }, [posts]);

  const categories = Array.from(catMap.keys());
  const allTags = Array.from(tagMap.keys());

  // 筛选后的文章列表
  const displayPosts = useMemo(() => {
    if (activeTab === "all") return posts;
    if (activeTab === "category" && selectedFilter) return catMap.get(selectedFilter) || [];
    if (activeTab === "tag" && selectedFilter) return tagMap.get(selectedFilter) || [];
    return posts;
  }, [activeTab, selectedFilter, posts, catMap, tagMap]);

  // 修改筛选器
  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    setSelectedFilter("");
  }

  return (
    <div className="admin-posts-page">
      <div className="admin-page-header">
        <h2>文章管理</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="admin-btn-secondary" onClick={syncAll} disabled={syncing}>
            {syncing ? "同步中…" : "从 GitHub 同步到本地"}
          </button>
          <Link href="/admin/posts/new" className="admin-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            写新文章
          </Link>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {fromCache && (
        <div className="admin-warning" style={{ marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          GitHub API 暂时不可用，显示的是本地缓存数据。请检查网络或重新登录。
        </div>
      )}

      {/* 标签页 */}
      <div className="admin-tabs">
        <button
          className={`admin-tab${activeTab === "all" ? " active" : ""}`}
          onClick={() => switchTab("all")}
        >
          全部文章
          <span className="admin-tab-count">{posts.length}</span>
        </button>
        <button
          className={`admin-tab${activeTab === "category" ? " active" : ""}`}
          onClick={() => switchTab("category")}
        >
          按分类
          <span className="admin-tab-count">{categories.length}</span>
        </button>
        <button
          className={`admin-tab${activeTab === "tag" ? " active" : ""}`}
          onClick={() => switchTab("tag")}
        >
          按标签
          <span className="admin-tab-count">{allTags.length}</span>
        </button>
      </div>

      {/* 分类/标签筛选下拉 */}
      {activeTab === "category" && (
        <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`admin-btn-sm${selectedFilter === cat ? "" : ""}`}
              onClick={() => setSelectedFilter(selectedFilter === cat ? "" : cat)}
              style={{
                borderColor: selectedFilter === cat ? "var(--admin-primary)" : undefined,
                color: selectedFilter === cat ? "var(--admin-primary)" : undefined,
                background: selectedFilter === cat ? "var(--admin-primary-light)" : undefined,
              }}
            >
              {cat} ({catMap.get(cat)?.length || 0})
            </button>
          ))}
        </div>
      )}
      {activeTab === "tag" && (
        <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {allTags.sort().map((tag) => (
            <button
              key={tag}
              className="admin-btn-sm"
              onClick={() => setSelectedFilter(selectedFilter === tag ? "" : tag)}
              style={{
                borderColor: selectedFilter === tag ? "var(--admin-primary)" : undefined,
                color: selectedFilter === tag ? "var(--admin-primary)" : undefined,
                background: selectedFilter === tag ? "var(--admin-primary-light)" : undefined,
              }}
            >
              {tag} ({tagMap.get(tag)?.length || 0})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="admin-loading">加载中…</div>
      ) : displayPosts.length === 0 ? (
        <div className="admin-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-border)", marginBottom: 16 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>{activeTab !== "all" ? "该分类下还没有文章" : "还没有文章，快去写第一篇吧"}</p>
          <Link href="/admin/posts/new" className="admin-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            创建第一篇文章
          </Link>
        </div>
      ) : (
        <div className="admin-posts-table-wrap">
          <table className="admin-posts-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>标签</th>
                <th>日期</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayPosts.map((post) => (
                <tr
                  key={post.slug}
                  className="admin-post-row"
                  onClick={() => syncAndView(post.slug)}
                >
                  <td>
                    <span className="post-title">{post.title || post.slug}</span>
                    <br />
                    <code>{post.slug}</code>
                  </td>
                  <td>{post.categories || "—"}</td>
                  <td>
                    {post.tags.length > 0
                      ? post.tags.map((t) => (
                          <code key={t} style={{ marginRight: 4 }}>{t}</code>
                        ))
                      : "—"}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{post.date || "—"}</td>
                  <td>
                    <div className="admin-actions" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/posts/edit?slug=${post.slug}`} className="admin-btn-sm">
                        编辑
                      </Link>
                      <button
                        className="admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(post.slug)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-tip">
        操作保存后 GitHub Actions 会自动重新部署，约 2 分钟后生效。
      </div>
    </div>
  );
}
