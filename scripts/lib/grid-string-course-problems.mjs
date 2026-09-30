// 二維陣列與字串專題的題敘、參考解和固定種子測資。
// 可單獨載入檢查，不需要連線到資料庫。
import assert from "node:assert/strict";

let seed = 20260929;
function rand(n) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % n;
}
function randomGrid(rows, cols, alphabet) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => alphabet[rand(alphabet.length)]).join("")
  );
}
function gridInput(grid) {
  return `${grid.length} ${grid[0].length}\n${grid.join("\n")}`;
}
function parseGrid(lines, start = 1) {
  const [rows, cols] = lines[0].split(" ").map(Number);
  return { rows, cols, grid: lines.slice(start, start + rows).map((line) => [...line]) };
}
function lines(input) {
  return input.trimEnd().split("\n");
}
function makeProblem({ title, difficulty, tags, description, input, limits, output, samples, hidden, solve }) {
  assert.ok(samples.length >= 2 && hidden.length >= 4, `${title}：測資不足`);
  const seen = new Set();
  const testCases = [...samples.map((c) => ({ ...c, isSample: true })),
    ...hidden.map((text) => ({ input: text, isSample: false }))].map((test) => {
    assert.ok(!seen.has(test.input), `${title}：重複測資`);
    seen.add(test.input);
    const actual = solve(test.input);
    assert.equal(typeof actual, "string");
    assert.ok(actual.length > 0, `${title}：輸出不可為空`);
    if (test.isSample) assert.equal(actual, test.output, `${title}：範例輸出不符`);
    return { input: test.input, output: actual, isSample: test.isSample };
  });
  const statement = `## 題目描述\n\n${description}\n\n## 輸入格式\n\n${input}\n\n## 限制\n\n${limits}\n\n## 輸出格式\n\n${output}\n\n${samples.map((c, i) => `## 範例${i + 1}\n\n範例輸入：\n\n\`\`\`text\n${c.input}\n\`\`\`\n\n範例輸出：\n\n\`\`\`text\n${c.output}\n\`\`\`${c.note ? `\n\n${c.note}` : ""}`).join("\n\n")}`;
  return { title, difficulty, tags, statement, testCases };
}

export const COURSE_TITLE = "二維陣列與字串｜從基礎到挑戰";
export const COURSE_DESCRIPTION = "18 道循序漸進的程式題：字元走訪、二維操作、模擬、搜尋與動態規劃。";

