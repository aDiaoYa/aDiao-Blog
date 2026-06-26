"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  今日黄历 — 1:1 还原 Hexo archive.ejs 中的 almanac-card           */
/* ------------------------------------------------------------------ */

interface AlmanacData {
  weekLabel: string;
  dateStr: string;
  lunarStr: string;
  ganzhiStr: string;
  shengxiao: string;
  jieQi: string;
  yi: string[];
  ji: string[];
}

async function fetchAlmanac(): Promise<AlmanacData> {
  const weekNames = ["日", "一", "二", "三", "四", "五", "六"];
  const today = new Date();
  const weekLabel = `星期${weekNames[today.getDay()]}`;
  const dateStr = `${today.getFullYear()} · ${String(today.getMonth() + 1).padStart(2, "0")} · ${String(today.getDate()).padStart(2, "0")}`;

  try {
    // lunar-javascript 是 CJS 模块，Next.js dynamic import 将 exports 放在 default 下
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lunarLib: any = await import("lunar-javascript");
    const Lunar = lunarLib.Lunar || lunarLib.default?.Lunar;
    if (!Lunar) throw new Error("无法加载 Lunar 类");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lunar: any = Lunar.fromDate(today);
    return {
      weekLabel,
      dateStr,
      lunarStr: `农历 ${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      ganzhiStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
      shengxiao: lunar.getYearShengXiao() || "",
      jieQi: lunar.getJieQi() || "",
      yi: lunar.getDayYi() || [],
      ji: lunar.getDayJi() || [],
    };
  } catch {
    return {
      weekLabel,
      dateStr,
      lunarStr: "农历加载失败",
      ganzhiStr: "",
      shengxiao: "",
      jieQi: "",
      yi: [],
      ji: [],
    };
  }
}

export default function AlmanacCard() {
  const [data, setData] = useState<AlmanacData | null>(null);

  useEffect(() => {
    fetchAlmanac().then(setData);
  }, []);

  if (!data) {
    return (
      <section className="almanac-card">
        <div className="almanac-header">
          <svg className="almanac-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3 className="almanac-title">今日黄历</h3>
        </div>
        <div className="almanac-body">
          <div className="almanac-solar">
            <span className="almanac-date-big">加载中…</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="almanac-card">
      <div className="almanac-header">
        <svg className="almanac-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <h3 className="almanac-title">今日黄历</h3>
      </div>
      <div className="almanac-body">
        <div className="almanac-solar">
          <span className="almanac-date-big">{data.dateStr}</span>
          <span className="almanac-weekday">{data.weekLabel}</span>
        </div>
        <div className="almanac-lunar">
          <span className="almanac-lunar-date">{data.lunarStr}</span>
          {data.ganzhiStr && <span className="almanac-ganzhi">{data.ganzhiStr}</span>}
        </div>
        <div className="almanac-meta">
          {data.shengxiao && <span className="almanac-shengxiao">生肖 {data.shengxiao}</span>}
          {data.jieQi && <span className="almanac-jieqi">节气 {data.jieQi}</span>}
        </div>
        {(data.yi.length > 0 || data.ji.length > 0) && (
          <div className="almanac-advice">
            {data.yi.length > 0 && (
              <div className="almanac-yi">
                <span className="almanac-label yi-label">宜</span>
                <span>{data.yi.slice(0, 8).join(" ")}</span>
              </div>
            )}
            {data.ji.length > 0 && (
              <div className="almanac-ji">
                <span className="almanac-label ji-label">忌</span>
                <span>{data.ji.slice(0, 8).join(" ")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
