"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listPosts, getPostContent } from "@/lib/github";

interface PostInfo {
  slug: string;
  title: string;
  date: string;
  categories: string;
  tags: string[];
}

function parseFrontmatter(content: string): PostInfo {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { slug: "", title: "", date: "", categories: "", tags: [] };
  const result: PostInfo = { slug: "", title: "", date: "", categories: "", tags: [] };
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

export default function DashboardPage() {
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      // 开发环境：优先从本地文件读取
      let files: { name: string; content: string }[];
      try {
        const res = await fetch("/aDiao-Blog/api/local-list");
        if (res.ok) {
          files = await res.json();
        } else {
          throw new Error("本地列表不可用");
        }
      } catch {
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
      const enriched = mdFiles.map((f) => {
        const slug = f.name.replace(/\.md$/, "");
        const frontmatter = parseFrontmatter(f.content);
        return { ...frontmatter, slug };
      });
      enriched.sort((a, b) => b.date.localeCompare(a.date));
      setPosts(enriched);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const totalPosts = posts.length;
  const categories = new Set(posts.map((p) => p.categories).filter(Boolean));
  const allTags = new Set(posts.flatMap((p) => p.tags));
  const recentPosts = posts.slice(0, 5);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthPosts = posts.filter((p) => p.date.startsWith(thisMonth)).length;

  if (loading) return <div className="admin-loading">加载中…</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h2>仪表盘</h2>
        <div className="admin-header-actions">
          <Link href="/admin/posts/new" className="admin-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            写文章
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{totalPosts}</div>
            <div className="admin-stat-label">文章总数</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{categories.size}</div>
            <div className="admin-stat-label">分类数量</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{allTags.size}</div>
            <div className="admin-stat-label">标签数量</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{thisMonthPosts}</div>
            <div className="admin-stat-label">本月新增</div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--admin-heading)" }}>
        快捷操作
      </h3>
      <div className="admin-quick-actions">
        <Link href="/admin/posts/new" className="admin-quick-action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          撰写新文章
        </Link>
        <Link href="/admin/posts" className="admin-quick-action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          管理文章
        </Link>
        <Link href="/admin/taxonomies" className="admin-quick-action">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          分类 &amp; 标签
        </Link>
      </div>

      {/* 最近文章 */}
      <div className="admin-recent">
        <div className="admin-recent-header">最近文章</div>
        {recentPosts.length === 0 ? (
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--admin-text-secondary)", fontSize: 14 }}>
            还没有文章，快去写第一篇吧
          </div>
        ) : (
          <ul className="admin-recent-list">
            {recentPosts.map((post) => (
              <li key={post.slug} className="admin-recent-item">
                <Link href={`/admin/posts/edit?slug=${post.slug}`} className="admin-recent-title">
                  {post.title || post.slug}
                </Link>
                <div className="admin-recent-meta">
                  {post.categories && (
                    <span className="admin-recent-category">{post.categories}</span>
                  )}
                  <span>{post.date}</span>
                  <span
                    onClick={async (e) => {
                      e.preventDefault();
                      try { await fetch(`/aDiao-Blog/api/sync-posts?slug=${encodeURIComponent(post.slug)}`); } catch {}
                      window.open(`/aDiao-Blog/posts/${encodeURIComponent(post.slug)}`, "_blank");
                    }}
                    style={{ marginLeft: 8, fontSize: 12, color: 'var(--admin-primary)', cursor: 'pointer', textDecoration: 'none' }}
                  >
                    前台查看 →
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
