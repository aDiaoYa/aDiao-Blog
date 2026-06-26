import Link from "next/link";

interface Props {
  current: number;
  total: number;
  basePath: string;
}

export default function Paginator({ current, total, basePath }: Props) {
  if (total <= 1) return null;

  const pages = [];
  const maxShow = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + maxShow - 1);
  if (end - start < maxShow - 1) {
    start = Math.max(1, end - maxShow + 1);
  }

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="paginator" aria-label="分页导航">
      {current > 1 && (
        <Link href={current === 2 ? basePath : `${basePath}/page/${current - 1}`}>←</Link>
      )}
      {pages.map((p) =>
        p === current ? (
          <span key={p} className="page-current">
            {p}
          </span>
        ) : (
          <Link key={p} href={p === 1 ? basePath : `${basePath}/page/${p}`}>
            {p}
          </Link>
        )
      )}
      {current < total && (
        <Link href={`${basePath}/page/${current + 1}`}>→</Link>
      )}
    </nav>
  );
}
