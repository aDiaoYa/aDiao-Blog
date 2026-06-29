/**
 * 生成 search.json 和 sidebar-data.json 及 posts-metadata.json
 * 运行: node scripts/generate-data.js
 */
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

// 优先读取 content/posts/，为空时回退到 source/_posts/（Legacy Hexo 文章）
const CANDIDATE_DIRS = [
  path.join(process.cwd(), "content", "posts"),
  path.join(process.cwd(), "source", "_posts"),
];

function resolvePostsDir() {
  for (const dir of CANDIDATE_DIRS) {
    if (fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith(".md"))) {
      return dir;
    }
  }
  return null; // 都为空时返回 null
}

const POSTS_DIR = resolvePostsDir();
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
  if (!POSTS_DIR) {
    console.log("No posts directory found, generating empty data files");
    // 生成空数据文件，确保站点正常工作
    fs.writeFileSync(path.join(OUT_DIR, "search.json"), JSON.stringify([]), "utf-8");
    fs.writeFileSync(path.join(OUT_DIR, "sidebar-data.json"), JSON.stringify({ postCount: 0, categories: [], tags: [], recent: [] }), "utf-8");
    fs.writeFileSync(path.join(OUT_DIR, "posts-metadata.json"), JSON.stringify([]), "utf-8");
    console.log("✅ Empty data files generated");
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

  // ── posts-metadata.json（全量文章元数据，供后台管理页使用）──
  const allPosts = postMetas
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(({ title, slug, date, categories, tags }) => ({
      title,
      slug,
      date: date instanceof Date ? date.toISOString() : date,
      categories,
      tags,
    }));
  fs.writeFileSync(path.join(OUT_DIR, "posts-metadata.json"), JSON.stringify(allPosts), "utf-8");
  console.log(`✅ posts-metadata.json (${allPosts.length} posts)`);
}

main();
