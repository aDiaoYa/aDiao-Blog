/**
 * 通用工具函数 — 统一日期格式、字符串处理
 */

/** 格式化日期为 "2024 · 01 · 15" 格式 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()} · ${pad(d.getMonth() + 1)} · ${pad(d.getDate())}`;
}

/** 格式化日期为 "2024年1月15日" 格式 */
export function formatDateCN(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 格式化日期为 "YYYY-MM-DD" 格式 */
export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 获取今天的日期 key */
export function getTodayKey(): string {
  return getDateKey(new Date());
}

/** 获取中文星期 */
export function formatWeekday(date: Date): string {
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `星期${weekdays[date.getDay()]}`;
}

/** 获取完整的中文日期字符串（含星期） */
export function formatDateWithWeekday(date: Date): string {
  return `${formatDateCN(date)} · ${formatWeekday(date)}`;
}

/** 计算文章已发布天数 */
export function daysSince(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** 数字补零到 2 位 */
export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 截断文本 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

/** 生成 slug 安全的 ID */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
