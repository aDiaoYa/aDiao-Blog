"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getPostContent, updatePost, uploadImage } from "@/lib/github";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import type { MDEditorProps } from "@uiw/react-md-editor";

const MDEditor = dynamic<MDEditorProps>(() => import("@uiw/react-md-editor"), { ssr: false });

interface Frontmatter {
  title: string;
  date: string;
  tags: string[];
  categories: string;
}

function parseFrontmatter(content: string): { fm: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return {
      fm: { title: "", date: formatDateValue(new Date()), tags: [], categories: "" },
      body: content,
    };
  }
  const fmRaw = match[1];
  const lines = fmRaw.split("\n");
  const fm: Frontmatter = { title: "", date: formatDateValue(new Date()), tags: [], categories: "" };
  let inTags = false;
  for (const line of lines) {
    if (line.startsWith("title:")) {
      fm.title = line.replace(/^title:\s*["']?/, "").replace(/["']$/, "").trim();
    } else if (line.startsWith("date:")) {
      const d = line.replace("date:", "").trim();
      fm.date = formatDateValue(new Date(d));
    } else if (line.startsWith("categories:")) {
      fm.categories = line.replace("categories:", "").trim();
    } else if (line.startsWith("tags:")) {
      inTags = true;
    } else if (inTags && line.trim().startsWith("-")) {
      fm.tags.push(line.replace(/^\s*-\s*/, "").trim());
    } else {
      inTags = false;
    }
  }
  return { fm, body: match[2].trimStart() };
}

function formatDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildFrontmatter(title: string, date: string, category: string, tags: string): string {
  const lines = ["---", `title: "${title}"`, `date: ${date}:00`];
  if (category.trim()) lines.push(`categories: ${category.trim()}`);
  if (tags.trim()) {
    lines.push("tags:");
    tags.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => lines.push(`  - ${t}`));
  }
  lines.push("---");
  return lines.join("\n");
}

function EditPostContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug") || "";

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [body, setBody] = useState("");
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) { router.push("/admin/posts"); return; }
    loadPost();
  }, [slug]);

  async function loadPost() {
    setLoading(true);
    setError("");
    try {
      const { content, sha: fileSha } = await getPostContent(slug);
      setSha(fileSha);
      const { fm, body: postBody } = parseFrontmatter(content);
      setTitle(fm.title);
      setDate(fm.date);
      setCategory(fm.categories);
      setTags(fm.tags.join(", "));
      setBody(postBody);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setBody((prev) => prev + (prev ? "\n\n" : "") + `![${file.name}](${url})`);
    } catch (err) {
      alert("图片上传失败：" + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handlePasteImage(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setUploading(true);
          uploadImage(file)
            .then((url) => setBody((prev) => prev + (prev ? "\n\n" : "") + `![图片](${url})`))
            .catch((err) => alert("图片上传失败：" + (err as Error).message))
            .finally(() => setUploading(false));
        }
        break;
      }
    }
  }

  async function handleSave() {
    if (!title.trim()) { setError("请输入文章标题"); return; }
    setSaving(true);
    setError("");
    try {
      const fullContent = buildFrontmatter(title, date, category, tags) + "\n\n" + body;
      await updatePost(slug, fullContent, sha);
      router.push("/admin/posts");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!slug) return null;
  if (loading) return <div className="admin-loading">加载文章…</div>;

  return (
    <div className="admin-editor-page">
      <div className="admin-page-header">
        <h2>编辑文章</h2>
        <div className="admin-header-actions">
          <button className="admin-btn-secondary" onClick={() => router.push("/admin/posts")}>取消</button>
          <button className="admin-btn-primary" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? (
              <><span className="admin-spinner" />保存中…</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                保存修改
              </>
            )}
          </button>
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

      <div className="admin-frontmatter">
        <div className="admin-fm-row">
          <label className="admin-field admin-field-lg">
            <span>文章标题 *</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入文章标题" />
          </label>
          <label className="admin-field">
            <span>Slug（只读）</span>
            <input type="text" value={slug} disabled />
          </label>
        </div>
        <div className="admin-fm-row">
          <label className="admin-field">
            <span>分类</span>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label className="admin-field admin-field-lg">
            <span>标签（逗号分隔）</span>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例如: React, Next.js" />
          </label>
          <label className="admin-field">
            <span>发布时间</span>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="admin-editor-wrapper" onPaste={handlePasteImage}>
        <div className="admin-editor-toolbar-custom">
          <button className="admin-btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {uploading ? "上传中…" : "插入图片"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
          <span className="admin-toolbar-tip">支持粘贴图片 · 实时预览 · 代码高亮</span>
        </div>
        <MDEditor value={body} onChange={(val) => setBody(val || "")} height={520} preview="live" visibleDragbar={false} />
      </div>
    </div>
  );
}

export default function EditPostPage() {
  return (
    <Suspense fallback={<div className="admin-loading">加载中…</div>}>
      <EditPostContent />
    </Suspense>
  );
}
