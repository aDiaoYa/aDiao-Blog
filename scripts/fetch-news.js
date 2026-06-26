/**
 * 每日 AI/前端 新闻抓取脚本
 * 从多个 RSS 源抓取最新资讯，生成 source/_data/news.json
 * 用法: node scripts/fetch-news.js
 */
const RssParser = require("rss-parser");
const fs = require("fs");
const path = require("path");

const parser = new RssParser({
  timeout: 15000,
  headers: { "User-Agent": "aDiaoYa-Blog-NewsBot/1.0" },
});

// ── RSS 资讯源 ──
const FEEDS = [
  { url: "https://hnrss.org/frontpage?count=8", name: "Hacker News", tags: ["综合"] },
  { url: "https://dev.to/feed/tag/ai", name: "Dev.to · AI", tags: ["AI"] },
  { url: "https://dev.to/feed/tag/llm", name: "Dev.to · LLM", tags: ["AI"] },
  { url: "https://dev.to/feed/tag/javascript", name: "Dev.to · JS", tags: ["前端"] },
  { url: "https://dev.to/feed/tag/typescript", name: "Dev.to · TS", tags: ["前端"] },
  { url: "https://dev.to/feed/tag/react", name: "Dev.to · React", tags: ["前端"] },
  { url: "https://dev.to/feed/tag/nextjs", name: "Dev.to · Next.js", tags: ["前端"] },
];

// ── 主函数 ──
async function fetchAll() {
  const allItems = [];
  const fetchDate = new Date().toISOString().split("T")[0];

  for (const feed of FEEDS) {
    try {
      console.log(`📡 抓取 ${feed.name} ...`);
      const result = await parser.parseURL(feed.url);
      const items = (result.items || []).slice(0, 5).map((item) => ({
        title: (item.title || "").trim(),
        link: item.link || "",
        source: feed.name,
        tags: feed.tags,
        date: item.pubDate || item.isoDate || "",
        summary: (item.contentSnippet || item.content || "").replace(/\s+/g, " ").slice(0, 200),
      }));
      console.log(`   ✅ 获取 ${items.length} 条`);
      allItems.push(...items);
    } catch (err) {
      console.log(`   ❌ 失败: ${err.message}`);
    }
  }

  // 按日期排序（最新的在前）
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 去重（按 link）
  const seen = new Set();
  const deduped = allItems.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  const data = {
    updated: new Date().toISOString(),
    date: fetchDate,
    count: deduped.length,
    items: deduped,
  };

  const outDir = path.join(__dirname, "..", "source", "_data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "news.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\n🎉 完成！${deduped.length} 条新闻 → ${outPath}`);
}

fetchAll().catch((err) => {
  console.error("抓取失败:", err);
  process.exit(1);
});
