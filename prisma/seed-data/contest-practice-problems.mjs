export const practiceNotice = "本站自編的競賽練習題，並非歷屆試題或官方預測題；測資也是本站自製。";

export const practiceProblems = [
  {
    key: "rectangle", title: "競賽練習｜矩形雨量查詢", difficulty: "medium", timeLimitMs: 2000,
    description: "氣象站記錄了一張 N 列 M 欄的雨量表，格子 (r,c) 有整數 A[r][c]，數值可為負（表示修正先前的記錄）。現在有 Q 個互不影響的查詢，每次要求一個含邊界矩形內所有格子的總和。座標從 1 開始，列由上到下、欄由左到右。",
    input: "第一行 N M。接下來 N 行，每行 M 個整數。下一行 Q，之後 Q 行各有 r₁ c₁ r₂ c₂，表示查詢第 r₁ 至 r₂ 列、第 c₁ 至 c₂ 欄。",
    output: "對每次查詢輸出一行整數，依輸入順序列出矩形總和。總和可能超過 32 位元整數。",
    limits: "1 ≤ N,M ≤ 400；1 ≤ Q ≤ 10000；−10⁶ ≤ A[r][c] ≤ 10⁶；1 ≤ r₁ ≤ r₂ ≤ N，1 ≤ c₁ ≤ c₂ ≤ M。",
    samples: [
      { input: "3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n3\n1 1 2 2\n2 2 3 4\n1 3 3 3", output: "14\n54\n21" },
      { input: "2 2\n-3 7\n5 -2\n2\n1 1 2 2\n2 2 2 2", output: "7\n-2" },
    ],
  },
  {
    key: "capacity", title: "競賽練習｜貨車最低載重", difficulty: "medium", timeLimitMs: 2000,
    description: "N 件貨物排成一列，第 i 件重 Wᵢ。貨車每趟只能載走**連續的一段**貨物，且不得改變裝貨順序；每件貨物恰好運送一次。最多可跑 K 趟（也可以少於 K 趟）。求貨車所需的最小載重上限，使所有貨物都能運完。",
    input: "第一行 N K。第二行 N 個正整數 W₁…Wₙ。",
    output: "輸出一個整數，表示最小可行的載重上限。答案可能超過 32 位元整數。",
    limits: "1 ≤ K ≤ N ≤ 200000；1 ≤ Wᵢ ≤ 10⁹。",
    samples: [
      { input: "5 3\n7 2 5 10 8", output: "14" },
      { input: "3 1\n4 1 5", output: "10" },
    ],
  },
  {
    key: "prerequisites", title: "競賽練習｜課程先修順序", difficulty: "medium", timeLimitMs: 2000,
    description: "有 N 門編號 1 至 N 的課程，M 條先修規則 u v 表示必須先修完 u，才能開始 v。請找出一種包含所有課程的合法修課順序。如果有多種合法順序，輸出**字典序最小**的一種；若有循環依賴，輸出 -1。規則可能重複出現，重複規則仍須正確處理。",
    input: "第一行 N M。接下來 M 行各有兩個整數 u v，表示一條先修規則。",
    output: "若存在合法順序，輸出一行 N 個以空格分隔的課程編號；否則輸出 -1。",
    limits: "1 ≤ N ≤ 100000；0 ≤ M ≤ 100000；1 ≤ u,v ≤ N。",
    samples: [
      { input: "5 4\n1 3\n2 3\n3 4\n2 5", output: "1 2 3 4 5" },
      { input: "3 3\n1 2\n2 3\n3 1", output: "-1" },
    ],
  },
  {
    key: "route", title: "競賽練習｜山路最短行車時間", difficulty: "medium", timeLimitMs: 3000,
    description: "有 N 個城鎮與 M 條**單向**山路。每條路從 u 到 v，行車時間為正整數 w。從起點 S 出發，求抵達終點 T 的最短時間；可重複經過城鎮，但不得逆向使用山路。兩城鎮之間可能有多條不同的路。",
    input: "第一行 N M S T。接下來 M 行各有 u v w，表示一條從 u 到 v、耗時 w 的道路。",
    output: "輸出最短行車時間；若 T 無法從 S 抵達，輸出 -1。",
    limits: "1 ≤ N ≤ 50000；0 ≤ M ≤ 100000；1 ≤ S,T,u,v ≤ N；1 ≤ w ≤ 10⁶。答案不超過 5×10¹⁰。",
    samples: [
      { input: "5 6 1 5\n1 2 4\n1 3 2\n3 2 1\n2 4 5\n3 4 10\n4 5 3", output: "11" },
      { input: "3 1 2 1\n1 2 7", output: "-1" },
    ],
  },
  {
    key: "ascent", title: "競賽練習｜嚴格上升的訓練日", difficulty: "medium", timeLimitMs: 2000,
    description: "連續 N 天記錄訓練強度 A₁…Aₙ。你可以跳過任意天，但選中的天必須維持原本先後順序，而且強度要**嚴格遞增**。求最多能選幾天；強度相同的兩天不可同時選入。",
    input: "第一行 N。第二行 N 個整數 A₁…Aₙ。",
    output: "輸出最長嚴格遞增子序列的長度。",
    limits: "1 ≤ N ≤ 200000；−10⁹ ≤ Aᵢ ≤ 10⁹。",
    samples: [
      { input: "8\n10 9 2 5 3 7 101 18", output: "4" },
      { input: "5\n3 3 3 3 3", output: "1" },
    ],
  },
  {
    key: "equipment", title: "競賽練習｜裝備選擇", difficulty: "medium", timeLimitMs: 3000,
    description: "比賽前有 N 件裝備，第 i 件重量為 wᵢ、效果值為 vᵢ。每件裝備至多拿一次，背包可承受的總重量不超過 C。求能取得的最大效果值；可以什麼都不拿。",
    input: "第一行 N C。接下來 N 行各有 wᵢ vᵢ。",
    output: "輸出一個整數，表示最大效果值。",
    limits: "1 ≤ N ≤ 200；0 ≤ C ≤ 10000；1 ≤ wᵢ ≤ 10000；0 ≤ vᵢ ≤ 10⁶。",
    samples: [
      { input: "4 7\n3 4\n4 5\n2 3\n5 8", output: "11" },
      { input: "3 3\n4 100\n2 7\n3 9", output: "9" },
    ],
  },
];

export function practiceStatement(problem) {
  return [
    `## 題目描述\n\n${problem.description}`,
    `## 輸入格式\n\n${problem.input}`,
    `## 輸出格式\n\n${problem.output}`,
    `## 限制\n\n${problem.limits}`,
    `## 來源與評測範圍\n\n${practiceNotice}`,
  ].join("\n\n");
}
