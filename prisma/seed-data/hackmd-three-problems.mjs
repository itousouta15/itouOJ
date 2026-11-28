export const sourceUrl = "https://hackmd.io/@cA7L_FaoR5-8HdSqXMJfkQ/B1mgpjEazx";
export const sourceNotice = `依 [HackMD 還原教學筆記](${sourceUrl}) 重新整理，非官方逐字題面。限制採筆記教學版；營火晚會未明示的輸入細節由本站補明。本站使用自製測資，非官方競賽測資；AC 僅表示通過本站測資。`;
export const hackmdProblems = [
  {
    key: "campfire", title: "HackMD 教學版｜營火晚會", difficulty: "hard", timeLimitMs: 10000,
    description: "有 N 個人依編號 0 到 N−1 順時針圍成一圈，第 i 人的小隊編號為 Aᵢ。所有人一開始都存活，遊戲從目前位置 0 開始。\n\n每輪從目前位置往順時針方向，淘汰第一個小隊不同的存活者。淘汰完成後，下一輪從「原本目前位置的下一個存活者」開始，並不是從被淘汰者的下一位開始。若所有存活者已屬於同一小隊，遊戲立即結束。求淘汰人數及最後存活者的小隊編號。",
    input: "第一行 N K。第二行 N 個整數 A₀…Aₙ₋₁，依編號順序表示所屬小隊。K 為小隊編號上限，不要求每個編號都有人。",
    output: "輸出兩個整數，以空白隔開：淘汰人數、最後剩下的小隊編號。",
    limits: "1 ≤ N ≤ 200000，1 ≤ K ≤ 200000，1 ≤ Aᵢ ≤ K。",
    samples: [{ input: "6 3\n2 2 3 1 1 2", output: "4 2" }],
  },
  {
    key: "superstring", title: "HackMD 教學版｜最短包含字串", difficulty: "hard", timeLimitMs: 5000,
    description: "給定 N 個互不相同的非空字串，只使用前 K 個小寫英文字母。請構造字串 S，讓每個輸入字串都出現在 S 的某個連續區段中。\n\n先讓 S 的長度最短；若仍有多個答案，再選字典序最小者。字串可以彼此重疊，已完整包含於其他字串內的輸入也算滿足。",
    input: "第一行 N K，接下來 N 行各有一個字串。K=1 時只能使用 a，K=2 時只能使用 a、b，依此類推。",
    output: "輸出最短且字典序最小的 S。",
    limits: "1 ≤ N ≤ 8，1 ≤ K ≤ 26；每個輸入字串長度為 1 到 10，且所有輸入字串互不相同。這是筆記明示的教學範圍。",
    samples: [
      { input: "3 3\nabc\nacb\naab", output: "aabcacb" },
      { input: "3 4\nabcd\nbc\nda", output: "abcda" },
    ],
  },
  {
    key: "collatz", title: "HackMD 教學版｜考拉茲數字反推", difficulty: "medium", timeLimitMs: 5000,
    description: "對正整數 x，每次操作依奇偶決定：偶數變成 x/2，奇數變成 3x+1。\n\n給定目標 N 及最多 K 次操作，將所有能在不超過 K 次操作後到達 N 的正整數稱為可達數，包含零次操作的 N 本身。對每個查詢 Aᵢ，求它與任一可達數的最小絕對差，最後輸出所有查詢差值的總和。\n\n反推奇數前驅時，(y−1)/3 必須是正奇數；例如 2 是偶數，不能以 3×2+1 的規則當作 7 的前驅。",
    input: "第一行 N K Q。第二行 Q 個正整數 A₁…Aq。",
    output: "輸出所有查詢最小差值的總和。請使用可容納 64 位元有號整數的方式保存答案。",
    limits: "1 ≤ N ≤ 10⁶，0 ≤ K ≤ 20，1 ≤ Q ≤ 200000，1 ≤ Aᵢ ≤ 10¹²。這是筆記明示的教學範圍。",
    samples: [{ input: "11 3 3\n16 56 330", output: "256" }],
  },
];

export function statementFor(problem) {
  return [
    `## 題目描述\n\n${problem.description}`,
    `## 輸入格式\n\n${problem.input}`,
    `## 輸出格式\n\n${problem.output}`,
    `## 限制\n\n${problem.limits}`,
    `## 來源與評測範圍\n\n${sourceNotice}`,
  ].join("\n\n");
}
