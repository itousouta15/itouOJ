import {
  completeAnyWord,
  completeFromList,
  ifNotIn,
  snippetCompletion,
  type Completion,
  type CompletionSource,
} from "@codemirror/autocomplete";
import type { LanguageKey } from "@/lib/languages";

const NON_CODE_NODES = [
  "String", "StringLiteral", "Character", "FormatString", "TemplateString",
  "LineComment", "BlockComment", "Comment", "RegExp",
];

function keywords(words: string): Completion[] {
  return words.split(" ").map((label) => ({ label, type: "keyword" }));
}

function types(words: string): Completion[] {
  return words.split(" ").map((label) => ({ label, type: "type" }));
}

function functions(words: string): Completion[] {
  return words.split(" ").map((label) => ({ label, type: "function" }));
}

const controlKeywords = keywords("if else for while do switch case break continue return");

// 與各語言套件內建的補全來源並存；C/C++ 補齊常用語法與解題片段。
export const EDITOR_COMPLETIONS: Record<LanguageKey, CompletionSource> = {
  cpp: ifNotIn(NON_CODE_NODES, completeFromList([
    ...controlKeywords,
    ...keywords("auto bool char class const constexpr delete enum false friend inline namespace new nullptr private protected public static struct template this throw true try typedef typename using virtual void"),
    ...types("int long double float size_t string vector array pair map unordered_map set unordered_set queue stack deque priority_queue"),
    ...functions("cin cout cerr push_back emplace_back pop_back size empty begin end sort reverse lower_bound upper_bound binary_search accumulate min max swap gcd abs to_string stoi getline"),
    snippetCompletion("for (int ${i} = 0; ${i} < ${n}; ++${i}) {\n\t${}\n}", {
      label: "fori", type: "keyword", detail: "計數迴圈",
    }),
    snippetCompletion("for (auto &${value} : ${container}) {\n\t${}\n}", {
      label: "rangefor", type: "keyword", detail: "範圍迴圈",
    }),
    snippetCompletion("cout << ${value} << '\\n';", {
      label: "coutln", type: "function", detail: "輸出並換行",
    }),
  ])),
  c: ifNotIn(NON_CODE_NODES, completeFromList([
    ...controlKeywords,
    ...keywords("const enum extern false inline sizeof static struct typedef true union unsigned void volatile"),
    ...types("char double float int long short size_t FILE"),
    ...functions("printf scanf fprintf fgets puts getchar putchar strlen strcmp strcpy memset memcpy malloc calloc realloc free qsort abs"),
    snippetCompletion("for (int ${i} = 0; ${i} < ${n}; ++${i}) {\n\t${}\n}", {
      label: "fori", type: "keyword", detail: "計數迴圈",
    }),
    snippetCompletion("scanf(\"%d\", &${value});", {
      label: "readint", type: "function", detail: "讀取整數",
    }),
  ])),
  python: ifNotIn(NON_CODE_NODES, completeFromList([
    snippetCompletion("list(map(int, input().split()))", {
      label: "ints", type: "function", detail: "讀取一行整數",
    }),
    snippetCompletion("sys.stdin.readline()", {
      label: "readline", type: "function", detail: "快速讀取（需 import sys）",
    }),
    snippetCompletion("for ${i} in range(${n}):\n\t${}", {
      label: "fori", type: "keyword", detail: "計數迴圈",
    }),
  ])),
  javascript: ifNotIn(NON_CODE_NODES, completeFromList([
    snippetCompletion("console.log(${value});", {
      label: "clog", type: "function", detail: "輸出到主控台",
    }),
    snippetCompletion("for (let ${i} = 0; ${i} < ${n}; ${i}++) {\n\t${}\n}", {
      label: "fori", type: "keyword", detail: "計數迴圈",
    }),
    snippetCompletion("require(\"fs\").readFileSync(0, \"utf8\")", {
      label: "stdin", type: "function", detail: "讀取標準輸入",
    }),
  ])),
  itoulang: ifNotIn(NON_CODE_NODES, completeFromList([
    ...keywords("令 設 函式 如果 否則 當 回傳 返回 中斷 跳出 繼續 真 假 空 且 並且 或 或者 let fn if else while return break continue true false null and or"),
    ...types("數字 數 字串 布林 任意 空 number string boolean any null"),
    ...functions("喵 喵喵 喵長 喵字 喵數 喵型 喵根 喵驗 喵黏 喵重複 喵選 喵叫 讀行 讀 喵吃 讀數"),
    snippetCompletion("令 ${name} = ${value};", {
      label: "令", type: "keyword", detail: "宣告變數",
    }),
    snippetCompletion("函式 ${name}(${params}) {\n  ${}\n}", {
      label: "函式", type: "keyword", detail: "定義函式",
    }),
    snippetCompletion("如果 (${condition}) {\n  ${}\n}", {
      label: "如果", type: "keyword", detail: "條件分支",
    }),
    snippetCompletion("當 (${condition}) {\n  ${}\n}", {
      label: "當", type: "keyword", detail: "迴圈",
    }),
    snippetCompletion("喵(${value});", {
      label: "喵", type: "function", detail: "輸出（print 別名）",
    }),
    snippetCompletion("讀行()", {
      label: "讀行", type: "function", detail: "讀取一行標準輸入",
    }),
  ])),
};

export const DOCUMENT_WORD_COMPLETIONS = ifNotIn(NON_CODE_NODES, completeAnyWord);
