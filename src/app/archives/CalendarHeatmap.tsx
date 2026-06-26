"use client";

import { useEffect, useRef } from "react";
import type { Post } from "@/lib/types";

type DayData = {
  date: string;
  count: number;
  level: number;
  day: number; // 0=Sun ... 6=Sat
  month: number; // 0-based
  year: number;
};

type WeekData = DayData[];

type YearHeatmap = {
  weeks: WeekData[];
  monthLabels: { weekIdx: number; label: string }[];
  monthWeeks: number[];
};

function buildYearHeatmap(
  year: number,
  countByDate: Record<string, number>
): YearHeatmap {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  // 向前补齐到周一
  const s = new Date(yearStart);
  while (s.getDay() !== 1) s.setDate(s.getDate() - 1);

  // 向后补齐到周日
  const e = new Date(yearEnd);
  while (e.getDay() !== 0) e.setDate(e.getDate() + 1);

  const days: DayData[] = [];
  const cur = new Date(s);
  while (cur <= e) {
    const key = [
      cur.getFullYear(),
      String(cur.getMonth() + 1).padStart(2, "0"),
      String(cur.getDate()).padStart(2, "0"),
    ].join("-");
    const count = countByDate[key] || 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
    days.push({
      date: key,
      count,
      level,
      day: cur.getDay(),
      month: cur.getMonth(),
      year: cur.getFullYear(),
    });
    cur.setDate(cur.getDate() + 1);
  }

  // 按周分组
  const weeks: WeekData[] = [];
  let week: DayData[] = [];
  days.forEach((d) => {
    week.push(d);
    if (d.day === 0) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) weeks.push(week);

  // 月份标签（仅记录目标年份的月份，忽略溢出日期）
  const monthLabels: { weekIdx: number; label: string }[] = [];
  const monthWeeks: number[] = [];
  let lastMonth = -1;
  days.forEach((d, idx) => {
    if (d.month !== lastMonth) {
      const wi = Math.floor(idx / 7);
      if (
        d.year === year &&
        (monthLabels.length === 0 || wi !== monthLabels[monthLabels.length - 1].weekIdx)
      ) {
        monthLabels.push({ weekIdx: wi, label: d.month + 1 + "月" });
        monthWeeks.push(wi);
      }
      lastMonth = d.month;
    }
  });

  return { weeks, monthLabels, monthWeeks };
}

export default function CalendarHeatmap({ posts }: { posts: Post[] }) {
  const wrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const currentYear = new Date().getFullYear();

  // 构建每日文章计数
  const countByDate: Record<string, number> = {};
  posts.forEach((post) => {
    const d = new Date(post.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    countByDate[key] = (countByDate[key] || 0) + 1;
  });

  // 收集有文章的年份 + 当年 + 下一年
  const yearsSet = new Set<number>();
  Object.keys(countByDate).forEach((d) => yearsSet.add(parseInt(d.substring(0, 4))));
  yearsSet.add(currentYear);
  yearsSet.add(currentYear + 1);
  const calendarYears = Array.from(yearsSet).sort((a, b) => a - b);

  // 为每个年份生成数据
  const yearData: Record<number, YearHeatmap> = {};
  calendarYears.forEach((y) => {
    yearData[y] = buildYearHeatmap(y, countByDate);
  });

  const getMaxWeeks = () => {
    let maxW = 0;
    calendarYears.forEach((y) => {
      if (yearData[y] && yearData[y].weeks.length > maxW) maxW = yearData[y].weeks.length;
    });
    return maxW;
  };
  const maxWeeks = getMaxWeeks();
  const gridTemplateColumns = `repeat(${maxWeeks}, 14px)`;

  // 切换年份
  function switchYear(year: number) {
    // 更新徽章
    document.querySelectorAll(".year-badge").forEach((b) => {
      const el = b as HTMLButtonElement;
      el.classList.toggle("current", el.dataset.year === String(year));
      el.setAttribute("aria-pressed", el.dataset.year === String(year) ? "true" : "false");
    });
    // 显示/隐藏
    Object.entries(yearData).forEach(([y]) => {
      const w = wrapperRefs.current[y];
      if (w) w.hidden = y !== String(year);
    });
  }

  // 页面加载后滚动到当前年份最近几周
  useEffect(() => {
    const timer = setTimeout(() => {
      const w = wrapperRefs.current[currentYear];
      if (w && !w.hidden) {
        const weeks = w.querySelectorAll(".heatmap-week");
        if (weeks.length > 8) {
          const targetWeek = weeks[weeks.length - 8] as HTMLElement;
          w.scrollTo({ left: targetWeek.offsetLeft - 24, behavior: "instant" as ScrollBehavior });
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentYear, yearData]);

  return (
    <>
      {/* 发布日历 */}
      {Object.keys(yearData).length > 0 && (
        <section className="calendar-heatmap">
          <div className="heatmap-header">
            <h3 className="heatmap-title">发布日历</h3>
            {calendarYears.length > 1 && (
              <div className="heatmap-year-badges">
                {calendarYears.map((y) => (
                  <button
                    key={y}
                    className={`year-badge${y === currentYear ? " current" : ""}`}
                    data-year={y}
                    aria-pressed={y === currentYear ? "true" : "false"}
                    onClick={() => switchYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {calendarYears.map((y) => {
            const data = yearData[y];
            if (!data || !data.weeks.length) return null;
            const isCurrent = y === currentYear;
            return (
              <div
                key={y}
                className="heatmap-wrapper"
                data-year={y}
                hidden={!isCurrent || undefined}
                ref={(el) => {
                  wrapperRefs.current[y] = el;
                }}
              >
                <div
                  className="heatmap-months"
                  style={{ gridTemplateColumns }}
                >
                  {data.monthLabels.map((m, mi) => (
                    <span
                      key={mi}
                      className="month-label"
                      style={{
                        gridColumn: m.weekIdx + 1,
                        paddingLeft: mi * 6 + "px",
                      }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
                <div className="heatmap-grid">
                  <div className="heatmap-weekdays">
                    <span>一</span>
                    <span>二</span>
                    <span>三</span>
                    <span>四</span>
                    <span>五</span>
                    <span>六</span>
                    <span>日</span>
                  </div>
                  <div className="heatmap-cells">
                    {data.weeks.map((w, wi) => {
                      const isMonthStart = data.monthWeeks.indexOf(wi) >= 0;
                      return (
                        <div
                          key={wi}
                          className={`heatmap-week${isMonthStart ? " month-start" : ""}`}
                        >
                          {w.map((day, di) => (
                            <div
                              key={di}
                              className={`heatmap-cell level-${day.level}`}
                              title={`${day.date} · ${day.count} 篇`}
                              data-count={day.count}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="heatmap-legend">
            <span>少</span>
            <span className="legend-cell level-0" />
            <span className="legend-cell level-1" />
            <span className="legend-cell level-2" />
            <span className="legend-cell level-3" />
            <span className="legend-cell level-4" />
            <span>多</span>
          </div>
        </section>
      )}
    </>
  );
}
