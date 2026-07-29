import Link from "next/link";

export default function TagBadge({ name }: { name: string }) {
  return (
    <Link
      href={`/problems?tag=${encodeURIComponent(name)}`}
      className="vbadge vbadge-blue hover:opacity-80"
    >
      {name}
    </Link>
  );
}
