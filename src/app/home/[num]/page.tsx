import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsMeta, getCategories } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import Paginator from "@/components/Paginator";
import CategoryFilter from "@/components/CategoryFilter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";

export const metadata: Metadata = {
  title: "文章",
  description: "一些碎片记录",
};

const PER_PAGE = 10;

interface Props {
  params: Promise<{ num: string }>;
}

export async function generateStaticParams() {
  const allPosts = getPostsMeta();
  const totalPages = Math.ceil(allPosts.length / PER_PAGE);
  // 首页是 /home（page 1），动态路由从 page 2 开始
  if (totalPages <= 1) return [{ num: "2" }]; // fallback
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    num: String(i + 2),
  }));
}

export default async function HomePageNum({ params }: Props) {
  const { num } = await params;
  const pageNum = parseInt(num, 10);

  if (isNaN(pageNum) || pageNum < 2) notFound();

  const allPosts = getPostsMeta();
  const totalPages = Math.ceil(allPosts.length / PER_PAGE);

  if (pageNum > totalPages || totalPages <= 1) notFound();

  const start = (pageNum - 1) * PER_PAGE;
  const posts = allPosts.slice(start, start + PER_PAGE);
  const categories = getCategories();

  return (
    <>
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="home-main">
          <section className="content-panel content-full">
            <section className="hero">
              <p className="eyebrow">Frontend × Agent</p>
              <h1>文章</h1>
              <p>一些碎片记录</p>
            </section>

            <CategoryFilter categories={categories} totalCount={allPosts.length} />

            <section className="waterfall" aria-label="文章列表">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.slug} post={post} />)
              ) : (
                <article className="empty-card">
                  <h2>还没有发布文章</h2>
                  <p>在 content/posts 中新增 Markdown 后，这里会自动显示文章列表。</p>
                </article>
              )}
            </section>

            <Paginator current={pageNum} total={totalPages} basePath="/home" />
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
