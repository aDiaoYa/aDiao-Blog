"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateToken, saveToken } from "@/lib/github";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    try {
      await validateToken(token.trim());
      saveToken(token.trim());
      router.push("/admin/dashboard");
    } catch {
      setError("Token 无效，请检查后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          博客后台
        </h1>
        <p className="admin-login-desc">
          使用 GitHub Personal Access Token 登录管理后台
        </p>

        <form onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>GitHub Token</span>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              autoFocus
            />
          </label>

          {error && (
            <div className="admin-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="admin-btn-primary" disabled={loading || !token.trim()}>
            {loading ? (
              <>
                <span className="admin-spinner" />
                验证中…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                登录
              </>
            )}
          </button>
        </form>

        <details className="admin-token-help">
          <summary>如何获取 Token？</summary>
          <ol>
            <li>打开 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">GitHub Token 设置</a></li>
            <li>点击 <strong>Generate new token (classic)</strong></li>
            <li>勾选 <code>repo</code> 权限后生成</li>
            <li>复制 token 到上方输入框登录</li>
          </ol>
        </details>
      </div>
    </div>
  );
}
