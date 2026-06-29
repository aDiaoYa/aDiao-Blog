"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listPosts, getPostContent } from "@/lib/github";
import {
  getCategories,
  getTags,
  addCategory,
  addTag,
  updateCategory,
  updateTag,
  removeCategory,
  removeTag,
} from "@/lib/taxonomies";

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

export default function TaxonomiesPage() {
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"categories" | "tags">("categories");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // 新建相关
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  // 重命名相关
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const loadData = useCallback(async () => {
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
            const frontmatter = parseFrontmatter(content);
            return { ...frontmatter, slug };
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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="admin-loading">加载中…</div>;

  // 从文章数据提取分类和标签
  const postCatMap = new Map<string, PostInfo[]>();
  const postTagMap = new Map<string, PostInfo[]>();
  for (const post of posts) {
    const cat = post.categories || "未分类";
    if (!postCatMap.has(cat)) postCatMap.set(cat, []);
    postCatMap.get(cat)!.push(post);
    for (const tag of post.tags.length > 0 ? post.tags : ["未分类"]) {
      if (!postTagMap.has(tag)) postTagMap.set(tag, []);
      postTagMap.get(tag)!.push(post);
    }
  }

  const mergedCategories = getCategories(Array.from(postCatMap.keys()));
  const mergedTags = getTags(Array.from(postTagMap.keys()));

  // 当前选中项下的文章
  const selectedPosts = selectedItem
    ? activeTab === "categories"
      ? postCatMap.get(selectedItem) || []
      : postTagMap.get(selectedItem) || []
    : [];

  const currentItems = activeTab === "categories" ? mergedCategories : mergedTags;
  const currentMap = activeTab === "categories" ? postCatMap : postTagMap;
  const itemLabel = activeTab === "categories" ? "分类" : "标签";

  function getItemCount(name: string) {
    return currentMap.get(name)?.length || 0;
  }

  function isCustom(name: string) {
    return !currentMap.has(name);
  }

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    if (activeTab === "categories") addCategory(name);
    else addTag(name);
    setNewName("");
    setCreating(false);
  }

  async function handleRename(oldName: string) {
    const name = renameValue.trim();
    if (!name || name === oldName) { setRenaming(null); return; }
    if (activeTab === "categories") updateCategory(oldName, name);
    else updateTag(oldName, name);
    if (selectedItem === oldName) setSelectedItem(name);
    setRenaming(null);
  }

  function handleDelete(name: string) {
    if (activeTab === "categories") removeCategory(name);
    else removeTag(name);
    if (selectedItem === name) setSelectedItem(null);
  }

  return (
    <div>
      <div className="admin-page-header">
        <h2>分类 &amp; 标签</h2>
        <div className="admin-header-actions">
          {selectedItem && (
            <button className="admin-btn-secondary" onClick={() => setSelectedItem(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              返回列表
            </button>
          )}
          {!selectedItem && (
            <button className="admin-btn-primary" onClick={() => setCreating(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              新建{itemLabel}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* 创建表单弹层 */}
      {creating && (
        <div className="admin-tax-form">
          <input
            type="text"
            className="admin-tax-input"
            placeholder={`输入${itemLabel}名称，回车确认`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setCreating(false); setNewName(""); }
            }}
            autoFocus
          />
          <button className="admin-btn-sm" onClick={handleCreate} disabled={!newName.trim()}>添加</button>
          <button className="admin-btn-sm" onClick={() => { setCreating(false); setNewName(""); }}>取消</button>
        </div>
      )}

      {selectedItem ? (
        // 选中分类/标签 → 显示文章列表
        <div>
          <h3 className="admin-tax-section-title">
            {activeTab === "categories" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-primary)" }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-warning)" }}>
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            )}
            {selectedItem}（{selectedPosts.length} 篇文章）
          </h3>
          <div className="admin-posts-table-wrap">
            <table className="admin-posts-table">
              <thead>
                <tr>
                  <th>标题</th>
                  {activeTab === "categories" ? <th>标签</th> : <th>分类</th>}
                  <th>日期</th>
                  <th style={{ width: 100 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {selectedPosts.map((post) => (
                  <tr key={post.slug}>
                    <td><span className="post-title">{post.title || post.slug}</span></td>
                    <td>
                      {activeTab === "categories"
                        ? post.tags.length > 0 ? post.tags.map(t => <code key={t} style={{ marginRight: 4 }}>{t}</code>) : "—"
                        : post.categories || "—"}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{post.date || "—"}</td>
                    <td>
                      <Link href={`/admin/posts/edit?slug=${post.slug}`} className="admin-btn-sm">编辑</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // 分类/标签列表
        <>
          {/* Tabs */}
          <div className="admin-tax-tabs">
            <button
              className={`admin-tax-tab${activeTab === "categories" ? " active" : ""}`}
              onClick={() => { setActiveTab("categories"); setSelectedItem(null); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              分类
              <span className="admin-tax-count">{mergedCategories.length}</span>
            </button>
            <button
              className={`admin-tax-tab${activeTab === "tags" ? " active" : ""}`}
              onClick={() => { setActiveTab("tags"); setSelectedItem(null); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              标签
              <span className="admin-tax-count">{mergedTags.length}</span>
            </button>
          </div>

          {currentItems.length === 0 && (
            <div className="admin-empty">
              <p>暂无{itemLabel}，点击上方按钮创建</p>
            </div>
          )}

          <div className="admin-cat-grid">
            {currentItems.map((name) => (
              <div key={name} className="admin-tax-item">
                {renaming === name ? (
                  <div className="admin-tax-rename-form" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="admin-tax-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(name);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      autoFocus
                    />
                    <button className="admin-btn-sm" onClick={() => handleRename(name)}>确认</button>
                    <button className="admin-btn-sm" onClick={() => setRenaming(null)}>取消</button>
                  </div>
                ) : (
                  <>
                    <button
                      className="admin-tax-card-inner"
                      onClick={() => getItemCount(name) > 0 && setSelectedItem(name)}
                      style={{ cursor: getItemCount(name) > 0 ? "pointer" : "default" }}
                    >
                      <div className="admin-cat-info">
                        {activeTab === "categories" ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-primary)", flexShrink: 0 }}>
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--admin-warning)", flexShrink: 0 }}>
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                        )}
                        <span className="admin-cat-name">{name}</span>
                        {isCustom(name) && <span className="admin-tax-badge">自定义</span>}
                      </div>
                      <div className="admin-tax-item-right">
                        <span className="admin-cat-count">{getItemCount(name)} 篇</span>
                        {getItemCount(name) > 0 && (
                          <svg className="admin-cat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <div className="admin-tax-item-actions">
                      <button
                        className="admin-btn-icon"
                        title="重命名"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenaming(name);
                          setRenameValue(name);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="admin-btn-icon danger"
                        title="删除"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除${itemLabel}「${name}」吗？`)) handleDelete(name);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
