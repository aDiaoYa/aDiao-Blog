/**
 * 共享 Markdown 工具函数
 * 供 posts.ts 和 scripts/generate-data.js 共用
 */

/** 去除 Markdown 标记，提取纯文本 */
export function stripMarkdown(md: string): string {
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

/** 提取文章摘要（前200字） */
export function extractExcerpt(content: string): string {
  const cleaned = stripMarkdown(content).trim();
  return cleaned.slice(0, 200) + (cleaned.length > 200 ? "..." : "");
}

/**
 * 生成 URL-safe ASCII slug（与 scripts/generate-data.js 的 toUrlSafeSlug 保持一致）
 * 纯 ASCII 文件名直接使用，含中文等非 ASCII 字符时用 DJB2 hash 生成短标识
 */
export function toUrlSafeSlug(filename: string): string {
  const name = filename.replace(/\.md$/, "");
  if (/^[a-zA-Z0-9\-_]+$/.test(name)) return name;
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) + hash) + name.charCodeAt(i);
  }
  return "p" + ((hash >>> 0).toString(16));
}
