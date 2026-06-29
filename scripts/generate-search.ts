/**
 * 生成 search.json 供静态搜索使用
 * 运行: npx tsx scripts/generate-search.ts
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// 优先读取 content/posts/，为空时回退到 source/_posts/（Legacy Hexo 文章）
const CANDIDATE_DIRS = [
  path.join(process.cwd(), "content", "posts"),
  path.join(process.cwd(), "source", "_posts"),
];

function resolvePostsDir(): string | null {
  for (const dir of CANDIDATE_DIRS) {
    if (fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith(".md"))) {
      return dir;
    }
  }
  return null;
}

const POSTS_DIR = resolvePostsDir();
const OUT_DIR = path.join(process.cwd(), "public");

interface SearchItem {
  title: string;
  url: string;
  text: string;
  tags: string[];
}

function stripMarkdown(md: string): string {
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
    fs.writeFileSync(path.join(OUT_DIR, "search.json"), JSON.stringify([]), "utf-8");
    fs.writeFileSync(path.join(OUT_DIR, "sidebar-data.json"), JSON.stringify({ postCount: 0, categories: [], tags: [], recent: [] }), "utf-8");
    console.log("✅ Empty data files generated");
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const items: SearchItem[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { data } = matter(raw);
    const slug = file.replace(/\.md$/, "");
    items.push({
      title: data.title || "未命名",
      url: `/posts/${slug}`,
      text: stripMarkdown(raw),
      tags: data.tags || [],
    });
  }

  const outPath = path.join(OUT_DIR, "search.json");
  fs.writeFileSync(outPath, JSON.stringify(items), "utf-8");
  console.log(`✅ search.json generated with ${items.length} items`);

  // ── 生成 sidebar-data.json ──
  const postCount = items.length;

  // categories
  const catMap = new Map<string, number>();
  items.forEach((item) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, `${item.url.split("/").pop()}.md`), "utf-8");
    const { data: d } = matter(raw);
    const cats: string[] = d.categories ? (Array.isArray(d.categories) ? d.categories : [d.categories]) : [];
    cats.forEach((c) => catMap.set(c, (catMap.get(c) || 0) + 1));
  });
  const categories = Array.from(catMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // tags
  const tagMap = new Map<string, number>();
  items.forEach((item) => {
    item.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1));
  });
  const tags = Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // recent posts
  const recent = items
    .map((item) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, `${item.url.split("/").pop()}.md`), "utf-8");
      const { data: d } = matter(raw);
      return {
        title: item.title,
        slug: item.url.split("/").pop(),
        date: d.date || new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const sidebarData = { postCount, categories, tags: tags.slice(0, 15), recent };
  fs.writeFileSync(path.join(OUT_DIR, "sidebar-data.json"), JSON.stringify(sidebarData), "utf-8");
  console.log(`✅ sidebar-data.json generated`);
}

main();
