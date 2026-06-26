/**
 * 每日 AI/前端 新闻抓取脚本
 * 从多个权威源抓取最新资讯，按热度排序
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
  { url: "https://hnrss.org/frontpage?count=10", name: "Hacker News", tags: ["综合"] },
  { url: "https://www.reddit.com/r/programming/.rss", name: "Reddit · Programming", tags: ["前端"] },
  { url: "https://www.reddit.com/r/MachineLearning/.rss", name: "Reddit · ML", tags: ["AI"] },
  { url: "https://dev.to/feed/tag/ai", name: "Dev.to · AI", tags: ["AI"] },
  { url: "https://dev.to/feed/tag/llm", name: "Dev.to · LLM", tags: ["AI"] },
  { url: "https://dev.to/feed/tag/javascript", name: "Dev.to · JS", tags: ["前端"] },
  { url: "https://dev.to/feed/tag/typescript", name: "Dev.to · TS", tags: ["前端"] },
  { url: "https://dev.to/feed/tag/react", name: "Dev.to · React", tags: ["前端"] },
  { url: "https://dev.to/feed/tag/nextjs", name: "Dev.to · Next.js", tags: ["前端"] },
  { url: "https://hnrss.org/frontpage?count=5&q=AI+OR+LLM+OR+GPT+OR+Claude+OR+OpenAI", name: "HN · AI", tags: ["AI"] },
];

// ── 从描述中提取热度分数 ──
function extractScore(item, sourceName) {
  if (sourceName.startsWith("Hacker News") || sourceName.startsWith("HN")) {
    // hnrss.org 格式: "Points: 123"
    const desc = item.contentSnippet || item.content || "";
    const ptsMatch = desc.match(/Points:\s*(\d+)/i);
    if (ptsMatch) return parseInt(ptsMatch[1], 10);
    // hnrss 也在 description 里放点数
    const desc2 = item.content || item.contentSnippet || "";
    const ptsMatch2 = desc2.match(/Points:\s*(\d+)/i);
    if (ptsMatch2) return parseInt(ptsMatch2[1], 10);
  }
  if (sourceName.startsWith("Reddit")) {
    // Reddit RSS 可能没有直接分数，给默认中等分
    return 50;
  }
  if (sourceName.startsWith("Dev.to")) {
    // Dev.to 没有分数，根据来源给默认分
    return 20;
  }
  return 10;
}

// ── 清理摘要 ──
function cleanSummary(item, sourceName) {
  let raw = item.contentSnippet || item.content || "";
  raw = raw.replace(/\s+/g, " ").trim();
  // 去掉 HN 的 "Points: X # Comments: Y" 后缀，保留真正摘要
  if (sourceName.startsWith("Hacker News") || sourceName.startsWith("HN")) {
    // 尝试提取 Article URL 之前的描述
    const parts = raw.split(/Article URL:|Comments URL:/);
    if (parts.length > 1) {
      raw = parts[0].trim();
    }
    // 去掉 Points / Comments 行
    raw = raw.replace(/\s*Points:\s*\d+/, "").replace(/\s*# Comments:\s*\d+/, "").trim();
  }
  if (raw.length > 250) raw = raw.slice(0, 250);
  return raw;
}

// ── 获取 Reddit JSON 热度数据（用于补充分数） ──
async function fetchRedditScores(subreddit, limit = 8) {
  try {
    const resp = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      { headers: { "User-Agent": "aDiaoYa-Blog-NewsBot/1.0" } }
    );
    const json = await resp.json();
    const map = new Map();
    for (const child of json.data.children) {
      const d = child.data;
      map.set(d.title, { score: d.score || 0, comments: d.num_comments || 0 });
      // 也存 permalink
      if (d.permalink) map.set("https://www.reddit.com" + d.permalink, { score: d.score || 0, comments: d.num_comments || 0 });
    }
    return map;
  } catch {
    return new Map();
  }
}

// ── 主函数 ──
async function fetchAll() {
  const allItems = [];
  const fetchDate = new Date().toISOString().split("T")[0];

  // 先获取 Reddit 热度数据
  const [progScores, mlScores] = await Promise.all([
    fetchRedditScores("programming", 8),
    fetchRedditScores("MachineLearning", 8),
  ]);
  const redditScoreMap = new Map([...progScores, ...mlScores]);

  for (const feed of FEEDS) {
    try {
      console.log(`📡 抓取 ${feed.name} ...`);
      const result = await parser.parseURL(feed.url);
      const items = (result.items || []).slice(0, 6).map((item) => {
        let score = extractScore(item, feed.name);
        // 用 Reddit JSON 数据补充分数
        if (feed.name.startsWith("Reddit") && redditScoreMap.has(item.title)) {
          score = redditScoreMap.get(item.title).score;
        }
        return {
          title: (item.title || "").trim(),
          link: item.link || "",
          source: feed.name,
          tags: feed.tags,
          date: item.pubDate || item.isoDate || "",
          summary: cleanSummary(item, feed.name),
          score: score,
        };
      });
      console.log(`   ✅ 获取 ${items.length} 条`);
      allItems.push(...items);
    } catch (err) {
      console.log(`   ❌ 失败: ${err.message}`);
    }
  }

  // 去重（按 link）
  const seen = new Set();
  const deduped = allItems.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  // 按热度分数降序排序（同分按日期降序）
  deduped.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.date) - new Date(a.date);
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
  console.log(`🔥 热度排名前5:`);
  deduped.slice(0, 5).forEach((item, i) => {
    console.log(`  ${i + 1}. [${item.score}🔥] ${item.title.slice(0, 60)}`);
  });
}

fetchAll().catch((err) => {
  console.error("抓取失败:", err);
  process.exit(1);
});
