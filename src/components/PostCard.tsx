import Link from "next/link";
import type { PostMeta } from "@/types";
import { formatDate } from "@/lib/utils";

export default function PostCard({ post }: { post: PostMeta }) {
  const category = post.categories[0];

  return (
    <article className="waterfall-card" data-category={category || ""}>
      <Link className="post-card-link" href={`/posts/${post.slug}`}>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <div className="post-meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {category && <span className="post-category">{category}</span>}
        </div>
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="post-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}
