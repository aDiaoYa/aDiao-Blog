"use client";

import { useEffect, useState, useCallback } from "react";
import ReadingProgress from "@/components/ReadingProgress";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { formatDateWithWeekday, getTodayKey, pad } from "@/lib/utils";
import type { PlanItem, PlanDayData } from "@/types";

const STORAGE_KEY = "adiao_plan_data";

const CAT_LABELS: Record<string, string> = {
  work: "💼 工作",
  study: "📚 学习",
  life: "🏠 生活",
  sport: "🏃 运动",
  other: "📌 其他",
};

function loadData(): Record<string, PlanDayData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();
    if (!data[today]) data[today] = { items: [], summary: "" };
    return data;
  } catch {
    return {};
  }
}

function saveData(data: Record<string, PlanDayData>) {
  const keys = Object.keys(data).sort().slice(-7);
  const trimmed: Record<string, PlanDayData> = {};
  keys.forEach((k) => (trimmed[k] = data[k]));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

let idCounter = 0;
function genId() {
  return `p${Date.now()}_${idCounter++}`;
}

export default function PlanPage() {
  const [todayData, setTodayData] = useState<PlanDayData>({ items: [], summary: "" });
  const [filter, setFilter] = useState<string>("all");

  // 表单受控状态
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formCategory, setFormCategory] = useState("work");
  const [formNote, setFormNote] = useState("");
  const [summaryText, setSummaryText] = useState("");

  const refresh = useCallback(() => {
    const data = loadData();
    const today = data[getTodayKey()] || { items: [], summary: "" };
    setTodayData(today);
    setSummaryText(today.summary || "");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateToday(newData: PlanDayData) {
    const data = loadData();
    data[getTodayKey()] = newData;
    saveData(data);
    setTodayData(newData);
  }

  function addItem() {
    const title = formTitle.trim();
    if (!title) return;
    const newData = { ...todayData };
    newData.items.push({
      id: genId(),
      title,
      time: formTime.trim(),
      category: formCategory,
      note: formNote.trim(),
      done: false,
      createdAt: Date.now(),
    });
    updateToday(newData);
    setFormTitle("");
    setFormTime("");
    setFormNote("");
  }

  function toggleItem(id: string) {
    const newData = { ...todayData };
    const item = newData.items.find((i) => i.id === id);
    if (item) item.done = !item.done;
    updateToday(newData);
  }

  function deleteItem(id: string) {
    if (!confirm("确定删除这条行程吗？")) return;
    const newData = { ...todayData };
    newData.items = newData.items.filter((i) => i.id !== id);
    updateToday(newData);
  }

  function clearDone() {
    const doneCount = todayData.items.filter((i) => i.done).length;
    if (doneCount === 0) { alert("没有已完成的行程"); return; }
    if (!confirm(`确定清除 ${doneCount} 条已完成的行程吗？`)) return;
    const newData = { ...todayData };
    newData.items = newData.items.filter((i) => !i.done);
    updateToday(newData);
  }

  function resetToday() {
    if (!confirm("确定要清空今天所有计划和总结吗？此操作不可恢复！")) return;
    updateToday({ items: [], summary: "" });
    setSummaryText("");
  }

  function saveSummary() {
    updateToday({ ...todayData, summary: summaryText });
  }

  const filtered = filter === "all" ? todayData.items : todayData.items.filter((i) => i.category === filter);
  const done = todayData.items.filter((i) => i.done).length;
  const total = todayData.items.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const dateStr = formatDateWithWeekday(new Date());

  return (
    <>
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="home-main">
          <section className="content-panel content-full">
            <div className="plan-page">
              <div className="plan-header">
                <h1>📋 每日计划</h1>
                <p className="plan-date">{dateStr}</p>
              </div>

              <div className="plan-stats">
                <div className="ps-item">
                  <span className="ps-num">{total}</span>
                  <span className="ps-label">总任务</span>
                </div>
                <div className="ps-item">
                  <span className="ps-num">{done}</span>
                  <span className="ps-label">已完成</span>
                </div>
                <div className="ps-item">
                  <span className="ps-num">{total - done}</span>
                  <span className="ps-label">待完成</span>
                </div>
                <div className="ps-item">
                  <span className="ps-num">{progress}%</span>
                  <span className="ps-label">完成率</span>
                </div>
              </div>

              <div className="plan-progress-bar">
                <div className="plan-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="plan-add-section">
                <h3>✏️ 添加行程</h3>
                <div className="plan-form">
                  <div className="pf-row">
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="任务标题..."
                      maxLength={80}
                      className="pf-title"
                      onKeyDown={(e) => e.key === "Enter" && addItem()}
                    />
                    <input
                      type="text"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      placeholder="时间（如 09:00）"
                      maxLength={20}
                      className="pf-time"
                    />
                  </div>
                  <div className="pf-row pf-row-bottom">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="pf-category"
                    >
                      <option value="work">💼 工作</option>
                      <option value="study">📚 学习</option>
                      <option value="life">🏠 生活</option>
                      <option value="sport">🏃 运动</option>
                      <option value="other">📌 其他</option>
                    </select>
                    <input
                      type="text"
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      placeholder="备注（可选）"
                      maxLength={120}
                      className="pf-note"
                    />
                    <button className="pf-add-btn" onClick={addItem}>添加</button>
                  </div>
                </div>
              </div>

              <div className="plan-filter-bar">
                {["all", "work", "study", "life", "sport", "other"].map((cat) => (
                  <button
                    key={cat}
                    className={`pfilt-btn${filter === cat ? " active" : ""}`}
                    onClick={() => setFilter(cat)}
                  >
                    {cat === "all" ? "全部" : CAT_LABELS[cat]}
                  </button>
                ))}
              </div>

              <div className="plan-list">
                {filtered.length === 0 ? (
                  <p className="plan-empty">📭 今天还没有计划，添加第一个任务吧～</p>
                ) : (
                  filtered.map((item) => (
                    <div key={item.id} className={`plan-item${item.done ? " plan-item-done" : ""}`} data-cat={item.category}>
                      <button className="pi-check" title={item.done ? "标记未完成" : "标记完成"} onClick={() => toggleItem(item.id)}>
                        {item.done ? "✅" : "⬜"}
                      </button>
                      <div className="pi-body">
                        <div className="pi-top">
                          <span className="pi-title">{item.title}</span>
                          <span className={`pi-cat pi-cat-${item.category}`}>{CAT_LABELS[item.category]}</span>
                          {item.time && <span className="pi-time">🕐 {item.time}</span>}
                        </div>
                        {item.note && <div className="pi-note">{item.note}</div>}
                      </div>
                      <button className="pi-delete" title="删除" onClick={() => deleteItem(item.id)}>✕</button>
                    </div>
                  ))
                )}
              </div>

              <div className="plan-summary-section">
                <h3>📝 每日总结</h3>
                <textarea
                  className="plan-summary-input"
                  placeholder="记录今天的收获、感悟、待改进的地方..."
                  maxLength={1000}
                  rows={4}
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                />
                <div className="ps-actions">
                  <span className="ps-save-hint" />
                  <button className="pf-add-btn ps-save-btn" onClick={saveSummary}>保存总结</button>
                </div>
              </div>

              <div className="plan-actions">
                <button className="plan-action-btn" onClick={clearDone}>🗑️ 清除已完成</button>
                <button className="plan-action-btn plan-action-danger" onClick={resetToday}>⚠️ 重置今日</button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
