import type { Metadata } from "next";
import { getPostsMeta, getCategories } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import Paginator from "@/components/Paginator";
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

            {categories.length > 1 && (
              <nav className="category-filter" aria-label="分类筛选">
                <button className="cat-chip active" data-cat="all">
                  全部
                  {posts.length > 0 && <span className="cat-count">{posts.length}</span>}
                </button>
                {categories.map((cat) => (
                  <button key={cat.name} className="cat-chip" data-cat={cat.name}>
                    {cat.name}
                    <span className="cat-count">{cat.count}</span>
                  </button>
                ))}
              </nav>
            )}

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

            {/* 分类筛选脚本 */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function(){
                    var chips = document.querySelectorAll('.cat-chip');
                    var cards = document.querySelectorAll('.waterfall-card');
                    chips.forEach(function(chip) {
                      chip.addEventListener('click', function() {
                        var cat = this.dataset.cat;
                        chips.forEach(function(c) { c.classList.remove('active'); });
                        this.classList.add('active');
                        cards.forEach(function(card) {
                          if (cat === 'all' || card.dataset.category === cat) {
                            card.style.display = '';
                            setTimeout(function() { card.style.opacity = '1'; card.style.transform = ''; }, 10);
                          } else {
                            card.style.opacity = '0';
                            card.style.transform = 'scale(0.95)';
                            setTimeout(function() { card.style.display = 'none'; }, 200);
                          }
                        });
                      });
                    });
                  })();
                `,
              }}
            />
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
