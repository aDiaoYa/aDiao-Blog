/**
 * 每日 AI/前端 新闻抓取脚本
 * AI: OpenAI / Google AI / 机器之心 / 51CTO AI / AI News / HN / Reddit / ArXiv / HuggingFace / VentureBeat
 * 前端: Dev.to / CSS-Tricks / Smashing / Reddit / HN
 * 输出: 10条AI + 10条前端，按热度排名
 */
const RssParser = require("rss-parser");
const fs = require("fs");
const path = require("path");

const parser = new RssParser({
  timeout: 15000,
  headers: { "User-Agent": "aDiaoYa-Blog-NewsBot/1.0" },
});

// ══════════════════════════════════════
// AI 资讯源
// ══════════════════════════════════════
const AI_FEEDS = [
  // 顶级大模型官方
  { url: "https://openai.com/blog/rss.xml",                     name: "OpenAI",        tags: ["AI"] },
  // Anthropic 无 RSS，用 HN/Reddit 覆盖 Claude 相关
  { url: "https://blog.google/technology/ai/rss/",              name: "Google AI",     tags: ["AI"] },
  // 中文权威 AI 媒体
  { url: "https://jiqizhixin.com/rss",                          name: "机器之心",      tags: ["AI"] },
  { url: "https://aiera.51cto.com/feed",                        name: "51CTO AI",      tags: ["AI"] },
  // 技术社区 AI
  { url: "https://www.reddit.com/r/MachineLearning/.rss",       name: "Reddit ML",     tags: ["AI"] },
  { url: "https://www.reddit.com/r/artificial/.rss",            name: "Reddit AI",     tags: ["AI"] },
  { url: "https://www.reddit.com/r/LocalLLaMA/.rss",            name: "Reddit LLaMA",  tags: ["AI"] },
  { url: "https://hnrss.org/frontpage?count=10&q=AI+OR+LLM+OR+GPT+OR+Claude+OR+OpenAI+OR+Gemini+OR+deepseek", name: "HN·AI", tags: ["AI"] },
  // 学术 / 开源
  { url: "http://export.arxiv.org/rss/cs.AI",                   name: "ArXiv AI",     tags: ["AI"] },
  { url: "https://huggingface.co/blog/feed.xml",                name: "HuggingFace",  tags: ["AI"] },
  // 科技媒体 AI 频道
  { url: "https://venturebeat.com/category/ai/feed/",           name: "VentureBeat",  tags: ["AI"] },
  { url: "https://www.artificialintelligence-news.com/feed/",   name: "AI News",      tags: ["AI"] },
];

// ══════════════════════════════════════
// 前端技术源
// ══════════════════════════════════════
const FE_FEEDS = [
  { url: "https://www.reddit.com/r/programming/.rss",           name: "Reddit Prog",     tags: ["前端"] },
  { url: "https://www.reddit.com/r/javascript/.rss",            name: "Reddit JS",       tags: ["前端"] },
  { url: "https://www.reddit.com/r/webdev/.rss",                name: "Reddit WebDev",   tags: ["前端"] },
  { url: "https://www.reddit.com/r/typescript/.rss",            name: "Reddit TS",       tags: ["前端"] },
  { url: "https://dev.to/feed/tag/javascript",                  name: "Dev.to JS",       tags: ["前端"] },
  { url: "https://dev.to/feed/tag/typescript",                  name: "Dev.to TS",       tags: ["前端"] },
  { url: "https://dev.to/feed/tag/react",                       name: "Dev.to React",    tags: ["前端"] },
  { url: "https://dev.to/feed/tag/nextjs",                      name: "Dev.to Next.js",  tags: ["前端"] },
  { url: "https://dev.to/feed/tag/webdev",                      name: "Dev.to WebDev",   tags: ["前端"] },
  { url: "https://css-tricks.com/feed/",                        name: "CSS-Tricks",      tags: ["前端"] },
  { url: "https://www.smashingmagazine.com/feed/",              name: "Smashing Mag",    tags: ["前端"] },
  { url: "https://hnrss.org/frontpage?count=10&q=javascript+OR+typescript+OR+react+OR+vue+OR+CSS+OR+web+OR+frontend", name: "HN·前端", tags: ["前端"] },
];

