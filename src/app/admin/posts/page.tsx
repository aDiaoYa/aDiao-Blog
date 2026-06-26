"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listPosts, deletePost, getPostContent } from "@/lib/github";
import type { PostMeta } from "@/types";

function parseFrontmatterTitle(content: string): { title: string; date: string; categories: string; tags: string[] } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { title: "", date: "", categories: "", tags: [] };
  const result = { title: "", date: "", categories: "", tags: [] as string[] };
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

export default function PostsPage() {
  const [posts, setPosts] = useState<{ slug: string; title: string; date: string; categories: string; tags: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const files = await listPosts();
      const mdFiles = files.filter((f) => f.name.endsWith(".md"));
      const enriched = await Promise.all(
        mdFiles.map(async (f) => {
          const slug = f.name.replace(/\.md$/, "");
          try {
            const { content } = await getPostContent(slug);
            const meta = parseFrontmatterTitle(content);
            return { slug, ...meta };
          } catch {
            return { slug, title: slug, date: "", categories: "", tags: [] };
          }
        })
      );
      enriched.sort((a, b) => b.date.localeCompare(a.date));
      setPosts(enriched);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`确定要删除「${slug}」吗？此操作不可撤销。`)) return;
    try {
      const { sha } = await getPostContent(slug);
      await deletePost(slug, sha);
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } catch (e) {
      alert("删除失败：" + (e as Error).message);
    }
  }

  return (
    <div className="admin-posts-page">
      <div className="admin-page-header">
        <h2>文章管理</h2>
        <Link href="/admin/posts/new" className="admin-btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          写新文章
        </Link>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">加载中…</div>
      ) : posts.length === 0 ? (
        <div className="admin-empty">
          <p>还没有文章，快去写第一篇吧</p>
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
                <th style={{ width: 140 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.slug}>
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
                    <div className="admin-actions">
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
