import { LANGUAGES, type LanguageKey } from "@/lib/languages";
import { ITOULANG_PLAYGROUND_TEMPLATE } from "@/lib/itoulangTemplates";

export const PLAYGROUND_TIME_LIMIT_MS = 5000;
export const PLAYGROUND_MEMORY_LIMIT_MB = 256;

export function playgroundLimits(language: LanguageKey) {
  const lang = LANGUAGES[language];
  return {
    timeMs: PLAYGROUND_TIME_LIMIT_MS * lang.timeMultiplier,
    memoryMb: PLAYGROUND_MEMORY_LIMIT_MB * lang.memoryMultiplier,
  };
}

export const PLAYGROUND_TEMPLATES: Record<LanguageKey, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cout << "Hello, world!" << '\\n';
    return 0;
}
`,
  c: `#include <stdio.h>

int main(void) {
    printf("Hello, world!\\n");
    return 0;
}
`,
  python: `print("Hello, world!")
`,
  javascript: `// 如需讀取輸入：require("fs").readFileSync(0, "utf8")
console.log("Hello, world!");
`,
  itoulang: ITOULANG_PLAYGROUND_TEMPLATE,
};

export interface PlaygroundRunResult {
  compileError?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  signal?: string | null;
  killed?: boolean;
  timeMs?: number | null;
  memoryBytes?: number | null;
}
