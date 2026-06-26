"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createPost, uploadImage } from "@/lib/github";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import type { MDEditorProps } from "@uiw/react-md-editor";

const MDEditor = dynamic<MDEditorProps>(() => import("@uiw/react-md-editor"), { ssr: false });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "untitled";
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      if (!slug || slug === slugify(title)) {
        setSlug(slugify(val));
      }
    },
    [slug, title]
  );

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

  function buildFrontmatter(): string {
    const lines = ["---", `title: "${title}"`, `date: ${date}:00`];
    if (category.trim()) lines.push(`categories: ${category.trim()}`);
    if (tags.trim()) {
      lines.push("tags:");
      tags.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => lines.push(`  - ${t}`));
    }
    lines.push("---");
    return lines.join("\n");
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("请输入文章标题");
      return;
    }
    const finalSlug = slug.trim() || slugify(title);
    setSaving(true);
    setError("");
    try {
      const fullContent = buildFrontmatter() + "\n\n" + body;
      await createPost(finalSlug, fullContent);
      router.push("/admin/posts");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-editor-page">
      <div className="admin-page-header">
        <h2>写新文章</h2>
        <div className="admin-header-actions">
          <button className="admin-btn-secondary" onClick={() => router.back()}>取消</button>
          <button
            className="admin-btn-primary"
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            {saving ? (
              <><span className="admin-spinner" />发布中…</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                发布文章
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
            <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="输入文章标题" />
          </label>
          <label className="admin-field">
            <span>Slug</span>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="自动生成" />
          </label>
        </div>
        <div className="admin-fm-row">
          <label className="admin-field">
            <span>分类</span>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例如: 技术笔记" />
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
          <span className="admin-toolbar-tip">支持粘贴图片 · Ctrl+B 加粗 · Ctrl+I 斜体 · Ctrl+K 链接</span>
        </div>
        <MDEditor value={body} onChange={(val) => setBody(val || "")} height={520} preview="live" visibleDragbar={false} />
      </div>
    </div>
  );
}
