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

// 與各語言套件內建的補全來源並存；C/C++/Java 補齊常用語法與解題片段。
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
  java: ifNotIn(NON_CODE_NODES, completeFromList([
    ...controlKeywords,
    ...keywords("abstract boolean catch class extends false final finally implements import instanceof interface new null package private protected public static super synchronized this throw throws true try void"),
    ...types("String StringBuilder Scanner Arrays Collections List ArrayList Map HashMap Set HashSet Queue PriorityQueue int long double boolean char"),
    ...functions("println print nextInt nextLine nextLong parseInt sort add get put containsKey size length charAt substring toString max min"),
    snippetCompletion("for (int ${i} = 0; ${i} < ${n}; ${i}++) {\n\t${}\n}", {
      label: "fori", type: "keyword", detail: "計數迴圈",
    }),
    snippetCompletion("System.out.println(${value});", {
      label: "sout", type: "function", detail: "輸出並換行",
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
};

export const DOCUMENT_WORD_COMPLETIONS = ifNotIn(NON_CODE_NODES, completeAnyWord);
