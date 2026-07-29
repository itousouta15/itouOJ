-- order 是對外顯示的題號（網址 /problems/{order}），加上唯一鍵讓資料庫保證
-- 「題號 -> 題目」永遠一對一，不再只靠 API 端的邏輯（新增用 last+1、拖曳排序用
-- 全量重排）自行維持。
CREATE UNIQUE INDEX "Problem_order_key" ON "Problem"("order");
