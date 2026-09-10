import Link from "next/link";

// 標籤 badge。預設連到題目列表的標籤篩選；群集等其它地方可自訂 href。
export default function TagBadge({
  name,
  href,
}: {
  name: string;
  href?: string;
}) {
  return (
    <Link
      href={href ?? `/problems?tag=${encodeURIComponent(name)}`}
      className="vbadge vbadge-blue hover:opacity-80"
    >
      {name}
    </Link>
  );
}