// ── 提取 HN 热度分数 ──
function extractHNScore(item) {
  const text = (item.contentSnippet || item.content || "");
  const m = text.match(/Points:\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : 5;
}

// ── 默认热度 ──
function getDefaultScore(sourceName) {
  if (sourceName.includes("Reddit")) return 40;
  if (sourceName.includes("Dev.to")) return 15;
  if (sourceName.includes("HN")) return 20;
  if (sourceName.includes("ArXiv")) return 25;
  if (sourceName === "OpenAI" || sourceName === "Google AI") return 80;
  if (sourceName === "HuggingFace") return 55;
  if (sourceName === "机器之心" || sourceName === "AI News") return 60;
  if (sourceName === "51CTO AI") return 50;
  if (sourceName === "CSS-Tricks" || sourceName === "Smashing Mag") return 30;
  if (sourceName === "VentureBeat") return 45;
  return 20;
}

// ── 清理摘要 ──
function cleanSummary(item, sourceName) {
  let raw = item.contentSnippet || item.content || "";
  raw = raw.replace(/\s+/g, " ").replace(/&#?[a-z0-9]+;/gi, "").trim();
  if (sourceName.includes("HN")) {
    raw = raw.replace(/Points:\s*\d+/, "").replace(/# Comments:\s*\d+/, "").trim();
  }
  if (raw.length > 200) raw = raw.slice(0, 200);
  return raw;
}

// ── Google 翻译 ──
async function translateText(text) {
  if (!text || text.length < 2) return text;
  try {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=" + encodeURIComponent(text);
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await resp.json();
    if (data && data[0]) return data[0].map((seg) => seg[0]).join("");
    return text;
  } catch {
    return text;
  }
}

// ── 拉取 Reddit JSON 热度（不可用时降级为 RSS 默认分）──
async function getRedditScores(subreddit, limit = 12) {
  try {
    const resp = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; aDiaoYa-Blog-NewsBot/1.0)",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    const map = new Map();
    for (const child of json.data.children) {
      const d = child.data;
      map.set(d.title, { score: d.score || 0, comments: d.num_comments || 0 });
      map.set("https://www.reddit.com" + d.permalink, { score: d.score || 0, comments: d.num_comments || 0 });
    }
    return map;
  } catch (err) {
    console.log(`     ⚠️ Reddit r/${subreddit} 热度获取失败 (${err.message})，使用 RSS 默认分`);
    return new Map();
  }
}

// ── 抓取一组 feed → 返回文章数组 ──
async function fetchFeeds(feedList, redditScoreMap) {
  const items = [];
  for (const feed of feedList) {
    try {
      console.log(`  📡 ${feed.name} ...`);
      const result = await parser.parseURL(feed.url);
      const batch = (result.items || []).slice(0, 8).map((item) => {
        let score = extractHNScore(item);
        // Reddit 用 JSON 分数覆盖 RSS 默认分
        if (feed.name.startsWith("Reddit")) {
          score = redditScoreMap.get(item.title)?.score || getDefaultScore(feed.name);
        }
        if (score <= 0) score = getDefaultScore(feed.name);
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
      console.log(`     ✅ ${batch.length} 条`);
      items.push(...batch);
    } catch (err) {
      console.log(`     ❌ 失败: ${err.message}`);
    }
  }
  return items;
}

// ── 去重 + 排序 + 截断 ──
function dedupeAndSort(items, limit) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    if (seen.has(item.link) || seen.has(item.title)) continue;
    seen.add(item.link);
    seen.add(item.title);
    deduped.push(item);
  }
  deduped.sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date));
  return deduped.slice(0, limit);
}

// ── 主函数 ──
async function main() {
  console.log("🚀 开始抓取 AI + 前端资讯\n");

  // 1) 获取所有 Reddit 子版块热度（JSON API 更准确）
  const redditSubs = ["programming", "javascript", "webdev", "typescript", "MachineLearning", "artificial", "LocalLLaMA"];
  const redditScoreMaps = await Promise.all(redditSubs.map((s) => getRedditScores(s, 12)));
  const redditScoreMap = new Map();
  redditScoreMaps.forEach((m) => { m.forEach((v, k) => redditScoreMap.set(k, v)); });
  console.log(`📊 Reddit 热度数据已加载 (${redditScoreMap.size} 条)\n`);

  // 2) 并行抓取 AI + 前端
  console.log("🤖 ── AI 资讯源 ──");
  const aiItems = await fetchFeeds(AI_FEEDS, redditScoreMap);
  console.log(`\n🎨 ── 前端资讯源 ──`);
  const feItems = await fetchFeeds(FE_FEEDS, redditScoreMap);

  // 3) 去重排序，各取 10 条
  const topAI = dedupeAndSort(aiItems, 10);
  const topFE = dedupeAndSort(feItems, 10);

  console.log(`\n📊 AI: ${aiItems.length} 条原始 → Top ${topAI.length} 条`);
  console.log(`📊 前端: ${feItems.length} 条原始 → Top ${topFE.length} 条`);

  // 4) 合并最终列表（AI在前，前端在后，各自按热度排）
  const finalItems = [...topAI, ...topFE];

  // 5) 翻译标题
  console.log("\n🌐 翻译标题到中文 ...");
  for (const item of finalItems) {
    item.titleZh = await translateText(item.title);
  }
  console.log("   翻译完成！");

  // 6) 写入 JSON
  const data = {
    updated: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0],
    count: finalItems.length,
    aiCount: topAI.length,
    feCount: topFE.length,
    items: finalItems,
  };

  const outDir = path.join(__dirname, "..", "source", "_data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "news.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`\n🎉 完成！共 ${finalItems.length} 条 → ${outPath}`);
  console.log(`\n🤖 AI Top 5:`);
  topAI.forEach((item, i) => console.log(`  ${i + 1}. [${item.score}🔥 ${item.source}] ${item.title.slice(0, 55)}`));
  console.log(`\n🎨 前端 Top 5:`);
  topFE.forEach((item, i) => console.log(`  ${i + 1}. [${item.score}🔥 ${item.source}] ${item.title.slice(0, 55)}`));
}

main().catch((err) => {
  console.error("抓取失败:", err);
  process.exit(1);
});
