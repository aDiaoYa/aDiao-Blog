"use client";

/**
 * 分类 & 标签本地管理工具
 * 通过 localStorage 持久化自定义分类/标签，与文章 frontmatter 中的分类/标签合并展示
 */

const STORAGE_KEY = "admin_taxonomies";

interface TaxonomyStore {
  customCategories: string[];
  customTags: string[];
}

function loadStore(): TaxonomyStore {
  if (typeof window === "undefined") return { customCategories: [], customTags: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { customCategories: [], customTags: [] };
}

function saveStore(store: TaxonomyStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** 获取所有分类（合并自定义分类与文章中的分类，去重排序） */
export function getCategories(postCategories?: string[]): string[] {
  const store = loadStore();
  const all = new Set([...store.customCategories, ...(postCategories || [])]);
  return Array.from(all).filter(Boolean).sort();
}

/** 获取所有标签 */
export function getTags(postTags?: string[]): string[] {
  const store = loadStore();
  const all = new Set([...store.customTags, ...(postTags || [])]);
  return Array.from(all).filter(Boolean).sort();
}

/** 添加分类 */
export function addCategory(name: string): void {
  const store = loadStore();
  if (!store.customCategories.includes(name)) {
    store.customCategories.push(name);
    saveStore(store);
  }
}

/** 添加标签 */
export function addTag(name: string): void {
  const store = loadStore();
  if (!store.customTags.includes(name)) {
    store.customTags.push(name);
    saveStore(store);
  }
}

/** 更新分类名 */
export function updateCategory(oldName: string, newName: string): void {
  const store = loadStore();
  const idx = store.customCategories.indexOf(oldName);
  if (idx !== -1) {
    store.customCategories[idx] = newName;
    saveStore(store);
  }
}

/** 更新标签名 */
export function updateTag(oldName: string, newName: string): void {
  const store = loadStore();
  const idx = store.customTags.indexOf(oldName);
  if (idx !== -1) {
    store.customTags[idx] = newName;
    saveStore(store);
  }
}

/** 删除分类 */
export function removeCategory(name: string): void {
  const store = loadStore();
  store.customCategories = store.customCategories.filter((c) => c !== name);
  saveStore(store);
}

/** 删除标签 */
export function removeTag(name: string): void {
  const store = loadStore();
  store.customTags = store.customTags.filter((t) => t !== name);
  saveStore(store);
}
