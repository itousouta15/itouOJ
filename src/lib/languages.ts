// 可提交語言及 sandbox-server 對應的 runtime。
export const LANGUAGES = {
  cpp: {
    label: "C++ (GCC 10.2)",
    runtime: "c++",
    version: "10.2.0",
    filename: "main.cpp",
    timeMultiplier: 1,
    memoryMultiplier: 1,
    interactive: true,
  },
  c: {
    label: "C (GCC 10.2)",
    runtime: "c",
    version: "10.2.0",
    filename: "main.c",
    timeMultiplier: 1,
    memoryMultiplier: 1,
    interactive: true,
  },
  python: {
    label: "Python 3.12",
    runtime: "python",
    version: "3.12.0",
    filename: "main.py",
    timeMultiplier: 3, // 直譯語言慣例給較寬的時限
    memoryMultiplier: 1,
    interactive: true,
  },
  javascript: {
    label: "JavaScript (Node 20)",
    runtime: "javascript",
    version: "20.11.1",
    filename: "main.js",
    timeMultiplier: 3,
    memoryMultiplier: 2,
    interactive: true,
  },
  // itouLang 借用 Node 沙箱 runtime（見 src/lib/itoulang.ts）；判題時會把原始碼
  // 包成 main.js。輸入改成一次讀完 stdin，無法逐行互動，因此不支援 Terminal。
  itoulang: {
    label: "itouLang 0.2（喵）",
    runtime: "javascript",
    version: "20.11.1",
    filename: "main.js",
    timeMultiplier: 3,
    memoryMultiplier: 2,
    interactive: false,
  },
} as const;

export type LanguageKey = keyof typeof LANGUAGES;

export const LANGUAGE_KEYS = Object.keys(LANGUAGES) as LanguageKey[];

export function isLanguageKey(value: string): value is LanguageKey {
  return value in LANGUAGES;
}

// 歷史 Java 提交仍需顯示原本的名稱，但新提交不能再選 Java。
export function languageLabel(value: string): string {
  if (value === "java") return "Java 15";
  if (value === "choice") return "選擇題";
  return isLanguageKey(value) ? LANGUAGES[value].label : value;
}
