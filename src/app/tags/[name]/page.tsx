import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsByTag, getTags } from "@/lib/posts";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
import ArticleList from "@/components/ArticleList";

interface Props {
  params: Promise<{ name: string }>;
}

export function generateStaticParams() {
  const tags = getTags().map((t) => ({ name: t.name }));
  return tags.length > 0 ? tags : [{ name: "null" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  return { title: `标签：${name}` };
}

export default async function TagPage({ params }: Props) {
  const { name } = await params;
  const posts = getPostsByTag(decodeURIComponent(name));
  if (posts.length === 0) notFound();

  return (
    <>
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="layout-grid">
          <section className="content-panel">
            <section className="archive-head">
              <p className="eyebrow">Tag</p>
              <h1>标签：{decodeURIComponent(name)}</h1>
              <p>共 {posts.length} 篇</p>
            </section>

            <ArticleList posts={posts} />
          </section>

          <Sidebar />
        </main>

        <Footer />
      </div>
    </>
  );
}
