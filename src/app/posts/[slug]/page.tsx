import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPublicPosts, getCategories, getTags } from "@/lib/posts";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { SITE, SOCIAL, GISCUS } from "@/lib/constants";
import { formatDate, daysSince, slugify } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getPublicPosts().map((p) => ({ slug: p.slug }));
  return posts.length > 0 ? posts : [{ slug: "null" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "404" };
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
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

  // 预构建 Sidebar 数据
  const categories = getCategories();
  const tags = getTags().slice(0, 15);
  const recent = allPosts.slice(0, 5).map((p) => ({
    title: p.title,
    slug: p.slug,
    date: p.date,
  }));
  const sidebarData = {
    postCount: allPosts.length,
    categories,
    tags,
    recent,
  };

  const postAgeDays = daysSince(post.date);
  const isOutdated = postAgeDays > 180;
  const isPrivate = post.visibility === "private";
  const category = post.categories[0];

  // Extract headings for TOC
  const content = post.content || "";
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: { level: number; text: string; id: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    headings.push({ level, text, id });
  }

  return (
    <>
      <ReadingProgress />
      <div className="page-shell">
        <Navbar />

        <main className="layout-grid">
          <section className="content-panel">
            <article className="article">
              <header className="article-header">
                {category && <p className="eyebrow">{category}</p>}
                <h1>
                  {post.title}
                  {isPrivate && <span className="private-badge">私密</span>}
                </h1>
                <div className="article-meta">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span className="meta-dot">·</span>
                  <span className="meta-stat">{(content || "").length} 字</span>
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

              <div className={`article-wrapper${headings.length > 0 ? " has-toc" : ""}`}>
                {headings.length > 0 && (
                  <nav className="article-toc" aria-label="目录">
                    <h3>目录</h3>
                    <ol>
                      {headings.map((h) => (
                        <li
                          key={h.id}
                          className={h.level === 3 ? "toc-child" : ""}
                          style={{ paddingLeft: h.level === 2 ? "0" : undefined }}
                        >
                          <a href={`#${h.id}`}>{h.text}</a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                )}
                <div className="article-body">
                  <MarkdownRenderer content={content} />
                </div>
              </div>

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
                  <span>{SITE.title}</span>
                </div>
                <div className="copyright-row">
                  <strong>本文链接：</strong>
                  <a href={`${SOCIAL.github}${SITE.basePath}/posts/${slug}`}>
                    {SOCIAL.github}{SITE.basePath}/posts/{slug}
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
                  <Link className="post-nav-prev" href={`/posts/${prev.slug}`}>
                    <span className="post-nav-label">← 上一篇</span>
                    <span className="post-nav-title">{prev.title}</span>
                  </Link>
                ) : (
                  <span className="post-nav-empty" />
                )}
                {next ? (
                  <Link className="post-nav-next" href={`/posts/${next.slug}`}>
                    <span className="post-nav-label">下一篇 →</span>
                    <span className="post-nav-title">{next.title}</span>
                  </Link>
                ) : (
                  <span className="post-nav-empty" />
                )}
              </nav>

              {/* Giscus 评论区 */}
              <section
                className="article-comments"
                id="giscus-container"
                suppressHydrationWarning
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (function() {
                      var script = document.createElement('script');
                      script.src = 'https://giscus.app/client.js';
                      script.setAttribute('data-repo', '${GISCUS.repo}');
                      script.setAttribute('data-repo-id', '${GISCUS.repoId}');
                      script.setAttribute('data-category', '${GISCUS.category}');
                      script.setAttribute('data-category-id', '${GISCUS.categoryId}');
                      script.setAttribute('data-mapping', '${GISCUS.mapping}');
                      script.setAttribute('data-strict', '0');
                      script.setAttribute('data-reactions-enabled', '1');
                      script.setAttribute('data-emit-metadata', '0');
                      script.setAttribute('data-input-position', 'bottom');
                      script.setAttribute('data-theme', document.documentElement.classList.contains('dark') ? 'dark_dimmed' : 'light');
                      script.setAttribute('data-lang', '${GISCUS.lang}');
                      script.setAttribute('crossorigin', 'anonymous');
                      script.async = true;
                      document.getElementById('giscus-container').appendChild(script);
                    })();
                  `,
                }}
              />
            </article>
          </section>

          <Sidebar data={sidebarData} />
        </main>

        <Footer />
      </div>
    </>
  );
}
