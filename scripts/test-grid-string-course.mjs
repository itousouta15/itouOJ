import assert from "node:assert/strict";
import test from "node:test";
import { problems } from "./lib/grid-string-course-problems.mjs";

// 這些答案獨立於題目檔的參考解手算，避免只用同一份程式驗證自己產生的測資。
const checks = [
  ["跑馬燈換班", "ABCD\n11", "DABC"],
  ["倒帶留言", "Z", "Z1"],
  ["鏡像相框", "3 1 H\nA\nB\nC", "A\nB\nC"],
  ["蛇形字幕牆", "2 4\nABCD\nEFGH", "ABCDHGFE"],
  ["郵票座標", "2 2\nAB\nCD\n4\nG 2 2\nS 2 2 Z\nS 2 2 X\nG 2 2", "D\nX"],
  ["像素海岸線", "2 3\n###\n###", "10"],
  ["印章拼貼", "1 1\nA\n1 1\nB\n2\n1 1\n1 1", "B"],
  ["招牌洗牌", "2 2\nAB\nCD\n2\nC 1 1\nR 2 1", "CB\nDA"],
  ["八方向尋字", "1 4\nABCD\nBC", "1"],
  ["破損字幕修補", "3 3\n???\n?Z?\n???", "?Z?\nZZZ\n?Z?"],
  ["編輯器選取框", "1 4\nABBA\n2\n1 1 1 4 A\n1 2 1 3 B", "2\n2"],
  ["廣播訊息迷宮", "1 1\nA\n1 1 E", "A"],
  ["同步文字校對", "1 1\n.\n1 1\n.", "0 0 0"],
  ["四向水印", "3 3\nAAA\nAAA\nAAA\n2 2\n??\n??", "4"],
  ["折紙密碼", "4 4\nABCD\nEFGH\nIJKL\nMNOP\n2\nD\nR", "2 2\nFE\nBA"],
  ["多區印刷計分", "2 2 2\n1 1 2 2 -3\n2 2 2 2 8", "5 1"],
  ["最大片字塊", "4 4\nBBBB\nBBBB\nBBBB\nBBBB", "4 B 1 1"],
  ["最短拼字路", "1 2\nAB\nABA", "2"],
];

test("題目及測資完整", () => {
  assert.equal(problems.length, 18);
  assert.equal(new Set(problems.map((p) => p.title)).size, 18);
  for (const problem of problems) {
    assert.equal(problem.testCases.filter((c) => c.isSample).length, 2);
    assert.ok(problem.testCases.length >= 6);
    assert.ok(problem.statement.split("## 輸入格式")[0].length >= 250, `${problem.title} 的題目描述過短`);
    assert.ok(problem.statement.includes("## 輸入格式"));
    assert.ok(problem.statement.includes("## 限制"));
    assert.ok(problem.statement.includes("## 輸出格式"));
    for (const example of problem.testCases.filter((c) => c.isSample)) {
      assert.ok(problem.statement.includes(`\`\`\`text\n${example.input}\n\`\`\``));
      assert.ok(problem.statement.includes(`\`\`\`text\n${example.output}\n\`\`\``));
    }
  }
});

for (const [title, input, expected] of checks) {
  test(`${title}：邊界／操作順序`, () => {
    const problem = problems.find((p) => p.title === title);
    assert.ok(problem);
    const actual = problem.testCases.find((c) => c.input === input);
    assert.ok(actual, "必須包含這筆隱藏測資");
    assert.equal(actual.output, expected);
  });
}
