// 把 Markdown 內容轉成純文字摘要，給 <meta name="description"> 用。
// 不求完美去除所有語法——搜尋結果的摘要本來就會被截斷，抓個大概意思就夠了。
export function markdownSnippet(markdown: string, maxLength = 140): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ") // 程式碼區塊
    .replace(/`([^`]*)`/g, "$1") // 行內程式碼
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 圖片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 連結文字保留，網址丟掉
    .replace(/^#{1,6}\s+/gm, "") // 標題符號
    .replace(/[*_>#]/g, "") // 殘留的強調/引用符號
    .replace(/^-+\s*/gm, "") // 條列符號
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
}
