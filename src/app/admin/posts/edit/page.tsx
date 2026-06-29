"use client";

import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getPostContent, updatePost, uploadImage, listPosts } from "@/lib/github";
import { getCategories, getTags, addCategory, addTag } from "@/lib/taxonomies";
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

/* ===== 箭头图标 ===== */
function ChevronDown() {
  return (
    <span className="dd-chevron">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ===== 分类下拉选择器 ===== */
function CategoryDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (cat: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const displayText =
    value === "__none__" || !value
      ? "不选择分类"
      : value === "__custom__"
      ? customInput || "自定义分类…"
      : value;

  const isPlaceholder = value === "__none__" || !value;

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  function selectCategory(cat: string) {
    if (cat === "__custom__") {
      setShowCustomInput(true);
      onChange("__custom__");
    } else if (cat === "__none__") {
      setShowCustomInput(false);
      setCustomInput("");
      onChange("__none__");
    } else {
      setShowCustomInput(false);
      onChange(cat);
    }
    setOpen(false);
    setSearch("");
  }

  function confirmCustom() {
    const v = customInput.trim();
    if (v) {
      onChange(v);
      setShowCustomInput(false);
      setCustomInput("");
    }
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="admin-dropdown-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`admin-dropdown-trigger${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className={isPlaceholder ? "dd-placeholder" : "dd-selected-text"}>
          {displayText}
        </span>
        <ChevronDown />
      </button>

      {open && (
        <div className="admin-dropdown-panel">
          <input
            ref={searchRef}
            className="admin-dropdown-search"
            placeholder="搜索分类…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="admin-dropdown-list">
            <button
              type="button"
              className={`admin-dropdown-option${value === "__none__" || !value ? " selected" : ""}`}
              onClick={() => selectCategory("__none__")}
            >
              <span className="dd-check" style={{ width: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {(value === "__none__" || !value) && <CheckIcon />}
              </span>
              不选择分类
            </button>

            {filtered.length > 0 && <div className="admin-dropdown-divider" />}

            {filtered.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`admin-dropdown-option${value === cat ? " selected" : ""}`}
                onClick={() => selectCategory(cat)}
              >
                <span className="dd-check" style={{ width: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {value === cat && <CheckIcon />}
                </span>
                {cat}
              </button>
            ))}

            {search && filtered.length === 0 && (
              <div className="admin-dropdown-option empty">无匹配分类</div>
            )}

            <div className="admin-dropdown-divider" />

            <button
              type="button"
              className={`admin-dropdown-option create${showCustomInput ? " selected" : ""}`}
              onClick={() => selectCategory("__custom__")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              自定义分类…
            </button>
          </div>

          {showCustomInput && (
            <div className="admin-dropdown-create-row">
              <input
                type="text"
                placeholder="输入新分类名称"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmCustom(); } }}
                autoFocus
              />
              <button type="button" onClick={confirmCustom}>确定</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== 标签多选下拉选择器 ===== */
function TagsDropdown({
  selected,
  options,
  onToggle,
  onAdd,
}: {
  selected: string[];
  options: string[];
  onToggle: (tag: string) => void;
  onAdd: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        setShowNewInput(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // 合并已选 + 已有选项（去重）
  const allOptions = useMemo(() => {
    const set = new Set([...options, ...selected]);
    return Array.from(set).sort((a, b) => {
      const aSel = selected.includes(a) ? 0 : 1;
      const bSel = selected.includes(b) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.localeCompare(b);
    });
  }, [options, selected]);

  const displayOptions = search
    ? allOptions.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : allOptions;

  function handleSelectOption(tag: string) {
    onToggle(tag);
  }

  function handleCreateTag() {
    const v = newTag.trim();
    if (v && !selected.includes(v)) {
      onAdd(v);
      onToggle(v);
    }
    setNewTag("");
    setShowNewInput(false);
  }

  return (
    <div className="admin-dropdown-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`admin-dropdown-trigger multi${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {selected.length > 0 ? (
          <>
            <span className="dd-selected-text">
              {selected.length === 1 ? selected[0] : `已选 ${selected.length} 个标签`}
            </span>
            <span className="dd-tag-count">{selected.length}</span>
          </>
        ) : (
          <span className="dd-placeholder">选择标签</span>
        )}
        <ChevronDown />
      </button>

      {open && (
        <div className="admin-dropdown-panel" style={{ minWidth: 260 }}>
          <input
            ref={searchRef}
            className="admin-dropdown-search"
            placeholder="搜索标签…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="admin-dropdown-list">
            {displayOptions.length === 0 && search && (
              <div className="admin-dropdown-option empty">无匹配标签，按回车创建</div>
            )}
            {displayOptions.map((tag) => {
              const isSel = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`admin-dropdown-option multi${isSel ? " selected" : ""}`}
                  onClick={() => handleSelectOption(tag)}
                >
                  <span className="dd-checkbox">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="admin-dropdown-divider" style={{ margin: 0 }} />

          {showNewInput ? (
            <div className="admin-dropdown-create-row">
              <input
                type="text"
                placeholder="输入新标签名称"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateTag(); } }}
                autoFocus
              />
              <button type="button" onClick={handleCreateTag}>添加</button>
            </div>
          ) : (
            <button
              type="button"
              className="admin-dropdown-option create"
              onClick={() => setShowNewInput(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加新标签
            </button>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="admin-selected-tags">
          {selected.map((t) => (
            <span key={t} className="admin-selected-tag">
              {t}
              <button type="button" onClick={() => onToggle(t)}>&times;</button>
            </span>
          ))}
          <button type="button" className="clear-all-tags" onClick={() => selected.forEach((t) => onToggle(t))}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            清空
          </button>
        </div>
      )}
    </div>
  );
}

function EditPostContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug") || "";

  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [body, setBody] = useState("");
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 从已有文章加载分类和标签列表
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) { router.push("/admin/posts"); return; }
    loadPost();
    loadTaxonomies();
  }, [slug]);

  async function loadTaxonomies() {
    try {
      const files = await listPosts();
      const mdFiles = files.filter((f) => f.name.endsWith(".md"));
      const enriched = await Promise.all(
        mdFiles.map(async (f) => {
          const s = f.name.replace(/\.md$/, "");
          try {
            const { content } = await getPostContent(s);
            const m = content.match(/^---\n([\s\S]*?)\n---/);
            if (!m) return { cat: "", tgs: [] as string[] };
            let cat = "";
            const tgs: string[] = [];
            let inTags = false;
            for (const line of m[1].split("\n")) {
              if (line.startsWith("categories:")) cat = line.replace("categories:", "").trim();
              else if (line.startsWith("tags:")) inTags = true;
              else if (inTags && line.trim().startsWith("-")) tgs.push(line.replace(/^\s*-\s*/, "").trim());
              else inTags = false;
            }
            return { cat, tgs };
          } catch { return { cat: "", tgs: [] as string[] }; }
        })
      );
      const allCats = new Set<string>();
      const allTgs = new Set<string>();
      enriched.forEach(({ cat, tgs }) => { if (cat) allCats.add(cat); tgs.forEach((t) => allTgs.add(t)); });
      setExistingCategories(getCategories(Array.from(allCats)));
      setExistingTags(getTags(Array.from(allTgs)));
    } catch { /* ignore */ }
  }

  async function loadPost() {
    setLoading(true);
    setError("");
    try {
      const { content, sha: fileSha } = await getPostContent(slug);
      setSha(fileSha);
      const { fm, body: postBody } = parseFrontmatter(content);
      setTitle(fm.title);
      setDate(fm.date);
      setCategory(fm.categories || "__none__");
      setSelectedTags(fm.tags);
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

  function handleCategoryChange(cat: string) {
    setCategory(cat);
  }

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleTagAdd(tag: string) {
    if (tag && !existingTags.includes(tag)) {
      addTag(tag);
      setExistingTags((prev) => [...prev, tag]);
    }
  }

  function buildFrontmatter(): string {
    const lines = ["---", `title: "${title}"`, `date: ${date}:00`];
    const cat = category === "__none__" ? "" : category.trim();
    if (cat) lines.push(`categories: ${cat}`);
    if (selectedTags.length > 0) {
      lines.push("tags:");
      for (const t of selectedTags) lines.push(`  - ${t}`);
    }
    lines.push("---");
    return lines.join("\n");
  }

  async function handleSave() {
    if (!title.trim()) { setError("请输入文章标题"); return; }
    // 保存新的自定义分类
    const cat = category === "__none__" ? "" : category.trim();
    if (cat && !existingCategories.includes(cat)) {
      addCategory(cat);
    }
    for (const t of selectedTags) {
      if (t && !existingTags.includes(t)) addTag(t);
    }
    setSaving(true);
    setError("");
    try {
      const fullContent = buildFrontmatter() + "\n\n" + body;
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
          <button
            className="admin-btn-secondary"
            onClick={async () => {
              try { await fetch(`/aDiao-Blog/api/sync-posts?slug=${encodeURIComponent(slug)}`); } catch {}
              window.open(`/aDiao-Blog/posts/${encodeURIComponent(slug)}`, "_blank");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            前台查看
          </button>
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
            <CategoryDropdown
              value={category}
              options={existingCategories}
              onChange={handleCategoryChange}
            />
          </label>
          <label className="admin-field admin-field-lg">
            <span>标签</span>
            <TagsDropdown
              selected={selectedTags}
              options={existingTags}
              onToggle={handleTagToggle}
              onAdd={handleTagAdd}
            />
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
