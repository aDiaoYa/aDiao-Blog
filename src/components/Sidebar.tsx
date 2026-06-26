"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CatInfo {
  name: string;
  count: number;
}

interface TagInfo {
  name: string;
  count: number;
}

interface RecentPost {
  title: string;
  slug: string;
  date: string;
}

interface SidebarData {
  postCount: number;
  categories: CatInfo[];
  tags: TagInfo[];
  recent: RecentPost[];
}

const sidebarTags = ["React", "TypeScript", "AI Agent", "Next.js", "MCP", "Node.js"];

export default function Sidebar() {
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    fetch("/aDiao-Blog/sidebar-data.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const tags = data?.tags || [];
  const maxCount = tags.length > 0 ? Math.max(...tags.map((t) => t.count), 1) : 1;

  return (
    <aside className="side-panel" aria-label="博客信息">
      {/* 个人资料 */}
      <section className="profile-card">
        <div className="profile-avatar">
          <span className="avatar-text">A</span>
        </div>
        <h2>aDiaoYa · 啊叼一只鱼</h2>
        <p className="profile-bio">
          你好，我是啊叼一只鱼(aDiaoYa)，一名努力升级进化的前端开发工程师，目前专注于前端与AI
          Agent相关技术探索和实践，奉行&ldquo;人有多大胆，地有多大产&rdquo;的理念。对了，我的麦子快熟了，你要陪我一起静候再静候嘛？
        </p>
        <div className="profile-tags">
          {sidebarTags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>

      {/* 统计 */}
      <section className="stats-card">
        <div className="stat-item">
          <span className="stat-num">{data?.postCount ?? "..."}</span>
          <span className="stat-label">文章</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">{data?.categories.length ?? "..."}</span>
          <span className="stat-label">分类</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">{data?.tags.length ?? "..."}</span>
          <span className="stat-label">标签</span>
        </div>
      </section>

      {/* 分类 */}
      {data?.categories && data.categories.length > 0 && (
        <section className="mini-list sidebar-categories">
          <h3>文章分类</h3>
          {data.categories.map((cat) => (
            <Link key={cat.name} href={`/categories/${cat.name}`}>
              <span>{cat.name}</span>
              <span className="cat-count">{cat.count}</span>
            </Link>
          ))}
        </section>
      )}

      {/* 标签云 */}
      {tags.length > 0 && (
        <section className="tag-cloud-card">
          <h3>标签云</h3>
          <div className="tag-cloud-wrap">
            {tags.map((t) => {
              const scale = 0.7 + (t.count / maxCount) * 0.6;
              const fontSize = (0.75 + scale * 0.5).toFixed(2);
              return (
                <Link
                  key={t.name}
                  href={`/tags/${t.name}`}
                  className="tag-bubble"
                  style={{ fontSize: `${fontSize}rem` }}
                  title={`${t.name}（${t.count}篇）`}
                >
                  {t.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 近期文章 */}
      {data?.recent && data.recent.length > 0 && (
        <section className="mini-list">
          <h3>近期文章</h3>
          {data.recent.map((post) => (
            <Link key={post.slug} href={`/posts/${post.slug}`}>
              <span>{post.title}</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                })}
              </time>
            </Link>
          ))}
        </section>
      )}
    </aside>
  );
}
