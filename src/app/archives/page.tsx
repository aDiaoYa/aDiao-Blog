import type { Metadata } from "next";
import { getPublicPosts, getCategories, getTags } from "@/lib/posts";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
import ArticleList from "@/components/ArticleList";
import CalendarHeatmap from "./CalendarHeatmap";
import AlmanacCard from "@/components/AlmanacCard";

export const metadata: Metadata = {
  title: "文章归档",
};

export default function ArchivesPage() {
  const posts = getPublicPosts();
  const categories = getCategories();
  const tags = getTags().slice(0, 15);
  const recent = posts.slice(0, 5).map((p) => ({
    title: p.title,
    slug: p.slug,
    date: p.date,
  }));

  // 预构建 Sidebar 数据，避免客户端额外 fetch
  const sidebarData = {
    postCount: posts.length,
    categories,
    tags,
    recent,
  };

  return (
    <>
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="layout-grid">
          <section className="content-panel">
            <section className="archive-head">
              <p className="eyebrow">Archive</p>
              <h1>文章归档</h1>
              <p>共 {posts.length} 篇</p>
            </section>

            <AlmanacCard />
            <CalendarHeatmap posts={posts} />
            <ArticleList posts={posts} />
          </section>

          <Sidebar data={sidebarData} />
        </main>

        <Footer />
      </div>
    </>
  );
}
