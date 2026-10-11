import {
  completeAnyWord,
  completeFromList,
  ifNotIn,
  snippetCompletion,
  type Completion,
  type CompletionSource,
} from "@codemirror/autocomplete";
import type { LanguageKey } from "@/lib/languages";
import { ITOULANG_KEYWORDS, ITOULANG_TYPES, ITOULANG_BUILTINS } from "@/lib/itoulangEditor";

const NON_CODE_NODES = [
  "String", "StringLiteral", "Character", "FormatString", "TemplateString",
  "LineComment", "BlockComment", "Comment", "RegExp",
  "string", "comment",
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
    ...keywords(ITOULANG_KEYWORDS),
    ...types(ITOULANG_TYPES),
    ...functions(ITOULANG_BUILTINS),
    snippetCompletion("整數 主程式() {\n  ${}\n  回傳 0;\n}", {
      label: "主程式", type: "function", detail: "中文入口函式",
    }),
    snippetCompletion("整數 ${數值} = ${0};", {
      label: "整數", type: "type", detail: "型別前置宣告",
    }),
    snippetCompletion("迴圈 (整數 ${索引} = 0; ${索引} < ${次數}; ++${索引}) {\n  ${}\n}", {
      label: "迴圈", type: "keyword", detail: "計數迴圈",
    }),
    snippetCompletion("整數 ${名稱}(整數 ${數值}) {\n  回傳 ${數值};\n}", {
      label: "整數函式", type: "function", detail: "型別前置函式",
    }),
    snippetCompletion("函式<整數(整數)> ${操作} = ${函式值};", {
      label: "函式型別", type: "type", detail: "結構式函式型別",
    }),
    snippetCompletion("[&](整數 ${數值}) -> 整數 { 回傳 ${數值}; }", {
      label: "匿名函式", type: "function", detail: "捕獲外層變數的閉包",
    }),
    snippetCompletion("喵in >> ${數值};", {
      label: "喵in", type: "function", detail: "讀取標準輸入",
    }),
    snippetCompletion("喵out << ${數值} << 喵endl;", {
      label: "喵out", type: "function", detail: "輸出並換行",
    }),
    snippetCompletion("喵err << ${訊息} << 喵endl;", {
      label: "喵err", type: "function", detail: "標準錯誤輸出",
    }),
    snippetCompletion("喵log << ${訊息} << 喵endl;", {
      label: "喵log", type: "function", detail: "紀錄訊息",
    }),
    snippetCompletion("喵getline(喵in, ${文字});", {
      label: "喵getline", type: "function", detail: "讀取整行",
    }),
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
