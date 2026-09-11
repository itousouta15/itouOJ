import type { MetadataRoute } from "next";

// 只讓公開題目相關頁面被搜尋引擎收錄。其他路徑有學生的帳號、提交與名次，
// 這是營隊練習系統，不該被 Google 索引起來公開查。
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "https://oj.itousouta.me";
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/admin",
        "/api",
        "/contests",
        "/courses",
        "/desktop-auth",
        "/login",
        "/register",
        "/settings",
        "/submissions",
        "/users",
        "/ranking",
        "/problems/propose",
        "/problems/proposals",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
