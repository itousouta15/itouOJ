import type { MetadataRoute } from "next";

// 公開的題目、課程、比賽與排行頁可被搜尋；帳號、提交紀錄與個人動態
// 仍不進入搜尋索引，避免把學生資料當成公開內容擴散。
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "https://oj.itousouta.me";
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/admin",
        "/api",
        "/desktop-auth",
        "/login",
        "/register",
        "/settings",
        "/submissions",
        "/users",
        "/search",
        "/activity",
        "/ctf/history",
        "/ctf/scoreboard",
        "/ctf/labs",
        "/problems/propose",
        "/problems/proposals",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
