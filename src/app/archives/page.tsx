import type { Metadata } from "next";
import { getPublicPosts } from "@/lib/posts";
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

          <Sidebar />
        </main>

        <Footer />
      </div>
    </>
  );
}
