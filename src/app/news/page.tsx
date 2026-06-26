"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import P5Canvas from "@/components/P5Canvas";
import ReadingProgress from "@/components/ReadingProgress";
import type { NewsData, NewsItem } from "@/lib/types";

export default function NewsPage() {
  const [news, setNews] = useState<NewsData | null>(null);
  const [zhVisible, setZhVisible] = useState(false);
  const [filter, setFilter] = useState("全部");

  useEffect(() => {
    fetch("/aDiao-Blog/data/news.json")
      .then((r) => r.json())
      .then((d) => setNews(d))
      .catch(() => setNews(null));
  }, []);

  const filtered =
    news?.items.filter((item) => {
      if (filter === "全部") return true;
      return (item.tags || []).includes(filter);
    }) || [];

  return (
    <>
      <P5Canvas />
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="layout-grid">
          <section className="content-panel">
            <div className="news-page">
              <div className="news-header">
                <h1>AI & 前端 · 每日资讯</h1>
                <p className="news-subtitle">
                  {news ? (
                    <>
                      更新时间：{new Date(news.updated).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}{" "}
                      · 共 <strong>{news.count}</strong> 条 · 按热度排名
                    </>
                  ) : (
                    "资讯抓取中，请稍后再来..."
                  )}
                </p>
              </div>

              {news && filtered.length > 0 ? (
                <>
                  <div className="news-toolbar">
                    <div className="news-filter-bar">
                      {["全部", "AI", "前端"].map((tag) => (
                        <button
                          key={tag}
                          className={`nf-btn${filter === tag ? " active" : ""}`}
                          onClick={() => setFilter(tag)}
                        >
                          {tag === "AI" ? "🤖 AI" : tag === "前端" ? "🎨 前端" : tag}
                        </button>
                      ))}
                    </div>
                    <button
                      className="nf-translate-all"
                      onClick={() => setZhVisible(!zhVisible)}
                    >
                      {zhVisible ? "↩️ 恢复英文" : "🌐 切换中文"}
                    </button>
                  </div>

                  <div className="news-list">
                    {filtered.map((item: NewsItem, idx: number) => (
                      <article key={idx} className="news-card">
                        <div className="nc-meta">
                          <span className="nc-source">{item.source}</span>
                          {item.score > 0 && (
                            <span className="nc-score" title="热度分数">
                              🔥 {item.score}
                            </span>
                          )}
                          <span className="nc-date">
                            {new Date(item.date).toLocaleDateString("zh-CN")}
                          </span>
                          <button
                            className="nc-translate-btn"
                            title="切换中/英文"
                            onClick={(e) => {
                              e.stopPropagation();
                              const card = e.currentTarget.closest(".news-card");
                              if (!card) return;
                              const orig = card.querySelector(".nc-title-orig") as HTMLElement;
                              const zh = card.querySelector(".nc-title-zh") as HTMLElement;
                              if (!orig || !zh) return;
                              const showZh = zh.style.display !== "none";
                              orig.style.display = showZh ? "" : "none";
                              zh.style.display = showZh ? "none" : "";
                              (e.currentTarget as HTMLButtonElement).textContent = showZh ? "🌐" : "↩️";
                            }}
                          >
                            🌐
                          </button>
                        </div>
                        <h2 className="nc-title">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener"
                            className="nc-title-orig"
                            style={{ display: zhVisible ? "none" : "" }}
                          >
                            {item.title}
                          </a>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener"
                            className="nc-title-zh"
                            style={{ display: zhVisible ? "" : "none" }}
                          >
                            {item.titleZh || item.title}
                          </a>
                        </h2>
                        <div className="nc-tags">
                          {(item.tags || []).map((t) => (
                            <span key={t} className="nc-tag">
                              {t}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>

                  <p className="news-footer-note">
                    数据来源：OpenAI · Google AI · 机器之心 · 51CTO AI · AI News · HuggingFace · Hacker News ·
                    Reddit · Dev.to · CSS-Tricks · Smashing · ArXiv · VentureBeat · 每天自动更新 · 标题已预翻译
                  </p>
                </>
              ) : (
                <div className="news-empty">
                  <p>📡 正在从各大平台抓取最新 AI / 前端资讯…</p>
                  <p>
                    请稍后刷新页面，或检查{" "}
                    <a
                      href="https://github.com/aDiaoYa/aDiao-Blog/actions/workflows/daily-news.yml"
                      target="_blank"
                      rel="noopener"
                    >
                      GitHub Actions
                    </a>{" "}
                    抓取状态。
                  </p>
                </div>
              )}
            </div>
          </section>

          <Sidebar />
        </main>

        <Footer />
      </div>
    </>
  );
}
