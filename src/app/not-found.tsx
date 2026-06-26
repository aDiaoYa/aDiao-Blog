"use client";

import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    const html = document.documentElement;
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      html.classList.add("dark");
    }

    const btn = document.getElementById("nf-theme-toggle");
    if (btn) {
      btn.textContent = html.classList.contains("dark") ? "☀️" : "🌙";
      btn.addEventListener("click", () => {
        html.classList.toggle("dark");
        localStorage.setItem("theme", html.classList.contains("dark") ? "dark" : "light");
        btn.textContent = html.classList.contains("dark") ? "☀️" : "🌙";
      });
    }
  }, []);

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--blue-400:#60a5fa;--blue-700:#1d4ed8;--slate-700:#334155;--muted:#64748b;--surface:#fff;--border:#e2e8f0;--accent:#2563eb;--accent-soft:#dbeafe}
        html.dark{--slate-700:#f1f5f9;--muted:#94a3b8;--surface:#1e293b;--border:#475569;--accent-soft:rgba(37,99,235,0.15);background:#0f172a}
        body{font-family:'Inter','PingFang SC','Microsoft YaHei',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0f4f8;padding:20px}
        html.dark body{background:#0f172a}
        .nf-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:48px 36px;text-align:center;max-width:480px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.06)}
        .nf-code{font-size:96px;font-weight:800;line-height:1;background:linear-gradient(135deg,var(--blue-400),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px}
        .nf-card h2{font-size:22px;font-weight:700;color:var(--slate-700);margin-bottom:8px}
        .nf-card p{color:var(--muted);font-size:15px;margin-bottom:28px}
        .nf-links{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
        .nf-links a{padding:8px 22px;border-radius:20px;font-size:14px;font-weight:600;text-decoration:none;transition:all .2s}
        .nf-home{background:var(--accent);color:#fff}.nf-home:hover{background:var(--blue-700)}
        .nf-link{border:1.5px solid var(--border);color:var(--slate-700)}.nf-link:hover{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
        html.dark .nf-link{color:#e2e8f0}
        .theme-btn{position:fixed;top:20px;right:20px;width:40px;height:40px;border:none;border-radius:50%;background:var(--surface);border:1px solid var(--border);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:all .2s}
        .theme-btn:hover{border-color:var(--accent)}
      `}</style>
      <button className="theme-btn" id="nf-theme-toggle" title="切换模式" aria-label="切换深色/浅色模式">
        🌙
      </button>
      <div className="nf-card">
        <div className="nf-code">404</div>
        <h2>页面未找到</h2>
        <p>你访问的页面可能已被删除、移动，或者从未存在过。</p>
        <div className="nf-links">
          <a className="nf-home" href="/aDiao-Blog/">返回首页</a>
          <a className="nf-link" href="/aDiao-Blog/home/">浏览文章</a>
          <a className="nf-link" href="/aDiao-Blog/archives/">归档</a>
        </div>
      </div>
    </>
  );
}
