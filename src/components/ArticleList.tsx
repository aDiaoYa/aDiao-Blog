import Link from "next/link";
import type { Post } from "@/types";
import { formatDate } from "@/lib/utils";

/** 复用的文章列表组件，用于归档、分类、标签页面 */
export default function ArticleList({ posts }: { posts: Post[] }) {
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <section className="archive-list">
      {sorted.map((post) => (
        <Link key={post.slug} className="archive-item" href={`/posts/${post.slug}`}>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>{post.title}</span>
          <span className="archive-arrow">→</span>
        </Link>
      ))}
    </section>
  );
}
