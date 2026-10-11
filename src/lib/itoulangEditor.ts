import { StreamLanguage } from "@codemirror/language";

export const ITOULANG_KEYWORDS = "令 設 函式 函 如果 若 否則 當 迴圈 對於 回傳 返回 中斷 跳出 繼續 真 假 空 且 並且 或 或者 let fn if else while for return break continue true false null and or";
export const ITOULANG_TYPES = "整數 浮點數 小數 數字 數 字串 布林 布林值 自動 任意 任意值 無值 空 int double float number string bool boolean auto any void null function";
export const ITOULANG_BUILTINS = "喵in 喵out 喵err 喵log 喵endl 喵getline 喵 喵喵 喵長 喵字 喵數 喵型 喵根 喵驗 喵黏 喵重複 喵選 喵叫 讀行 讀 喵吃 讀數 print len str number type sqrt assert cin cout cerr clog endl getline";

const keywords = new Set(ITOULANG_KEYWORDS.split(" "));
const types = new Set(ITOULANG_TYPES.split(" "));
const builtins = new Set(ITOULANG_BUILTINS.split(" "));

// StreamLanguage accepts Chinese identifiers and the type-first/stream syntax
// without asking a JavaScript parser to recover from every declaration.
export const itouLangLanguage = StreamLanguage.define({
  startState: () => ({ blockDepth: 0, braces: 0 }),
  token(stream, state) {
    if (!state.blockDepth && stream.eatSpace()) return null;
    if (state.blockDepth || stream.match("/*")) {
      if (!state.blockDepth) state.blockDepth = 1;
      while (!stream.eol()) {
        if (stream.match("/*")) state.blockDepth++;
        else if (stream.match("*/")) { if (!--state.blockDepth) break; }
        else stream.next();
      }
      return "comment";
    }
    if (stream.match("//")) { stream.skipToEnd(); return "comment"; }
    if (stream.match('"')) {
      let escaped = false;
      while (!stream.eol()) {
        const char = stream.next();
        if (char === '"' && !escaped) break;
        escaped = char === "\\" && !escaped;
      }
      return "string";
    }
    if (stream.match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/)) return "number";
    const word = stream.match(/^[A-Za-z_\p{Script=Han}][A-Za-z_0-9\p{Script=Han}]*/u);
    if (word && typeof word !== "boolean") {
      const name = word[0];
      if (name === "函式" || name === "函" || name === "fn") return stream.match(/^\s*</, false) ? "typeName" : "keyword";
      if (keywords.has(name)) return "keyword";
      if (types.has(name)) return "typeName";
      if (builtins.has(name)) return "variableName.special";
      return "variableName";
    }
    if (stream.match("{")) { state.braces++; return "brace"; }
    if (stream.match("}")) { state.braces = Math.max(0, state.braces - 1); return "brace"; }
    if (stream.match(/^(?:<<|>>|\+\+|--|[+\-*/%!=<>|&]=?|->)/)) return "operator";
    stream.next();
    return "punctuation";
  },
  indent(state, textAfter, context) {
    return Math.max(0, state.braces - (/^\s*}/.test(textAfter) ? 1 : 0)) * context.unit;
  },
  languageData: { commentTokens: { line: "//", block: { open: "/*", close: "*/" } } },
});
