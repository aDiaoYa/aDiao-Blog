import type { Metadata } from "next";
import Link from "next/link";
import { getPublicPosts } from "@/lib/posts";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
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

            <section className="archive-list">
              {[...posts]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((post) => {
                  const d = new Date(post.date);
                  return (
                    <Link key={post.slug} className="archive-item" href={`/posts/${post.slug}`}>
                      <time dateTime={post.date}>
                        {d.getFullYear()} · {String(d.getMonth() + 1).padStart(2, "0")} ·{" "}
                        {String(d.getDate()).padStart(2, "0")}
                      </time>
                      <span>{post.title}</span>
                      <span className="archive-arrow">→</span>
                    </Link>
                  );
                })}
            </section>
          </section>

          <Sidebar />
        </main>

        <Footer />
      </div>
    </>
  );
}
