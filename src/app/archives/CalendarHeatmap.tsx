"use client";

import { useEffect } from "react";
import type { Post } from "@/lib/types";

const LEVEL_COLORS = ["", "level-1", "level-2", "level-3", "level-4"];

export default function CalendarHeatmap({ posts }: { posts: Post[] }) {
  useEffect(() => {
    // 黄历初始化
    async function initAlmanac() {
      try {
        const { Lunar } = await import("lunar-javascript");
        const today = new Date();
        const lunar = Lunar.fromDate(today);

        const el = document.getElementById("almanac-lunar");
        if (el) {
          el.innerHTML = `
            <span class="almanac-lunar-date">农历 ${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}</span>
            <span class="almanac-ganzhi">${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日</span>
          `;
        }

        const metaEl = document.getElementById("almanac-meta");
        if (metaEl) {
          let html = `<span class="almanac-shengxiao">生肖 ${lunar.getYearShengXiao()}</span>`;
          const jieQi = lunar.getJieQi();
          if (jieQi) html += `<span class="almanac-jieqi">节气 ${jieQi}</span>`;
          metaEl.innerHTML = html;
        }

        const adviceEl = document.getElementById("almanac-advice");
        if (adviceEl) {
          const yi = lunar.getDayYi();
          const ji = lunar.getDayJi();
          let html = "";
          if (yi?.length) html += `<div class="almanac-yi"><span class="almanac-label yi-label">宜</span><span>${yi.slice(0, 8).join(" ")}</span></div>`;
          if (ji?.length) html += `<div class="almanac-ji"><span class="almanac-label ji-label">忌</span><span>${ji.slice(0, 8).join(" ")}</span></div>`;
          adviceEl.innerHTML = html;
        }

        const wdEl = document.getElementById("almanac-weekday");
        if (wdEl) {
          const weekNames = ["日", "一", "二", "三", "四", "五", "六"];
          wdEl.textContent = `星期${weekNames[today.getDay()]}`;
        }
      } catch {
        // lunar lib failed silently
      }
    }
    initAlmanac();
  }, []);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentYear = today.getFullYear();

  // Build post count by date
  const countByDate: Record<string, number> = {};
  posts.forEach((post) => {
    const d = new Date(post.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    countByDate[key] = (countByDate[key] || 0) + 1;
  });

  // Build heatmap for current year
  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  // Generate all days in year
  const days: { date: string; count: number; level: number; dayOfWeek: number }[] = [];
  const start = new Date(currentYear, 0, 1);
  // Go back to Monday
  while (start.getDay() !== 1) start.setDate(start.getDate() - 1);
  const end = new Date(currentYear, 11, 31);
  while (end.getDay() !== 0) end.setDate(end.getDate() + 1);

  const cur = new Date(start);
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    const count = countByDate[key] || 0;
    const level = Math.min(count, 4);
    days.push({ date: key, count, level, dayOfWeek: cur.getDay() });
    cur.setDate(cur.getDate() + 1);
  }

  // Group into weeks
  const weeks: typeof days[] = [];
  let week: typeof days = [];
  days.forEach((d) => {
    week.push(d);
    if (d.dayOfWeek === 0) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) weeks.push(week);

  return (
    <>
      <section className="almanac-card">
        <div className="almanac-header">
          <svg className="almanac-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3 className="almanac-title">今日黄历</h3>
        </div>
        <div className="almanac-body">
          <div className="almanac-solar">
            <span className="almanac-date-big">
              {now.getFullYear()} · {String(now.getMonth() + 1).padStart(2, "0")} · {String(now.getDate()).padStart(2, "0")}
            </span>
            <span className="almanac-weekday" id="almanac-weekday" />
          </div>
          <div className="almanac-lunar" id="almanac-lunar">
            <span className="almanac-lunar-date">加载中…</span>
            <span className="almanac-ganzhi" />
          </div>
          <div className="almanac-meta" id="almanac-meta" />
          <div className="almanac-advice" id="almanac-advice" />
        </div>
      </section>

      <section className="calendar-heatmap">
        <div className="heatmap-header">
          <h3 className="heatmap-title">发布日历</h3>
        </div>
        <div className="heatmap-wrapper">
          <div className="heatmap-months">
            {months.map((m, i) => (
              <span key={m} className="month-label" style={{ gridColumn: `${i * 5 + 1}` }}>
                {m}
              </span>
            ))}
          </div>
          <div className="heatmap-grid">
            <div className="heatmap-weekdays">
              <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
            </div>
            <div className="heatmap-cells">
              {weeks.map((w, wi) => (
                <div key={wi} className="heatmap-week">
                  {w.filter((d) => d.date).map((d, di) => (
                    <div
                      key={di}
                      className={`heatmap-cell ${LEVEL_COLORS[d.level] || ""}`}
                      title={`${d.date} · ${d.count} 篇`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="heatmap-legend">
          <span>少</span>
          <span className="legend-cell" />
          <span className="legend-cell level-1" />
          <span className="legend-cell level-2" />
          <span className="legend-cell level-3" />
          <span className="legend-cell level-4" />
          <span>多</span>
        </div>
      </section>
    </>
  );
}
