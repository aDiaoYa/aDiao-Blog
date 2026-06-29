"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";

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

interface SidebarProps {
  /** 服务端预加载数据（可选，有则跳过客户端 fetch） */
  data?: SidebarData;
}

export default function Sidebar({ data: serverData }: SidebarProps) {
  const [data, setData] = useState<SidebarData | null>(serverData || null);

  useEffect(() => {
    // 如果服务端已传入数据，不再请求
    if (serverData) return;
    fetch(`${SITE.basePath}/sidebar-data.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [serverData]);

  return (
    <aside className="side-panel" aria-label="博客信息">
      {/* 个人资料 */}
      <section className="profile-card">
        <div className="profile-avatar">
          <span className="avatar-text">A</span>
        </div>
        <h2>{SITE.title}</h2>
        <p className="profile-bio">
          你好，我是啊叼一只鱼(aDiaoYa)，一名努力升级进化的前端开发工程师，目前专注于前端与AI
          Agent相关技术探索和实践，奉行&ldquo;人有多大胆，地有多大产&rdquo;的理念。对了，我的麦子快熟了，你要陪我一起静候再静候嘛？
        </p>
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
