import Link from "next/link";

interface Props {
  current: number;
  total: number;
  basePath: string;
}

export default function Paginator({ current, total, basePath }: Props) {
  if (total <= 1) return null;

  return (
    <nav className="pager" aria-label="分页导航">
      {current > 1 && (
        <Link href={current === 2 ? basePath : `${basePath}/${current - 1}`}>
          ← 上一页
        </Link>
      )}
      <span className="pager-info">
        {current} / {total}
      </span>
      {current < total && (
        <Link href={`${basePath}/${current + 1}`}>下一页 →</Link>
      )}
    </nav>
  );
}