export const problems = [
  makeProblem({
    title: "跑馬燈換班", difficulty: "easy", tags: ["字串", "模擬"],
    description: [
      "校慶快開始了，校門口的電子看板卻只會顯示一排固定長度的字。工作人員想讓訊息動起來：每過一拍，把目前最左邊的字元取下，接到最右邊，其餘字元依序往左挪一格。看板不會新增、刪除或改寫任何字元。",
      "例如訊息是 `HELLO`，過一拍會變成 `ELLOH`，再過一拍則是 `LLOHE`。當所有字元都輪流移到最右邊一次後，看板就回到最初的樣子；即使拍數非常大，也仍照同一個循環運作。",
      "你拿到看板開始播放時的字串 `s`，以及已經經過的拍數 `k`。請幫工作人員還原**恰好經過 k 拍**後看板上的整行訊息。若 `k = 0`，就輸出原本的訊息。",
    ].join("\n\n"),
    input: "第一行為不含空白的大寫英文字串 `s`；第二行為非負整數 `k`，表示拍數。",
    limits: "- 1 ≤ `s` 長度 ≤ 1000\n- 0 ≤ `k` ≤ 10⁹",
    output: "輸出一行，經過 `k` 拍後的字串。",
    samples: [
      { input: "HELLO\n2", output: "LLOHE", note: "第一拍顯示 `ELLOH`，第二拍再把最左邊的 `E` 搬到右端，得到 `LLOHE`。" },
      { input: "Z\n1000000000", output: "Z", note: "只有一個字元時，看板不會改變。" },
    ],
    hidden: ["ABCD\n0", "ABCD\n4", "ABCD\n11", "AAAAA\n123456789", `${"ABC".repeat(300)}\n1000000000`],
    solve(text) {
      const [s, k] = lines(text);
      const shift = Number(k) % s.length;
      return s.slice(shift) + s.slice(0, shift);
    },
  }),
  makeProblem({
    title: "倒帶留言", difficulty: "easy", tags: ["字串"],
    description: [
      "學校的舊留言機保存了一卷很長的字母錄音帶。它不認識完整的單字，只知道從左到右讀取字母，遇到連續重複的聲音時，把這一整段記成「字母」後面接「這段的長度」。每一段都要記錄，就算只有一個字母也要寫上 `1`。",
      "例如讀到 `AAABBA`，可以分成 `AAA`、`BB`、`A` 三段，記錄就會是 `A3B2A1`。最後一段的 `A` 雖然和第一段一樣，但中間隔著 `BB`，因此不能合併成同一段。段落長度可能超過 9，此時要寫出完整的十進位數字，例如十二個連續的 `Z` 應記為 `Z12`。",
      "現在有一則只含大寫字母的原始留言。請依照留言機的規則，從頭到尾產生它的記錄。這項規則的目的只是保存連續段落，結果不一定比原字串短。",
    ].join("\n\n"),
    input: "一行不含空白、只包含大寫英文字母的字串 `s`。",
    limits: "1 ≤ `s` 長度 ≤ 10000。計數以十進位書寫，不補零。",
    output: "輸出一行，壓縮後的字串。",
    samples: [
      { input: "AAABBCCCC", output: "A3B2C4", note: "三段依序是三個 A、兩個 B、四個 C。" },
      { input: "ABABA", output: "A1B1A1B1A1", note: "相鄰字母每次都不同，因此五個字母各自形成長度為 1 的段落。" },
    ],
    hidden: ["Z", "AAAAAAAAAAAA", "ABBBBBBBBBBBBA", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", `${"A".repeat(10000)}`],
    solve(text) {
      const s = lines(text)[0];
      let result = "";
      for (let i = 0; i < s.length;) {
        let j = i + 1;
        while (j < s.length && s[i] === s[j]) j++;
        result += s[i] + (j - i);
        i = j;
      }
      return result;
    },
  }),
  makeProblem({
    title: "鏡像相框", difficulty: "easy", tags: ["陣列", "字串"],
    description: [
      "美術社製作了一個由字母排成的電子相框，共有 `R` 列、每列 `C` 個字元。相框有兩個鏡像按鈕，但按鈕上的英文代號讓新加入的社員有些困惑。你的工作是按照指定按鈕，把整幅字母畫面正確翻轉並輸出。",
      "按下 `H` 時，把**每一列中的字元順序**左右顛倒：原本在最左邊的字元會跑到同一列最右邊，列與列的上下順序不變。按下 `V` 時，把**整列的上下順序**顛倒：第一列與最後一列交換，第二列與倒數第二列交換；每列內部的字元不會左右顛倒。",
      "這次只會按下其中一個按鈕，沒有連續操作。翻轉後相框的列數和行數都不變；若只有一列或一行，有些按鈕可能使畫面看起來完全沒變，那也要照原樣輸出。",
    ].join("\n\n"),
    input: "第一行為整數 `R C` 和字元 `H` 或 `V`；接著 `R` 行，每行恰有 `C` 個大寫英文字母。",
    limits: "1 ≤ `R, C` ≤ 30。",
    output: "輸出 `R` 行，鏡像後的相框；每行不含空白。",
    samples: [
      { input: "2 3 H\nABC\nDEF", output: "CBA\nFED", note: "`H` 只反轉每一列的字元，原本的第一列仍是第一列。" },
      { input: "3 2 V\nAB\nCD\nEF", output: "EF\nCD\nAB", note: "`V` 交換第一列與第三列，中間的 `CD` 不動。" },
    ],
    hidden: ["1 1 H\nX", "1 3 V\nABC", "3 1 H\nA\nB\nC", `30 30 H\n${randomGrid(30, 30, "ABCD").join("\n")}`, `30 30 V\n${randomGrid(30, 30, "ABCDE").join("\n")}`],
    solve(text) {
      const [header, ...grid] = lines(text);
      const dir = header.split(" ")[2];
      return (dir === "H" ? grid.map((row) => [...row].reverse().join("")) : grid.reverse()).join("\n");
    },
  }),
  makeProblem({
    title: "蛇形字幕牆", difficulty: "easy", tags: ["陣列", "字串"],
    description: [
      "校園活動的字幕牆把一段訊息排進 `R × C` 個小方格。維修人員使用的掃描器不會在每讀完一列後直接回到左邊：它會從當前位置轉彎，沿著下一列反方向繼續讀，就像在牆上畫出一條來回折返的路線。",
      "它從最上面一列的**左端**開始，先由左到右讀完第一列；再從第二列的**右端**由右到左讀取；第三列又由左到右，依此交替。每個方格都恰好讀一次，到了最下面一列讀完才停止。",
      "請把一路讀到的字元直接接在一起，還原掃描器收到的完整訊息。列與列之間不要加入空白、分隔符號或額外字元。特別注意：掃描方向交替改變，但字幕牆本身並沒有被翻轉。",
    ].join("\n\n"),
    input: "第一行為 `R C`；接下來 `R` 行，每行恰有 `C` 個大寫英文字母。",
    limits: "1 ≤ `R, C` ≤ 100。",
    output: "輸出一行串接後的字串，不插入空白或換行。",
    samples: [
      { input: "3 3\nABC\nDEF\nGHI", output: "ABCFEDGHI", note: "三列依序讀成 `ABC`、`FED`、`GHI`，接起來就是答案。" },
      { input: "2 1\nA\nB", output: "AB", note: "每列只有一個字元時，不論方向為何都讀同一格。" },
    ],
    hidden: ["1 4\nABCD", "2 4\nABCD\nEFGH", "4 2\nAB\nCD\nEF\nGH", gridInput(randomGrid(100, 100, "ABCDE"))],
    solve(text) {
      const grid = lines(text).slice(1);
      return grid.map((row, i) => i % 2 ? [...row].reverse().join("") : row).join("");
    },
  }),
  makeProblem({
    title: "郵票座標", difficulty: "easy", tags: ["陣列", "字串", "模擬"],
    description: [
      "郵局把收藏家的郵票冊畫成一張字元方格。每個格子放一個大寫字母當作郵票圖案，或用 `.` 表示目前是空格。收藏家會一邊整理、一邊詢問某個位置現在放的是什麼；你需要照著操作發生的先後順序，隨時掌握郵票冊的狀態。",
      "操作 `S r c x` 表示在第 `r` 列、第 `c` 行貼上 `x`。它會直接**取代**原本的內容，原本有郵票也可以覆蓋；若 `x` 是 `.`，就等於清空該格。操作 `G r c` 則只查看當下該格的字元，查詢本身不會改變郵票冊。",
      "所有座標都從左上角的 `(1, 1)` 開始計算，列號往下增加，行號往右增加。請依序回答每一次 `G`；先前的貼上操作會影響後來的查詢，後來的貼上操作則不能改變已經輸出的答案。",
    ].join("\n\n"),
    input: "第一行為 `R C`；接著 `R` 行方格，每行恰有 `C` 個字元；下一行為操作數 `Q`；最後 `Q` 行為 `S r c x` 或 `G r c`。保證至少有一個 `G`。",
    limits: "- 1 ≤ `R, C` ≤ 50；1 ≤ `Q` ≤ 200\n- 方格與貼入字元只包含大寫英文字母或 `.`；座標都在範圍內",
    output: "每次 `G` 輸出一行查到的字元。",
    samples: [
      { input: "2 3\nA..\n..B\n5\nG 1 1\nS 1 2 X\nG 1 2\nS 2 3 .\nG 2 3", output: "A\nX\n.", note: "第一次查詢看到原本的 A；貼上 X 後第二次看到 X；最後清掉 B，所以第三次查到 `.`。" },
      { input: "1 1\n.\n2\nS 1 1 Z\nG 1 1", output: "Z", note: "只有一格的郵票冊也可以先貼上，再立即查詢。" },
    ],
    hidden: ["1 1\nA\n1\nG 1 1", "2 2\nAB\nCD\n4\nG 2 2\nS 2 2 Z\nS 2 2 X\nG 2 2", `50 50\n${randomGrid(50, 50, "AB.").join("\n")}\n3\nS 50 50 Z\nG 50 50\nG 1 1`, `1 3\n...\n5\nS 1 2 A\nG 1 2\nS 1 2 .\nG 1 2\nG 1 3`],
    solve(text) {
      const all = lines(text);
      const { rows, grid } = parseGrid(all);
      const q = Number(all[rows + 1]);
      const out = [];
      for (let i = 0; i < q; i++) {
        const [type, r, c, char] = all[rows + 2 + i].split(" ");
        if (type === "G") out.push(grid[Number(r) - 1][Number(c) - 1]);
        else grid[Number(r) - 1][Number(c) - 1] = char;
      }
      return out.join("\n");
    },
  }),
  makeProblem({
    title: "像素海岸線", difficulty: "easy", tags: ["陣列", "模擬"],
    description: [
      "美術老師用許多小正方形拼出一幅像素畫。畫布上的 `#` 是上色的方格，`.` 是空白。老師要沿著所有上色區塊的邊緣貼亮片，因此想知道總共有多少條小方格的邊露在外面。",
      "每個 `#` 都有上、下、左、右四條邊。如果一條邊的另一側也是 `#`，兩格貼在一起，這條邊不算露出；另一側若是 `.`，或已經超出畫布，這條邊就算露出。斜對角相碰不會讓兩格共用邊，所以仍要分別計算它們的露出邊。",
      "畫面可能有不只一塊彼此分離的圖案，也可能全部都是空白。請把**所有**上色方格露出的邊加總，而不是只計算其中一塊圖案。",
    ].join("\n\n"),
    input: "第一行為 `R C`；接著 `R` 行，每行恰有 `C` 個 `#` 或 `.`。",
    limits: "1 ≤ `R, C` ≤ 100。",
    output: "輸出一個整數，露出的總邊數。",
    samples: [
      { input: "3 3\n##.\n.#.\n..#", output: "12", note: "共有四格上色，原本有 16 條邊；其中兩對方格上下或左右相鄰，每對各使兩條邊不露出，所以剩下 12 條。" },
      { input: "1 1\n#", output: "4", note: "單獨一格的四條邊都面向畫布外。" },
    ],
    hidden: ["1 1\n.", "2 3\n###\n###", "3 3\n#.#\n.#.\n#.#", gridInput(randomGrid(100, 100, "#..."))],
    solve(text) {
      const { rows, cols, grid } = parseGrid(lines(text));
      let exposed = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== "#") continue;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (r + dr < 0 || r + dr >= rows || c + dc < 0 || c + dc >= cols || grid[r + dr][c + dc] === ".") exposed++;
        }
      }
      return String(exposed);
    },
  }),
  makeProblem({
    title: "印章拼貼", difficulty: "medium", tags: ["陣列", "字串", "模擬"],
    description: [
      "美術社要用同一顆印章裝飾一張海報。海報本身是一張 `R × C` 的字元方格，可能已經印有字母，也可能有空白位置 `.`；印章則是一張較小的 `H × W` 字元方格。每次蓋章時，美術社只會移動印章的位置，不會旋轉印章或改變它的圖案。",
      "印章上的字母有顏料，會**覆蓋**海報對應位置原本的字元；印章上的 `.` 是透明的，不會把海報原有的字母擦掉，也不會清空先前蓋過的顏色。若兩次蓋章的有色部分落在同一格，最後看見的是**後蓋**的那個字母。",
      "每筆座標指定印章左上角對準海報的哪一格，從 `(1, 1)` 開始計算。請依序完成全部蓋章操作，再輸出海報最後的樣子。印章即使完全透明，操作仍然有效，只是畫面不會變。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行海報；下一行 `H W`，接著 `H` 行印章；下一行 `Q`，最後 `Q` 行各有座標 `r c`，表示印章左上角的位置。座標從 1 開始。",
    limits: "- 1 ≤ `R, C` ≤ 50；1 ≤ `H` ≤ `R`、1 ≤ `W` ≤ `C`；1 ≤ `Q` ≤ 100\n- 所有放置都完全在海報內；海報與印章只包含大寫字母和 `.`",
    output: "輸出 `R` 行蓋完章後的海報，每行不含空白。",
    samples: [
      { input: "3 4\n....\n....\n....\n2 2\nA.\n.B\n2\n1 2\n2 3", output: ".A..\n..A.\n...B", note: "第一次蓋章後第二列第三格是 B；第二次的 A 落在同一格，覆蓋了先前的 B。" },
      { input: "1 1\nZ\n1 1\n.\n1\n1 1", output: "Z", note: "印章只有透明格，所以原本的 Z 留在海報上。" },
    ],
    hidden: ["1 1\nA\n1 1\nB\n2\n1 1\n1 1", "2 2\nAB\nCD\n2 2\n..\n..\n1\n1 1", "3 3\nAAA\nAAA\nAAA\n2 2\nBX\nY.\n3\n1 1\n2 2\n1 2", `50 50\n${randomGrid(50, 50, "AB.").join("\n")}\n1 1\nX\n2\n1 1\n50 50`],
    solve(text) {
      const all = lines(text);
      const { rows, grid } = parseGrid(all);
      const [h, w] = all[rows + 1].split(" ").map(Number);
      const stamp = all.slice(rows + 2, rows + 2 + h);
      const q = Number(all[rows + 2 + h]);
      for (let i = 0; i < q; i++) {
        const [r, c] = all[rows + 3 + h + i].split(" ").map((x) => Number(x) - 1);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (stamp[y][x] !== ".") grid[r + y][c + x] = stamp[y][x];
        }
      }
      return grid.map((row) => row.join("")).join("\n");
    },
  }),
  makeProblem({
    title: "招牌洗牌", difficulty: "medium", tags: ["陣列", "字串", "模擬"],
    description: [
      "商店門口的電子招牌由 `R` 列、`C` 行的字母燈組成。老闆能按鈕讓其中一整列向右捲動，或讓其中一整行向下捲動。這不是把字母丟掉：捲出邊界的字母會繞回同一列或同一行的另一端，形成循環。",
      "操作 `R r k` 只影響第 `r` 列：該列每個字母同時往**右**移動 `k` 格，超出最右邊便從最左邊出現。操作 `C c k` 只影響第 `c` 行：該行每個字母同時往**下**移動 `k` 格，超出最下方便從最上方出現。沒有被指定的其他列或行不會在該次操作中主動移動。",
      "老闆會連續下達多個指令，後一個指令看到的是前一個指令**完成後**的招牌。因此，先移列再移行，和先移行再移列，結果不一定相同。移動 `0` 格或剛好移動完整一圈時，該次操作不改變畫面；很大的 `k` 也照循環規則處理。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行字母；下一行為操作數 `Q`；接著 `Q` 行，每行格式為 `R r k` 或 `C c k`。列、行編號從 1 開始。",
    limits: "- 1 ≤ `R, C` ≤ 50；1 ≤ `Q` ≤ 200；0 ≤ `k` ≤ 10⁹\n- 方格只包含大寫英文字母，操作編號都在範圍內",
    output: "輸出操作後的 `R` 行字母方格。",
    samples: [
      { input: "2 3\nABC\nDEF\n2\nR 1 1\nC 2 1", output: "CEB\nDAF", note: "先把第一列 `ABC` 右移成 `CAB`；接著第二行的 A、E 循環向下交換，得到最後的兩列。" },
      { input: "1 1\nZ\n2\nR 1 100\nC 1 200", output: "Z", note: "列與行都只有一格，無論循環移動多少次，字母仍是 Z。" },
    ],
    hidden: ["2 2\nAB\nCD\n2\nC 1 1\nR 2 1", "1 3\nABC\n2\nR 1 1000000000\nC 3 99", "3 1\nA\nB\nC\n2\nC 1 1\nR 3 9", `50 50\n${randomGrid(50, 50, "ABCDE").join("\n")}\n4\nR 50 999999999\nC 1 12345\nC 50 42\nR 1 7`],
    solve(text) {
      const all = lines(text);
      const { rows, cols, grid } = parseGrid(all);
      const q = Number(all[rows + 1]);
      for (let i = 0; i < q; i++) {
        const [type, n, k] = all[rows + 2 + i].split(" ");
        const index = Number(n) - 1;
        if (type === "R") {
          const copy = grid[index].slice();
          for (let c = 0; c < cols; c++) grid[index][(c + Number(k) % cols) % cols] = copy[c];
        } else {
          const copy = grid.map((row) => row[index]);
          for (let r = 0; r < rows; r++) grid[(r + Number(k) % rows) % rows][index] = copy[r];
        }
      }
      return grid.map((row) => row.join("")).join("\n");
    },
  }),
  makeProblem({
    title: "八方向尋字", difficulty: "medium", tags: ["陣列", "字串"],
    description: [
      "社團的尋字遊戲把字母寫進方格，請同學找出指定單字。單字可以由左往右、由右往左、由上往下、由下往上，也可以沿著四個斜角方向出現，總共八個方向。每次尋找都從某個方格當作第一個字母開始，接著沿固定方向前進。",
      "往前走時每一步只能移到那個方向的**下一格**，每格取一個字母；途中不能轉彎、跳格、繞到另一側，或走出方格。若取得的字母依序恰好等於目標單字，就找到一次。只要**起點不同或方向不同**，便視為不同的出現方式，即使選到的部分格子相同也一樣。",
      "例如在整張都是 `A` 的 2×2 方格尋找 `AA`，每個角落都有三個能走到另一格的方向，因此總共有 12 次。注意：你只需要比對輸入的單字；若它剛好前後相同，也照起點和方向分開計數，不要自行排除反向走法。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行字母方格；最後一行為目標單字 `s`。",
    limits: "- 1 ≤ `R, C` ≤ 30；2 ≤ `s` 長度 ≤ 30\n- 方格與 `s` 只包含大寫英文字母",
    output: "輸出一個整數，符合的起點與方向組合數。",
    samples: [
      { input: "3 3\nCAT\nAXA\nTAC\nCAT", output: "4", note: "可以從第一列由左往右、第一行由上往下、第三列由右往左，以及第三行由下往上讀到 CAT。" },
      { input: "2 2\nAA\nAA\nAA", output: "12", note: "四個格子各有三個可走到相鄰格子的方向。" },
    ],
    hidden: ["1 4\nABCD\nBC", "2 2\nAB\nCD\nZZ", "3 1\nA\nB\nA\nABA", `30 30\n${randomGrid(30, 30, "AB").join("\n")}\nABABABAB`, `1 1\nA\nAA`],
    solve(text) {
      const all = lines(text);
      const { rows, cols, grid } = parseGrid(all);
      const s = all[rows + 1];
      let count = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          let i = 0;
          for (; i < s.length; i++) {
            const y = r + dr * i, x = c + dc * i;
            if (y < 0 || y >= rows || x < 0 || x >= cols || grid[y][x] !== s[i]) break;
          }
          if (i === s.length) count++;
        }
      }
      return String(count);
    },
  }),
  makeProblem({
    title: "破損字幕修補", difficulty: "medium", tags: ["陣列", "字串", "模擬"],
    description: [
      "演唱會字幕牆有些格子的資料損毀了，畫面用 `?` 標出這些讀不到的字元。工程師只打算進行**一輪**自動修補：每個損毀格子向上下左右看看，參考附近仍看得到的字母來決定要填入什麼。斜對角的格子不算鄰居；超出字幕牆的方向也不算。",
      "對每個 `?`，只統計相鄰格子中原本就不是 `?` 的大寫字母，選出出現次數最多的字母填入。若多個字母次數並列，選字母順序最小的；如果四個方向都找不到可用字母，該格仍保留 `?`。原本就完整的字母不可改動。",
      "所有損毀格子要視為**同時**修補：判斷每一格時只能看修補之前的原始畫面。就算隔壁的 `?` 在這一輪也會被填上字母，它填出的結果也不能拿來幫你修補目前這格。請輸出一輪修補結束後的字幕牆。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行，每行恰有 `C` 個大寫英文字母或 `?`。",
    limits: "1 ≤ `R, C` ≤ 100。",
    output: "輸出修補後的 `R` 行字幕牆。",
    samples: [
      { input: "2 2\nA?\n?B", output: "AA\nAB", note: "兩個問號都遇到 A、B 各一次，平手選 A。" },
      { input: "1 1\n?", output: "?", note: "唯一的格子沒有任何相鄰字母，因此不能猜出內容。" },
    ],
    hidden: ["1 3\n?A?", "3 3\n???\n?Z?\n???", "2 3\nAB?\nA?B", gridInput(randomGrid(100, 100, "AB??"))],
    solve(text) {
      const { rows, cols, grid } = parseGrid(lines(text));
      const result = grid.map((row) => row.slice());
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== "?") continue;
        const counts = Array(26).fill(0);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const y = r + dr, x = c + dc;
          if (y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] !== "?") counts[grid[y][x].charCodeAt(0) - 65]++;
        }
        const best = Math.max(...counts);
        if (best > 0) result[r][c] = String.fromCharCode(65 + counts.indexOf(best));
      }
      return result.map((row) => row.join("")).join("\n");
    },
  }),
  makeProblem({
    title: "編輯器選取框", difficulty: "medium", tags: ["陣列", "字串"],
    description: [
      "文字編輯器可以把一份固定的文件排成 `R` 列、每列 `C` 個字母。校稿員經常用滑鼠框選文件的一小塊區域，再問編輯器：這個選取範圍內，指定的字母總共出現了幾次？框選可能只涵蓋一格，也可能一次選到整份文件。",
      "每筆查詢提供左上角 `(r1, c1)`、右下角 `(r2, c2)` 和目標字母 `x`。從第 `r1` 列到第 `r2` 列、第 `c1` 行到第 `c2` 行，**包含四周邊界**，都是這次要計算的位置。即使某個字母在選取框中重複出現，也要按每個格子各算一次。",
      "校稿員只會查詢，不會修改文件；因此所有查詢都依據最初那張字母方格。因為查詢數量可能很多，請依輸入順序把每筆結果各輸出一行，不要只回覆最後一次的答案。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行字母方格；下一行為查詢數 `Q`；每筆查詢為 `r1 c1 r2 c2 x`，座標從 1 開始，`x` 是大寫英文字母。",
    limits: "- 1 ≤ `R, C` ≤ 300；1 ≤ `Q` ≤ 20000\n- `1 ≤ r1 ≤ r2 ≤ R`、`1 ≤ c1 ≤ c2 ≤ C`；方格只含大寫英文字母",
    output: "每筆查詢各輸出一行整數。",
    samples: [
      { input: "2 3\nABC\nABA\n3\n1 1 2 3 A\n2 2 2 3 B\n1 2 1 2 C", output: "3\n1\n0", note: "整個方格有三個 A；第二筆選到最後一列的 B、A，只有一個 B；第三筆只選第一列第二行的 B，因此沒有 C。" },
      { input: "1 1\nZ\n2\n1 1 1 1 Z\n1 1 1 1 A", output: "1\n0", note: "查詢同一個單格選取框，指定的字母不同，答案也不同。" },
    ],
    hidden: ["2 2\nAA\nAA\n2\n1 1 2 2 A\n2 2 2 2 A", "3 3\nABC\nABC\nABC\n3\n1 2 3 2 B\n1 3 2 3 C\n2 1 3 1 Z", "1 4\nABBA\n2\n1 1 1 4 A\n1 2 1 3 B", (() => {
      const grid = randomGrid(120, 120, "ABCDE");
      const queries = Array.from({ length: 5000 }, () => {
        const a = 1 + rand(120), b = 1 + rand(120), c = 1 + rand(120), d = 1 + rand(120);
        return `${Math.min(a, b)} ${Math.min(c, d)} ${Math.max(a, b)} ${Math.max(c, d)} ${"ABCDE"[rand(5)]}`;
      });
      return `${gridInput(grid)}\n${queries.length}\n${queries.join("\n")}`;
    })()],
    solve(text) {
      const all = lines(text);
      const { rows, cols, grid } = parseGrid(all);
      const queries = all.slice(rows + 2);
      const cache = new Map();
      return queries.map((query) => {
        const [r1, c1, r2, c2, char] = query.split(" ");
        if (!cache.has(char)) {
          const sum = Array.from({ length: rows + 1 }, () => new Int32Array(cols + 1));
          for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) {
            sum[r][c] = sum[r - 1][c] + sum[r][c - 1] - sum[r - 1][c - 1] + Number(grid[r - 1][c - 1] === char);
          }
          cache.set(char, sum);
        }
        const s = cache.get(char), a = Number(r1), b = Number(c1), y = Number(r2), x = Number(c2);
        return s[y][x] - s[a - 1][x] - s[y][b - 1] + s[a - 1][b - 1];
      }).join("\n");
    },
  }),
  makeProblem({
    title: "廣播訊息迷宮", difficulty: "medium", tags: ["陣列", "字串", "模擬"],
    description: [
      "校園廣播室派了一台機器人進入字元迷宮，沿途收集散落的字母，拼成要播出的訊息。機器人一開始站在指定的格子，並面向北、東、南、西其中一個方向。每次它會先處理腳下的格子，再依目前朝向往相鄰格走**一步**，一直重複。",
      "字母格會把字母加到訊息尾端，並沿原本朝向繼續走；`U`、`D`、`L`、`R` 是轉向指令，分別把朝向設定成上、下、左、右，不加入訊息，隨後沿新朝向走一步。`#` 是牆，不能踏入。如果下一步會出界或碰到牆，機器人便停下。",
      "迷宮裡可能繞圈。處理一格時，若它的**座標與處理該格指令後的朝向**和先前處理過的狀態相同，就在這次收集字母之前停止，避免讓訊息無限增長。最後輸出依序收到的字母；若從頭到尾沒收到任何字母，就輸出 `-`。起點保證不是牆。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行方格；最後一行為起點 `r c d`，其中 `d` 為 `N`、`E`、`S`、`W`。起點不是牆，座標從 1 開始。",
    limits: "- 1 ≤ `R, C` ≤ 30\n- 字母格可用 `A` 至 `Z`，但不包含保留作方向指令的 `U`、`D`、`L`、`R`；其餘格子只含方向指令或 `#`",
    output: "輸出一行，依序收到的字母；若沒有收到字母則輸出 `-`。",
    samples: [
      { input: "2 3\nAB#\nCXE\n1 1 E", output: "AB", note: "從左上角朝東出發，先收集 A、B；下一步面前是牆，機器人停下。" },
      { input: "1 2\nRL\n1 1 E", output: "-", note: "機器人走回相同位置及朝向時停止。" },
    ],
    hidden: ["1 1\nA\n1 1 E", "2 2\nRR\nRR\n2 2 N", "2 3\nA#B\nCDE\n2 1 N", `30 30\n${randomGrid(30, 30, "ABC#RL").map((row, i) => i === 0 ? "A" + row.slice(1) : row).join("\n")}\n1 1 E`],
    solve(text) {
      const all = lines(text);
      const { rows, cols, grid } = parseGrid(all);
      let [r, c, direction] = all[rows + 1].split(" ");
      r = Number(r) - 1; c = Number(c) - 1;
      const step = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
      const arrows = { U: "N", D: "S", L: "W", R: "E" };
      let message = "";
      const visited = new Set();
      while (r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] !== "#") {
        const cell = grid[r][c];
        direction = arrows[cell] ?? direction;
        const state = `${r},${c},${direction}`;
        if (visited.has(state)) break;
        visited.add(state);
        if (!(cell in arrows)) message += cell;
        const [dr, dc] = step[direction];
        r += dr; c += dc;
      }
      return message || "-";
    },
  }),
  makeProblem({
    title: "同步文字校對", difficulty: "medium", tags: ["陣列", "字串", "模擬"],
    description: [
      "出版社員把兩張透明投影片 A、B 上的文字印得有點錯位。每張投影片都是由大寫字母與透明格 `.` 組成的方格；你可以拿起 B，在**不旋轉、不翻面**的情況下，把它平移到 A 的上方，看看兩張投影片的文字能重合多少。",
      "以 A 的左上角為座標 `(0, 0)`。若 B 左上角放在 `(dy, dx)`，`dy` 為向下移動的列數，`dx` 為向右移動的行數；往上或往左可用負數。只有兩張投影片的**矩形範圍都涵蓋到**的格子才可能得分：兩個位置都是相同的大寫字母，該格得 1 分；不同字母或任一方為 `.`，得 0 分。",
      "只比較兩張矩形範圍至少重疊一格的放法。請找出最高總分和對應的位移；最高分若有多種放法，選 `dy` 最小的，再從中選 `dx` 最小的。即使所有放法的得分都是 0，也仍要依這套規則選出一種位移。",
    ].join("\n\n"),
    input: "第一行 `R1 C1`，接著 `R1` 行 A；下一行 `R2 C2`，接著 `R2` 行 B。",
    limits: "- 1 ≤ `R1, C1, R2, C2` ≤ 12\n- 每格是大寫英文字母或 `.`；座標以 0 起算，向下、向右為正",
    output: "輸出一行 `最大吻合數 dy dx`。",
    samples: [
      { input: "2 2\nAB\nCD\n2 2\nAB\nCD", output: "4 0 0", note: "兩張投影片完全重合時，四個字母都對齊，不需要平移。" },
      { input: "1 2\nAB\n1 2\nBA", output: "1 0 -1", note: "往左或往右錯開一格都吻合一次，選 dx 較小的 -1。" },
    ],
    hidden: ["1 1\n.\n1 1\n.", "1 1\nA\n2 2\nAB\nCA", "2 1\nA\nB\n1 2\nBA", `12 12\n${randomGrid(12, 12, "ABC.").join("\n")}\n12 12\n${randomGrid(12, 12, "ABC.").join("\n")}`],
    solve(text) {
      const all = lines(text);
      const [h1, w1] = all[0].split(" ").map(Number);
      const a = all.slice(1, h1 + 1);
      const [h2, w2] = all[h1 + 1].split(" ").map(Number);
      const b = all.slice(h1 + 2, h1 + 2 + h2);
      let best = [-1, 0, 0];
      for (let dy = 1 - h2; dy < h1; dy++) for (let dx = 1 - w2; dx < w1; dx++) {
        let count = 0;
        for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
          if (dy + y >= 0 && dy + y < h1 && dx + x >= 0 && dx + x < w1 && b[y][x] !== "." && a[dy + y][dx + x] === b[y][x]) count++;
        }
        if (count > best[0]) best = [count, dy, dx];
      }
      return best.join(" ");
    },
  }),
  makeProblem({
    title: "四向水印", difficulty: "hard", tags: ["陣列", "字串"],
    description: [
      "印刷廠懷疑有些海報被偷偷加上了特殊水印。你拿到一張由大寫字母排成的海報，還有一小塊水印圖樣；工廠的印章能順時針旋轉 0、90、180 或 270 度，再完整蓋到海報上的某個位置。請找出海報上有多少個位置能對應這枚水印。",
      "水印中，大寫字母必須與海報上相對位置的字母完全相同；`?` 是萬用格，能對應任意一個字母。旋轉時，整張水印連同 `?` 一起旋轉，長方形水印在旋轉 90 或 270 度後，列數與行數會交換。不能翻面，也不能只把一部分水印放進海報；超出海報邊界的放法無效。",
      "答案計算的是**海報上的左上角位置數**，不是可行的旋轉角度數。某個位置只要能用至少一個角度貼合，就算一次；即使對稱圖樣讓四個角度都貼得上，也不可重複計算。同一位置的某個角度放不下時，其他角度仍可以個別嘗試。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行海報；下一行 `H W`，接著 `H` 行水印。",
    limits: "- 1 ≤ `R, C` ≤ 60；1 ≤ `H, W` ≤ 10\n- 海報只含大寫英文字母；水印只含大寫英文字母與 `?`",
    output: "輸出一個整數，符合條件的不同左上角位置數。",
    samples: [
      { input: "3 3\nABC\nDEF\nGHI\n2 2\nAB\nDE", output: "1", note: "水印維持原角度時，只有海報左上角的 2×2 區域完全吻合。" },
      { input: "2 2\nAA\nAA\n1 1\n?", output: "4", note: "同一格對應四種角度，仍只能計算一次。" },
    ],
    hidden: ["1 3\nABC\n1 2\nAB", "2 3\nABC\nDEF\n3 2\nAD\nBE\nCF", "3 3\nAAA\nAAA\nAAA\n2 2\n??\n??", "2 2\nAB\nCD\n3 3\nABC\nDEF\nGHI", `60 60\n${randomGrid(60, 60, "ABC").join("\n")}\n4 9\n${randomGrid(4, 9, "ABC?").join("\n")}`],
    solve(text) {
      const all = lines(text);
      const { rows, cols, grid } = parseGrid(all);
      const [h] = all[rows + 1].split(" ").map(Number);
      let pattern = all.slice(rows + 2, rows + 2 + h).map((row) => [...row]);
      const rotations = [];
      for (let turn = 0; turn < 4; turn++) {
        rotations.push(pattern);
        pattern = Array.from({ length: pattern[0].length }, (_, r) =>
          Array.from({ length: pattern.length }, (_, c) => pattern[pattern.length - 1 - c][r]));
      }
      let answer = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (rotations.some((stamp) => {
          if (r + stamp.length > rows || c + stamp[0].length > cols) return false;
          for (let y = 0; y < stamp.length; y++) for (let x = 0; x < stamp[0].length; x++) {
            if (stamp[y][x] !== "?" && stamp[y][x] !== grid[r + y][c + x]) return false;
          }
          return true;
        })) answer++;
      }
      return String(answer);
    },
  }),
  makeProblem({
    title: "折紙密碼", difficulty: "hard", tags: ["陣列", "字串", "模擬"],
    description: [
      "研究員在一張方格紙上寫下密碼字母，有些位置則留成透明空位 `.`。他將紙張接連對折，讓原本相距很遠的格子疊在一起，最後只從正面看折完的紙。你知道紙張原本的樣子和所有折疊指令，請重建最後看得到的圖案。",
      "每次都沿著**當前紙張的正中央**對折。`D` 表示把上半部往下蓋在下半部，`U` 是把下半部往上蓋在上半部；`R` 是左半部往右蓋，`L` 是右半部往左蓋。折過去的半邊會以折線為軸呈鏡像排列，例如最靠近折線的格子會蓋到另一側最靠近折線的格子。折完後，被折到的那一半成為上層，紙張在該方向的長度減半。",
      "同一位置若上下兩層都有字母，從正面只看得見上層字母；上層若為 `.`，就透過透明處看到下層，兩層都是 `.` 才仍是空位。後續的指令是對**整張已經摺過的紙**繼續操作，不能每次都回到最初的方格。輸出摺完後的尺寸和正面圖案。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行方格；下一行為折疊次數 `Q`；最後 `Q` 行各有一個方向字元 `U`、`D`、`L` 或 `R`。",
    limits: "- 1 ≤ `R, C` ≤ 32；1 ≤ `Q` ≤ 5\n- 每次上下折時，當下列數一定是偶數；每次左右折時，當下行數一定是偶數\n- 方格只含大寫字母與 `.`",
    output: "第一行輸出摺完後的 `R' C'`，接著輸出 `R'` 行、每行 `C'` 個字元的方格。",
    samples: [
      { input: "2 2\nA.\n.B\n1\nD", output: "1 2\nAB", note: "上半部蓋到下半部：左邊看到上層 A，右邊的上層是透明格，所以看到下層 B。" },
      { input: "2 2\nA.\n.B\n1\nL", output: "2 1\nA\nB", note: "右半部往左對折後，第一列的透明格露出 A，第二列的 B 覆蓋原本的空位。" },
    ],
    hidden: ["2 1\nA\nB\n1\nU", "1 2\nAB\n1\nR", "4 4\nABCD\nEFGH\nIJKL\nMNOP\n2\nD\nR", "4 4\n....\n.A..\n..B.\n....\n2\nU\nL", `32 32\n${randomGrid(32, 32, "ABC.").join("\n")}\n5\nU\nR\nD\nL\nD`],
    solve(text) {
      const all = lines(text);
      const { rows, grid } = parseGrid(all);
      let paper = grid;
      const q = Number(all[rows + 1]);
      for (let i = 0; i < q; i++) {
        const direction = all[rows + 2 + i];
        const h = paper.length, w = paper[0].length;
        if (direction === "D" || direction === "U") {
          const next = Array.from({ length: h / 2 }, (_, r) => {
            const base = direction === "D" ? paper[h / 2 + r] : paper[r];
            const top = direction === "D" ? paper[h / 2 - 1 - r] : paper[h - 1 - r];
            return base.map((char, c) => top[c] === "." ? char : top[c]);
          });
          paper = next;
        } else {
          paper = paper.map((row) => Array.from({ length: w / 2 }, (_, c) => {
            const base = direction === "R" ? row[w / 2 + c] : row[c];
            const top = direction === "R" ? row[w / 2 - 1 - c] : row[w - 1 - c];
            return top === "." ? base : top;
          }));
        }
      }
      return `${paper.length} ${paper[0].length}\n${paper.map((row) => row.join("")).join("\n")}`;
    },
  }),
  makeProblem({
    title: "多區印刷計分", difficulty: "hard", tags: ["陣列", "模擬"],
    description: [
      "印刷廠用一張 `R × C` 的格狀紙記錄每個位置的品質分數。開始時每格都是 0 分；接著一張張訂單進來，每張訂單指定一個矩形區域，讓矩形裡的**每一格**都增加相同的整數分數。有些訂單的分數是負數，代表印刷瑕疵造成扣分。",
      "矩形由左上角 `(r1, c1)` 和右下角 `(r2, c2)` 指定，兩端的列與行都包含在內。例如區域 `(1, 1)` 到 `(2, 2)` 包含四格；若這張訂單的分數是 `5`，那四格各加 5 分。多張訂單可以重疊，同一格被選中幾次，就把那些訂單的分數**全部累加**，不會用新分數覆蓋舊分數。",
      "等所有訂單處理完，請比較整張紙的每一格，找出最大的最終分數，以及恰好達到此分數的格子數。沒有被任何訂單選到的格子仍是 0，可能比被扣成負分的格子還高；若一張訂單都沒有，所有 `R × C` 格的分數都是 0。",
    ].join("\n\n"),
    input: "第一行 `R C Q`；接著 `Q` 行 `r1 c1 r2 c2 v`，座標從 1 開始，選取範圍包含兩端。",
    limits: "- 1 ≤ `R, C` ≤ 400；0 ≤ `Q` ≤ 20000\n- `1 ≤ r1 ≤ r2 ≤ R`、`1 ≤ c1 ≤ c2 ≤ C`；−100 ≤ `v` ≤ 100",
    output: "輸出一行 `最高分 格子數`。沒有訂單時，所有格子的分數仍是 0。",
    samples: [
      { input: "3 3 2\n1 1 2 2 5\n2 2 3 3 -2", output: "5 3", note: "左上角的 2×2 區域先各得 5 分，但其中 `(2, 2)` 又被扣 2 分；其餘三格仍是最高的 5 分。" },
      { input: "2 2 0", output: "0 4", note: "沒有訂單，四格的分數全是 0，最高分由四格並列。" },
    ],
    hidden: ["1 1 1\n1 1 1 1 -100", "2 2 2\n1 1 2 2 -3\n2 2 2 2 8", "3 4 3\n1 1 3 4 1\n1 1 1 1 2\n2 3 3 4 -5", (() => {
      const queries = Array.from({ length: 20000 }, () => {
        const a = 1 + rand(400), b = 1 + rand(400), c = 1 + rand(400), d = 1 + rand(400);
        return `${Math.min(a, b)} ${Math.min(c, d)} ${Math.max(a, b)} ${Math.max(c, d)} ${rand(201) - 100}`;
      });
      return `400 400 ${queries.length}\n${queries.join("\n")}`;
    })()],
    solve(text) {
      const all = lines(text);
      const [rows, cols, q] = all[0].split(" ").map(Number);
      const diff = Array.from({ length: rows + 2 }, () => new Int32Array(cols + 2));
      for (let i = 1; i <= q; i++) {
        const [a, b, y, x, v] = all[i].split(" ").map(Number);
        diff[a][b] += v;
        diff[y + 1][b] -= v;
        diff[a][x + 1] -= v;
        diff[y + 1][x + 1] += v;
      }
      let best = -Infinity, count = 0;
      for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) {
        diff[r][c] += diff[r - 1][c] + diff[r][c - 1] - diff[r - 1][c - 1];
        const value = diff[r][c];
        if (value > best) { best = value; count = 1; }
        else if (value === best) count++;
      }
      return `${best} ${count}`;
    },
  }),
  makeProblem({
    title: "最大片字塊", difficulty: "hard", tags: ["陣列", "字串", "動態規劃"],
    description: [
      "印刷廠要從字母海報上裁下一塊正方形，做成顏色一致的貼紙。海報上的每一格不是大寫字母，就是不能用的空位 `.`。要裁下的部分必須是沿格線的**實心正方形**，而且正方形裡每一格都必須是**同一個字母**；空位、其他字母或缺角都不行。",
      "廠長希望貼紙盡可能大，因此先比較正方形的邊長。如果找到好幾塊同樣大的正方形，先選字母順序最小的，例如 `A` 優先於 `B`；若字母也相同，選左上角**列號**較小的；仍相同時，再選左上角**行號**較小的。列號、行號都從左上角的 `(1, 1)` 起算。",
      "即使海報只剩零星的一格字母，也能裁出邊長 1 的貼紙。若整張海報完全沒有字母，則沒有可裁的正方形，請依題目指定的格式輸出 `0 - 0 0`。請輸出最後選中的邊長、字母和左上角座標。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行，每行恰有 `C` 個字元。",
    limits: "1 ≤ `R, C` ≤ 300；方格只包含大寫英文字母和 `.`。",
    output: "輸出一行 `邊長 字母 左上角列號 左上角行號`；沒有字母時輸出 `0 - 0 0`。",
    samples: [
      { input: "3 4\nAABB\nAABB\nCCBB", output: "2 A 1 1", note: "A 和 B 都有 2×2 正方形，選字母順序較小的 A。" },
      { input: "2 2\n..\n..", output: "0 - 0 0", note: "四格都是空位，連邊長 1 的字母正方形都不存在。" },
    ],
    hidden: ["1 1\nZ", "2 2\nAA\nAA", "3 3\nABA\nAAA\nABA", "4 4\nBBBB\nBBBB\nBBBB\nBBBB", gridInput(randomGrid(300, 300, "AAAAB."))],
    solve(text) {
      const { rows, cols, grid } = parseGrid(lines(text));
      const dp = Array.from({ length: rows + 1 }, () => new Int16Array(cols + 1));
      let best = [0, "-", 0, 0];
      for (let r = 1; r <= rows; r++) for (let c = 1; c <= cols; c++) {
        const char = grid[r - 1][c - 1];
        if (char === ".") continue;
        dp[r][c] = 1;
        if (r > 1 && c > 1 && grid[r - 2][c - 1] === char && grid[r - 1][c - 2] === char && grid[r - 2][c - 2] === char) {
          dp[r][c] += Math.min(dp[r - 1][c], dp[r][c - 1], dp[r - 1][c - 1]);
        }
        const size = dp[r][c], top = r - size + 1, left = c - size + 1;
        if (size > best[0] || (size === best[0] && (char < best[1] || (char === best[1] && (top < best[2] || (top === best[2] && left < best[3])))))) {
          best = [size, char, top, left];
        }
      }
      return best.join(" ");
    },
  }),
  makeProblem({
    title: "最短拼字路", difficulty: "hard", tags: ["陣列", "字串", "圖論"],
    description: [
      "未來的鍵盤不靠按鍵，而是讓一個小游標在字母方格上移動。鍵盤中每格寫著一個大寫字母，`#` 則是游標無法穿越的障礙。你要讓游標依照順序輸入指定的目標字串，同時盡可能少移動。",
      "一開始可以免費選擇**任意一格**寫著目標字串第一個字母的位置，並立即輸入這個首字。之後每次移動只可往上、下、左、右的一個相鄰格走一步，不能跨牆或走出鍵盤。抵達新格子時，若上面的字母恰好等於下一個**尚未輸入**的字母，就會自動輸入它；否則只是經過，先不輸入任何字。一次移動最多輸入一個字母。",
      "可以多次走進同一格，也可以為了繞過障礙走過暫時用不到的字母；但已經輸入的字母不能取消或改順序。計算步數時，只計起點之後的移動：如果目標只有一個字，找到起點就能用 0 步完成。請求出能完整輸入目標字串的最少步數；若沒有任何可行走法，就輸出 `-1`。",
    ].join("\n\n"),
    input: "第一行 `R C`，接著 `R` 行鍵盤；最後一行是目標字串 `s`。",
    limits: "- 1 ≤ `R, C` ≤ 20；1 ≤ `s` 長度 ≤ 30\n- 鍵盤只含大寫字母與 `#`；`s` 只含大寫字母",
    output: "輸出最少移動步數；若無法完成則輸出 `-1`。",
    samples: [
      { input: "2 3\nABC\nD#E\nACE", output: "3", note: "從 A 出發，經 B 路過，到 C 再到 E，共走 3 步。" },
      { input: "1 3\nA#B\nAB", output: "-1", note: "雖然鍵盤上有 A 和 B，但兩格被牆隔開，游標不能從 A 走到 B。" },
    ],
    hidden: ["1 1\nA\nA", "1 2\nAB\nABA", "2 2\nAB\nCD\nDAC", "2 2\n##\n##\nA", `20 20\n${randomGrid(20, 20, "ABC#").join("\n")}\nABCBACABCABACBCABCAB`],
    solve(text) {
      const all = lines(text);
      const { rows, cols, grid } = parseGrid(all);
      const target = all[rows + 1];
      const seen = new Set();
      const queue = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] === target[0]) {
          queue.push([r, c, 0, 0]);
          seen.add(`${r},${c},0`);
        }
      }
      for (let head = 0; head < queue.length; head++) {
        const [r, c, index, steps] = queue[head];
        if (index === target.length - 1) return String(steps);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const y = r + dr, x = c + dc;
          if (y < 0 || y >= rows || x < 0 || x >= cols || grid[y][x] === "#") continue;
          const next = index + Number(grid[y][x] === target[index + 1]);
          const state = `${y},${x},${next}`;
          if (seen.has(state)) continue;
          seen.add(state);
          queue.push([y, x, next, steps + 1]);
        }
      }
      return "-1";
    },
  }),
];
