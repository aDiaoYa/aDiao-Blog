import Link from "next/link";
import type { PostMeta } from "@/lib/types";

export default function PostCard({ post }: { post: PostMeta }) {
  const date = new Date(post.date);
  const category = post.categories[0];

  return (
    <article className="post-card" data-category={category || ""}>
      <Link className="post-card-link" href={`/posts/${post.slug}`}>
        <div className="post-meta">
          <time dateTime={post.date}>
            {date.getFullYear()} · {String(date.getMonth() + 1).padStart(2, "0")} ·{" "}
            {String(date.getDate()).padStart(2, "0")}
          </time>
          {category && <span className="post-category">{category}</span>}
        </div>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="post-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        <span className="read-more">阅读全文 →</span>
      </Link>
    </article>
  );
}
