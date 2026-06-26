/**
 * 生成 search.json 和 sidebar-data.json
 * 运行: node scripts/generate-data.js
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const OUT_DIR = path.join(process.cwd(), "public");

function stripMarkdown(md) {
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

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log("No posts directory found, skipping data generation");
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  /** @type {Array<{title:string, url:string, text:string, tags:string[]}>} */
  const searchItems = [];
  /** @type {Array<{title:string, slug:string, date:string}>} */
  const postMetas = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { data } = matter(raw);
    const slug = file.replace(/\.md$/, "");
    searchItems.push({
      title: data.title || "未命名",
      url: `/posts/${slug}`,
      text: stripMarkdown(raw),
      tags: data.tags || [],
    });
    postMetas.push({
      title: data.title || "未命名",
      slug,
      date: data.date || new Date().toISOString(),
      categories: data.categories
        ? Array.isArray(data.categories)
          ? data.categories
          : [data.categories]
        : [],
      tags: data.tags || [],
    });
  }

  // ── search.json ──
  fs.writeFileSync(path.join(OUT_DIR, "search.json"), JSON.stringify(searchItems), "utf-8");
  console.log(`✅ search.json (${searchItems.length} items)`);

  // ── sidebar-data.json ──
  const postCount = searchItems.length;

  // categories
  const catMap = new Map();
  postMetas.forEach((p) => {
    (p.categories || []).forEach((c) => catMap.set(c, (catMap.get(c) || 0) + 1));
  });
  const categories = Array.from(catMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // tags
  const tagMap = new Map();
  postMetas.forEach((p) => {
    (p.tags || []).forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1));
  });
  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // recent posts
  const recent = [...postMetas]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(({ title, slug, date }) => ({ title, slug, date }));

  const sidebarData = { postCount, categories, tags, recent };
  fs.writeFileSync(path.join(OUT_DIR, "sidebar-data.json"), JSON.stringify(sidebarData), "utf-8");
  console.log(`✅ sidebar-data.json (${postCount} posts, ${categories.length} cats, ${tags.length} tags)`);
}

main();
