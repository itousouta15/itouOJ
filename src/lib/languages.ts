// 對應到伺服器上 Piston 已安裝的 runtime。
// 新增語言時：先在 Piston 裝好套件，再在這裡加一筆。
export const LANGUAGES = {
  cpp: {
    label: "C++ (GCC 10.2)",
    piston: "c++",
    version: "10.2.0",
    filename: "main.cpp",
    timeMultiplier: 1,
    memoryMultiplier: 1,
  },
  c: {
    label: "C (GCC 10.2)",
    piston: "c",
    version: "10.2.0",
    filename: "main.c",
    timeMultiplier: 1,
    memoryMultiplier: 1,
  },
  python: {
    label: "Python 3.12",
    piston: "python",
    version: "3.12.0",
    filename: "main.py",
    timeMultiplier: 3, // 直譯語言慣例給較寬的時限
    memoryMultiplier: 1,
  },
  java: {
    label: "Java 15",
    piston: "java",
    version: "15.0.2",
    filename: "Main.java",
    timeMultiplier: 2, // JVM 啟動慢、吃記憶體，比照一般 OJ 放寬
    memoryMultiplier: 2,
  },
  javascript: {
    label: "JavaScript (Node 20)",
    piston: "javascript",
    version: "20.11.1",
    filename: "main.js",
    timeMultiplier: 3,
    memoryMultiplier: 2,
  },
} as const;

export type LanguageKey = keyof typeof LANGUAGES;

export const LANGUAGE_KEYS = Object.keys(LANGUAGES) as LanguageKey[];

export function isLanguageKey(value: string): value is LanguageKey {
  return value in LANGUAGES;
}
