import type { ToiBeginnerLesson } from "@/lib/toiBeginnerLessonTypes";
import { lessons as batch1 } from "@/lib/toiBeginnerLessons/batch1";
import { lessons as batch2 } from "@/lib/toiBeginnerLessons/batch2";
import { lessons as batch3 } from "@/lib/toiBeginnerLessons/batch3";

// Problem-specific lessons take precedence over a topic's general demonstration.
// Source statement and public sample: https://oj.itousouta.me/problems/a086
const individuallyAuthored: Partial<Record<string, ToiBeginnerLesson>> = {
  a086: {
    code: "a086",
    topic: "read-calculate",
    concept: "累加需求・整數向上取整",
    goal: "分別加總芝麻與花生湯圓的需求，算出最少購買盒數與剩餘顆數。",
    explanation: [
      "先讀入參加人數 N，將接下來 N 人的芝麻需求 Xi 與花生需求 Yi 分別累加為 sesame 和 peanut。兩種口味不能混裝，所以要各自計算；也不是替每個人分別買整盒。",
      "若某種口味總共需要 total 顆，買 boxes 盒就有 10 × boxes 顆，必須滿足 10 × boxes ≥ total。為了買最少盒，取 boxes = ⌈total / 10⌉；對非負整數可寫成 (total + 9) / 10，Python 則用 (total + 9) // 10。",
      "剩餘顆數是 boxes × 10 − total，不是 total % 10：例如需要 13 顆，買 2 盒後剩下 20 − 13 = 7 顆。需求恰好整盒時剩 0 顆；需求為 0 時公式也會得到 0 盒、0 顆，不需要另外多買一盒。",
      "題目範例的芝麻需求為 3 + 0 + 8 + 2 = 13，花生需求為 7 + 2 + 0 + 5 = 14，因此依序輸出 2 7 與 2 6，各占一行。最多 50 人、每人每種口味最多 50 顆，總需求最多 2500 顆，C++ 的 int 足以儲存。",
    ],
    complexity: "時間 O(N) ・ 額外空間 O(1)",
    pitfall:
      "先合併所有人的同口味需求，再向上取整；不能把兩種口味混算、逐人取整、直接用整數除法捨去小數，或把除法餘數當成剩餘顆數。輸出芝麻、花生兩行，每行先盒數、再剩餘顆數。",
    sampleInput: "4\n3 7\n0 2\n8 0\n2 5\n",
    sampleOutput: "2 7\n2 6\n",
    traceLabel: "湯圓需求、購買盒數與剩餘顆數",
    trace: [
      {
        title: "讀入 N 與第 1 人",
        description:
          "N = 4。兩個總和先設為 0，再加入第 1 人的芝麻 3 顆、花生 7 顆。",
        cells: ["第 1 人：3、7", "芝麻總計 3", "花生總計 7"],
        active: [1, 2],
        variables: [
          ["已讀人數", "1"],
          ["芝麻需求", "3"],
          ["花生需求", "7"],
        ],
      },
      {
        title: "加入第 2 人",
        description:
          "第 2 人要芝麻 0 顆、花生 2 顆。芝麻仍是 3，花生變成 7 + 2 = 9；現在還不用買盒子。",
        cells: ["第 2 人：0、2", "芝麻總計 3", "花生總計 9"],
        active: [2],
        variables: [
          ["已讀人數", "2"],
          ["芝麻需求", "3"],
          ["花生需求", "9"],
        ],
      },
      {
        title: "加入第 3 人",
        description:
          "第 3 人要芝麻 8 顆、花生 0 顆，所以芝麻變成 3 + 8 = 11，花生仍是 9。",
        cells: ["第 3 人：8、0", "芝麻總計 11", "花生總計 9"],
        active: [1],
        variables: [
          ["已讀人數", "3"],
          ["芝麻需求", "11"],
          ["花生需求", "9"],
        ],
      },
      {
        title: "加入第 4 人，完成加總",
        description:
          "最後加入芝麻 2 顆、花生 5 顆，得到芝麻 13 顆、花生 14 顆。兩種口味保持分開。",
        cells: ["第 4 人：2、5", "芝麻總計 13", "花生總計 14"],
        active: [1, 2],
        variables: [
          ["已讀人數", "4"],
          ["芝麻需求", "13"],
          ["花生需求", "14"],
        ],
      },
      {
        title: "各自向上取整買盒數",
        description:
          "每盒有 10 顆。芝麻需要 (13 + 9) / 10 = 2 盒，花生需要 (14 + 9) / 10 = 2 盒；這裡使用整數除法。",
        cells: ["芝麻：(13 + 9) / 10 = 2", "花生：(14 + 9) / 10 = 2"],
        active: [0, 1],
        variables: [
          ["芝麻盒數", "2"],
          ["花生盒數", "2"],
        ],
      },
      {
        title: "計算剩餘並輸出兩行",
        description:
          "芝麻剩 2 × 10 − 13 = 7 顆，花生剩 2 × 10 − 14 = 6 顆。先輸出芝麻的 2 7，再換行輸出花生的 2 6。",
        cells: ["芝麻：2 盒，剩 7 顆", "花生：2 盒，剩 6 顆"],
        active: [0, 1],
        variables: [
          ["芝麻盒數", "2"],
          ["芝麻剩餘", "7"],
          ["花生盒數", "2"],
          ["花生剩餘", "6"],
          ["輸出", "2 7\n2 6"],
        ],
      },
    ],
    cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int sesame = 0, peanut = 0;
    for (int i = 0; i < n; ++i) {
        int x, y;
        cin >> x >> y;
        sesame += x;
        peanut += y;
    }

    int sesameBoxes = (sesame + 9) / 10;
    int peanutBoxes = (peanut + 9) / 10;
    cout << sesameBoxes << ' ' << sesameBoxes * 10 - sesame << '\\n';
    cout << peanutBoxes << ' ' << peanutBoxes * 10 - peanut << '\\n';
}
`,
    python: `n = int(input())
sesame = 0
peanut = 0
for _ in range(n):
    x, y = map(int, input().split())
    sesame += x
    peanut += y

sesame_boxes = (sesame + 9) // 10
peanut_boxes = (peanut + 9) // 10
print(sesame_boxes, sesame_boxes * 10 - sesame)
print(peanut_boxes, peanut_boxes * 10 - peanut)
`,
  },
};

export const toiBeginnerLessons: Partial<Record<string, ToiBeginnerLesson>> =
  {};
for (const lesson of [
  individuallyAuthored.a086!,
  ...batch1,
  ...batch2,
  ...batch3,
]) {
  if (Object.hasOwn(toiBeginnerLessons, lesson.code)) {
    throw new Error(`Duplicate beginner tutorial: ${lesson.code}`);
  }
  toiBeginnerLessons[lesson.code] = lesson;
}
