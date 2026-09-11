// Fisher–Yates 洗牌：回傳 0..n-1 的隨機排列。用來打亂選擇題選項的顯示順序，
// 存檔與判定仍用原始索引（見 displayOrder 的用法）。
export function shuffledOrder(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
