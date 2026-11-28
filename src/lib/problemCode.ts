// 題目代碼：一碼小寫英文 + 三碼數字，依序遞增，滿 999 進位到下一字母。
// 例：a001…a999、b001…b999。英文只有一碼，上限 26 個字母。
const BLOCK = 999;
const MAX_LETTERS = 26;

export const PROBLEM_CODE_RE = /^[a-z][0-9]{3}$/;

// 由流水號（1 起算）產生代碼。
export function formatProblemCode(n: number): string {
  const index = Math.max(1, Math.floor(n)) - 1;
  const letterIndex = Math.floor(index / BLOCK);
  if (letterIndex >= MAX_LETTERS) {
    throw new Error("題目代碼已超過 z999 上限");
  }
  const letter = String.fromCharCode(97 + letterIndex);
  const number = (index % BLOCK) + 1;
  return `${letter}${String(number).padStart(3, "0")}`;
}

// 由代碼還原流水號；格式不符時回傳 null。
export function parseProblemCode(code: string): number | null {
  if (!PROBLEM_CODE_RE.test(code)) return null;
  const letterIndex = code.charCodeAt(0) - 97;
  const number = Number(code.slice(1));
  return letterIndex * BLOCK + number;
}

// 依照目前最大的代碼推算下一個代碼。
export function nextProblemCode(last: string | null | undefined): string {
  if (!last) return formatProblemCode(1);
  const parsed = parseProblemCode(last);
  return formatProblemCode((parsed ?? 0) + 1);
}
