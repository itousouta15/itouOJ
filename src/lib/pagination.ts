export const COURSE_PAGE_SIZE = 30;

// 頁碼只顯示首尾與目前頁附近；null 代表省略號。
export function pageWindow(current: number, total: number): (number | null)[] {
  const pages = new Set<number>([1, total]);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= total) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push(null);
    result.push(page);
  });
  return result;
}

// 把已過濾的清單切成一頁；page 超出範圍時夾回有效範圍。
export function paginate<T>(items: T[], rawPage: unknown, pageSize = COURSE_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requested = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  const currentPage = Math.min(
    Math.max(Number.isInteger(requested) && requested > 0 ? requested : 1, 1),
    totalPages,
  );
  return {
    pageItems: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    currentPage,
    totalPages,
  };
}
