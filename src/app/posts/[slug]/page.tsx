import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPublicPosts } from "@/lib/posts";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import P5Canvas from "@/components/P5Canvas";
import ReadingProgress from "@/components/ReadingProgress";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPublicPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "404" };
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getPublicPosts();
  const idx = allPosts.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? allPosts[idx - 1] : null;
  const next = idx < allPosts.length - 1 ? allPosts[idx + 1] : null;

  const date = new Date(post.date);
  const postAgeDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  const isOutdated = postAgeDays > 180;
  const isPrivate = post.visibility === "private";
  const category = post.categories[0];

  return (
    <>
      <P5Canvas />
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="layout-grid">
          <section className="content-panel">
            <article className="article">
              <header className="article-header">
                <p className="eyebrow">{category || "Article"}</p>
                <h1>
                  {post.title}
                  {isPrivate && <span className="private-badge">私密</span>}
                </h1>
                <div className="article-meta">
                  <time dateTime={post.date}>
                    {date.getFullYear()} ·{" "}
                    {String(date.getMonth() + 1).padStart(2, "0")} ·{" "}
                    {String(date.getDate()).padStart(2, "0")}
                  </time>
                  <span className="meta-dot">·</span>
                  <span className="meta-stat">{(post.content || "").length} 字</span>
                  {post.tags.length > 0 && (
                    <span className="article-tags">
                      {post.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </header>

              <MarkdownRenderer content={post.content} />

              {isOutdated && (
                <div className="outdated-notice">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span>
                    本文发布于 <strong>{postAgeDays}</strong>{" "}
                    天前，文中信息可能已过时，请注意甄别。
                  </span>
                </div>
              )}

              <div className="article-copyright">
                <div className="copyright-row">
                  <strong>本文作者：</strong>
                  <span>aDiaoYa · 啊叼一只鱼</span>
                </div>
                <div className="copyright-row">
                  <strong>本文链接：</strong>
                  <a href={`https://adiaoYa.github.io/aDiao-Blog/posts/${slug}`}>
                    https://adiaoYa.github.io/aDiao-Blog/posts/{slug}
                  </a>
                </div>
                <div className="copyright-row">
                  <strong>版权声明：</strong>
                  <span>
                    本文采用{" "}
                    <a
                      href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                      target="_blank"
                      rel="noopener"
                    >
                      CC BY-NC-SA 4.0
                    </a>{" "}
                    许可协议，转载请注明出处。
                  </span>
                </div>
              </div>

              <nav className="post-nav" aria-label="文章导航">
                {prev ? (
                  <Link href={`/posts/${prev.slug}`}>
                    <span className="post-nav-label">← 上一篇</span>
                    <span className="post-nav-title">{prev.title}</span>
                  </Link>
                ) : (
                  <span className="post-nav-empty" />
                )}
                {next ? (
                  <Link href={`/posts/${next.slug}`}>
                    <span className="post-nav-label">下一篇 →</span>
                    <span className="post-nav-title">{next.title}</span>
                  </Link>
                ) : (
                  <span className="post-nav-empty" />
                )}
              </nav>
            </article>
          </section>

          <Sidebar />
        </main>

        <Footer />
      </div>
    </>
  );
}
