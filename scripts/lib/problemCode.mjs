// 題目代碼：一碼小寫英文＋三碼數字（a001…a999、b001…），供一次性資料庫腳本共用。
// 網頁端的版本在 src/lib/problemCode.ts，這裡避免 .mjs 直接 import .ts。
const BLOCK = 999;

export function formatProblemCode(n) {
  const index = Math.max(1, Math.floor(n)) - 1;
  const letter = String.fromCharCode(97 + Math.floor(index / BLOCK));
  return `${letter}${String((index % BLOCK) + 1).padStart(3, "0")}`;
}

export function parseProblemCode(code) {
  if (!/^[a-z][0-9]{3}$/.test(code)) return null;
  return (code.charCodeAt(0) - 97) * BLOCK + Number(code.slice(1));
}

export function nextProblemCode(last) {
  if (!last) return formatProblemCode(1);
  return formatProblemCode((parseProblemCode(last) ?? 0) + 1);
}
