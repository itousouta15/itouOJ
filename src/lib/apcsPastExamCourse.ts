export const apcsPastExamUnits = [
  {
    id: "foundation",
    step: "01",
    label: "入門｜先把規則跑對",
    intro: "從週期、位數與座標方向開始，把題目敘述轉成清楚的狀態與判斷。",
    focus: ["逐筆模擬", "餘數與週期", "字串索引", "方向編碼"],
    codes: ["a449", "a455", "a457"],
  },
  {
    id: "core",
    step: "02",
    label: "核心｜整理資料與操作序列",
    intro: "先將資料化簡，再套用排序、區間合併與字串轉換等常見技巧。",
    focus: ["逐組取最佳", "排序與區間", "字串轉換", "先選擇再篩選"],
    codes: ["a433", "a437", "a445"],
  },
  {
    id: "challenge",
    step: "03",
    label: "挑戰｜走訪、逆推與最佳化",
    intro: "把局部規則提升成整體結構：辨認排列中的環、反轉操作，並用區間 DP 找最佳合併順序。",
    focus: ["visited 與環", "逆向還原", "區間動態規劃", "前綴和"],
    codes: ["a435", "a447", "a379"],
  },
] as const;

export const apcsPastExamLessonCodes = new Set(
  apcsPastExamUnits.flatMap((unit) => unit.codes)
);
