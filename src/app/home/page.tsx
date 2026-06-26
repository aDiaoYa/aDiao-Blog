import type { Metadata } from "next";
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

export default function HomePage() {
  const allPosts = getPostsMeta();
  const totalPages = Math.ceil(allPosts.length / PER_PAGE);
  const posts = allPosts.slice(0, PER_PAGE);
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

            <Paginator current={1} total={totalPages} basePath="/home" />
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
