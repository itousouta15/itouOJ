// 識別題的語言分類 badge（C / Python）。
export default function CategoryBadge({
  category,
}: {
  category?: string | null;
}) {
  if (!category) return null;
  return (
    <span
      className={`vbadge ${
        category === "Python" ? "vbadge-purple" : "vbadge-blue"
      }`}
    >
      {category}
    </span>
  );
}
