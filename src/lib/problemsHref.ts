// 題目列表的網址組合，伺服器頁面與標籤篩選元件共用。
export function problemsHref({
  query,
  tag,
  sort,
  page,
}: {
  query?: string;
  tag?: string;
  sort: "order" | "difficulty";
  page?: number;
}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (tag) params.set("tag", tag);
  if (sort === "difficulty") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));
  const queryString = params.toString();
  return queryString ? `/problems?${queryString}` : "/problems";
}
