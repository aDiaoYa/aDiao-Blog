import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="not-found">
        <div className="nf-code">404</div>
        <h2>页面不存在</h2>
        <p>你来到了没有知识的荒原…</p>
        <div className="nf-links">
          <Link href="/home" className="nf-home">
            去文章列表
          </Link>
          <Link href="/">回首页</Link>
        </div>
      </div>
    </div>
  );
}
