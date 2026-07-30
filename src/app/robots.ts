import type { MetadataRoute } from "next";

// 只讓公開題目相關的頁面被搜尋引擎收錄（首頁、公告、公開題目列表與內容）。
// 其他路徑都有真實學生的帳號、提交紀錄、比賽名次——這是給特定學校營隊用的
// 練習系統，不是要讓 Google 把「誰交了什麼、比賽排第幾」都索引起來公開查得到。
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
