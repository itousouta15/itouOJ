import type { ApcsLesson } from "@/lib/apcsCourseLessons";

export type ToiCourseTopic = {
  id: string;
  title: string;
  subtitle: string;
  focus: string[];
  codes: string[];
  lesson: ApcsLesson;
};

function lesson(
  code: string,
  concept: string,
  goal: string,
  explanation: string[],
  complexity: string,
  pitfall: string,
  sampleInput: string,
  sampleOutput: string,
  traceLabel: string,
  trace: ApcsLesson["trace"],
  cpp: string,
  python: string
): ApcsLesson {
  return { code, concept, goal, explanation, complexity, pitfall, sampleInput, sampleOutput, traceLabel, trace, cpp, python };
}

export const toiCourseTopics: ToiCourseTopic[] = [
  {
    id: "read-calculate",
    title: "讀題、輸入與基本計算",
    subtitle: "把敘述翻成變數、公式與輸出格式，先建立穩定的解題流程。",
    focus: ["輸入輸出", "公式換算", "整數除法與餘數"],
    codes: "a086 a094 a100 a105 a169 a197 a199 a214 a218 a232 a247 a263 a265 a267".split(" "),
    lesson: lesson("toi-read-calculate", "基本計算・單次掃描", "先把輸入資料轉成題目要求的量，再用明確公式算出答案。", [
      "將題意整理成「已知值 → 中間量 → 輸出值」。每個變數只代表一件事，單位先統一後再計算。",
      "遇到整除與餘數時，分別想清楚商與餘數代表什麼；比例需要無條件進位時，可用 (a + b - 1) / b 的整數寫法。",
    ], "時間 O(1) ・ 空間 O(1)", "注意整數除法會捨去小數，且輸出行數、順序和空白都要照格式。", "17 5", "3 2", "計算流程", [
      { title: "讀入並命名", description: "17 是總量，5 是每組容量；保留原始單位。", cells: ["total = 17", "size = 5"], active: [0, 1], variables: [["已知量", "17、5"]] },
      { title: "先算完整組數", description: "整數除法得到 3 組。", cells: ["17 / 5", "= 3"], active: [1], variables: [["groups", "3"]] },
      { title: "再算剩餘量", description: "餘數是 2，兩個答案來自同一次除法。", cells: ["17 % 5", "= 2"], active: [1], variables: [["remainder", "2"]] },
      { title: "依規格輸出", description: "先輸出組數，再輸出餘數。", cells: ["3", "2"], active: [0, 1], variables: [["答案", "3 2"]] },
    ],
    `#include <iostream>\nusing namespace std;\nint main() {\n    int total, size;\n    cin >> total >> size;\n    cout << total / size << ' ' << total % size << '\\n';\n}`,
    `total, size = map(int, input().split())\nprint(total // size, total % size)`),
  },
  {
    id: "conditions",
    title: "條件判斷與規則整理",
    subtitle: "優惠、級距、資格與多條規則：先排優先序，再處理邊界。",
    focus: ["if / else", "區間邊界", "規則優先序"],
    codes: "a092 a099 a104 a170 a171 a175 a183 a200 a239 a246 a255 a262".split(" "),
    lesson: lesson("toi-conditions", "條件判斷・邊界測試", "將每條規則改寫成互斥條件，按優先順序判斷。", [
      "把敘述中的門檻改成數學區間，例如「至少 10、未滿 20」就是 10 ≤ x < 20。條件由最特殊或最嚴格的情況開始檢查。",
      "若題目規定平手、同時符合多項或優先採用某一規則，必須明確放進 if/else 的順序，不要只比較最後數值。",
    ], "時間 O(1) ・ 空間 O(1)", "每個門檻都測試門檻值本身，以及它的前一個與後一個值；避免區間重疊或漏掉端點。", "19", "middle", "選擇級距", [
      { title: "先看最高門檻", description: "19 未達 20，因此不進入最高級距。", cells: ["x = 19", "x >= 20 ?"], active: [0, 1], variables: [["判斷", "否"]] },
      { title: "檢查下一級距", description: "19 落在 10 到 19，選擇 middle。", cells: ["10 ≤ x < 20", "middle"], active: [0, 1], variables: [["目前級距", "middle"]] },
      { title: "停止後續判斷", description: "使用 else-if，確保答案只會被指定一次。", cells: ["if / else if", "唯一結果"], active: [0, 1], variables: [["輸出", "middle"]] },
    ],
    `#include <iostream>\nusing namespace std;\nint main() {\n    int x; cin >> x;\n    if (x >= 20) cout << "high\\n";\n    else if (x >= 10) cout << "middle\\n";\n    else cout << "low\\n";\n}`,
    `x = int(input())\nif x >= 20:\n    print("high")\nelif x >= 10:\n    print("middle")\nelse:\n    print("low")`),
  },
  {
    id: "count-frequency",
    title: "計數、分類與統計",
    subtitle: "重複資料、票數、牌面、類別統計：設計計數器並一次掃描。",
    focus: ["頻率表", "分類桶", "最大值與平手"],
    codes: "a088 a090 a091 a095 a101 a173 a185 a189 a202 a205 a220 a240 a249 a259".split(" "),
    lesson: lesson("toi-count", "頻率統計・計數桶", "將每筆資料歸到對應類別，並維持各類別的累計次數。", [
      "如果類別數固定，用陣列當計數桶；類別是字串或範圍很大時，用 map/dictionary 對應次數。",
      "每次讀到一筆資料就立刻更新，不必重複掃描整份資料。最後依題目要求的順序輸出，平手規則要明確處理。",
    ], "時間 O(n + k) ・ 空間 O(k)", "不要把同一個人的重複選項重複計數；確認題目是計次數、計人數，還是每類只計一次。", "5\nA B A C A", "A: 3\nB: 1\nC: 1", "頻率桶", [
      { title: "建立計數表", description: "每個類別先從 0 開始。", cells: ["A: 0", "B: 0", "C: 0"], active: [], variables: [["counts", "[0, 0, 0]"]] },
      { title: "處理 A、B", description: "看到 A 就增加 A 的桶，看到 B 就增加 B。", cells: ["A: 1", "B: 1", "C: 0"], active: [0, 1], variables: [["已讀", "A B"]] },
      { title: "繼續更新", description: "後續 A 再出現兩次，只改動 A 的計數。", cells: ["A: 3", "B: 1", "C: 1"], active: [0, 2], variables: [["已讀", "A B A C A"]] },
      { title: "按規定輸出", description: "即使題目要求依字母順序，也不要依輸入順序猜測。", cells: ["A: 3", "B: 1", "C: 1"], active: [0, 1, 2], variables: [["答案", "3 類"]] },
    ],
    `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n;\n    vector<int> count(3, 0);\n    for (int i = 0; i < n; ++i) { char c; cin >> c; ++count[c - 'A']; }\n    for (int i = 0; i < 3; ++i) cout << char('A' + i) << ": " << count[i] << '\\n';\n}`,
    `n = int(input())\nitems = input().split()\ncounts = {"A": 0, "B": 0, "C": 0}\nfor item in items:\n    counts[item] += 1\nfor key in "ABC":\n    print(f"{key}: {counts[key]}")`),
  },
  {
    id: "text",
    title: "字串、字元與格式解析",
    subtitle: "逐字處理、大小寫、編碼轉換、分隔符與子字串。",
    focus: ["字元索引", "ASCII / 字母環繞", "切片與反轉"],
    codes: "a106 a174 a177 a179 a184 a201 a208 a212 a223 a234 a258 a264".split(" "),
    lesson: lesson("toi-text", "字串處理・逐字轉換", "逐字讀取並保留需要的字元，只改變題目指定的部分。", [
      "字串可視為一列字元。先判斷目前字元屬於哪一類，再套用轉換；其餘字元原樣保留。",
      "大小寫字母的環繞可用模數：((字元 - 起點 + 位移) % 26) + 起點。若輸入含空格，需使用整行讀取而不是只讀一個單字。",
    ], "時間 O(n) ・ 空間 O(n)", "處理字母環繞、大小寫敏感與空白時特別容易錯；不要意外丟掉字串中的標點或前導 0。", "Ab-z! 2", "Bc-a! 2", "字元轉換", [
      { title: "逐字讀取", description: "先保留非英文字元，只有字母才進行位移。", cells: ["A", "b", "-", "z", "!"], active: [0], variables: [["輸出前綴", ""]] },
      { title: "轉換大寫字母", description: "A 往後一格成為 B；範圍在 A 到 Z 環繞。", cells: ["B", "b", "-", "z", "!"], active: [0], variables: [["字元", "B"]] },
      { title: "轉換小寫字母", description: "z 再往後一格會回到 a。", cells: ["B", "c", "-", "a", "!"], active: [1, 3], variables: [["位移", "1"]] },
      { title: "保留其他字元", description: "符號與空格不屬於轉換範圍，原樣附加。", cells: ["Bc-a!"], active: [0], variables: [["結果", "Bc-a!"]] },
    ],
    `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    string s; getline(cin, s);\n    for (char &c : s) {\n        if (c >= 'A' && c <= 'Z') c = char('A' + (c - 'A' + 1) % 26);\n        else if (c >= 'a' && c <= 'z') c = char('a' + (c - 'a' + 1) % 26);\n    }\n    cout << s << '\\n';\n}`,
    `s = input()\nout = []\nfor c in s:\n    if "A" <= c <= "Z":\n        out.append(chr((ord(c) - ord("A") + 1) % 26 + ord("A")))\n    elif "a" <= c <= "z":\n        out.append(chr((ord(c) - ord("a") + 1) % 26 + ord("a")))\n    else:\n        out.append(c)\nprint("".join(out))`),
  },
  {
    id: "arrays",
    title: "陣列、排序與區間掃描",
    subtitle: "保留資料順序、建立索引、尋找極值，或排序後線性處理。",
    focus: ["陣列走訪", "排序", "索引與配對"],
    codes: "a098 a159 a162 a163 a164 a165 a176 a188 a191 a192 a203 a209 a213 a216 a235 a236 a242 a245 a252 a268".split(" "),
    lesson: lesson("toi-arrays", "陣列・排序後掃描", "把資料存在陣列中，必要時排序，再以一次掃描找出規則中的答案。", [
      "先判斷答案是否依賴原始順序。若需要穩定平手或位置資訊，保留原索引；若只看大小關係，可排序後處理。",
      "對一列資料維護目前最大、最小或累積狀態，常能把雙重比較化為一次掃描。多筆查詢時，可預先建索引或頻率表。",
    ], "時間 O(n log n)（排序） ・ 空間 O(n)", "排序會改變順序；題目若要求保留輸入順序或依原位置輸出，請把原索引一起存下來。", "5\n7 2 9 4 3", "2 3 4 7 9", "排序與掃描", [
      { title: "保存資料", description: "將所有值放進同一列，之後可排序或索引。", cells: ["7", "2", "9", "4", "3"], active: [], variables: [["n", "5"]] },
      { title: "排序", description: "將值由小到大排列，讓相鄰資料具有可用的順序。", cells: ["2", "3", "4", "7", "9"], active: [0, 1, 2, 3, 4], variables: [["順序", "遞增"]] },
      { title: "線性檢查", description: "從左到右掃描，更新題目需要的答案或相鄰關係。", cells: ["2", "3", "4", "7", "9"], active: [2], variables: [["目前值", "4"]] },
      { title: "依規則輸出", description: "輸出前確認是否要還原原索引或採用特定平手規則。", cells: ["答案"], active: [0], variables: [["複雜度", "O(n log n)"]] },
    ],
    `#include <algorithm>\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int n; cin >> n; vector<int> a(n);\n    for (int &x : a) cin >> x;\n    sort(a.begin(), a.end());\n    for (int i = 0; i < n; ++i) cout << a[i] << (i + 1 == n ? '\\n' : ' ');\n}`,
    `n = int(input())\na = list(map(int, input().split()))\na.sort()\nprint(*a)`),
  },
  {
    id: "grid",
    title: "二維陣列、座標與鄰居",
    subtitle: "表格搜尋、影像放大、方向移動、邊界與鄰格關係。",
    focus: ["列與欄", "座標邊界", "方向陣列"],
    codes: "a102 a103 a156 a158 a186 a193 a196 a210 a215 a227 a233 a244 a250 a253 a260".split(" "),
    lesson: lesson("toi-grid", "二維陣列・座標移動", "以 row、column 表示格子位置，逐格檢查或套用方向變化。", [
      "二維陣列通常用 a[row][col] 存取。確認題目座標從 0 還是 1 開始，以及輸入先列數還是欄數。",
      "檢查鄰居時先驗證新座標仍在範圍內。固定方向可用 dr/dc 陣列，避免重複寫八份條件。若是同步更新，讀舊表、寫新表。",
    ], "時間 O(RC) ・ 空間 O(RC)", "行列方向常被混淆；同步更新不能直接覆蓋原矩陣，否則後面的格子會讀到已更新的值。", "2 3\n1 2 3\n4 5 6", "從左上到右下掃描 6 格", "矩陣座標", [
      { title: "建立列與欄", description: "位置以 (row, col) 表示，左上角是 (0, 0)。", cells: ["(0,0)", "(0,1)", "(0,2)", "(1,0)", "(1,1)", "(1,2)"], active: [], variables: [["R", "2"], ["C", "3"]] },
      { title: "逐格走訪", description: "外層迴圈控制列，內層迴圈控制欄。", cells: ["1", "2", "3", "4", "5", "6"], active: [0, 1, 2], variables: [["目前座標", "row = 0"]] },
      { title: "檢查邊界", description: "向右一格時，只有 col + 1 < C 才能存取。", cells: ["1", "2", "3", "4", "5", "6"], active: [2], variables: [["右鄰居", "不存在"]] },
      { title: "完成第二列", description: "列索引變為 1，再依序處理各欄。", cells: ["1", "2", "3", "4", "5", "6"], active: [3, 4, 5], variables: [["已處理", "6 格"]] },
    ],
    `#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    int r, c; cin >> r >> c;\n    vector<vector<int>> a(r, vector<int>(c));\n    for (auto &row : a) for (int &x : row) cin >> x;\n    for (int i = 0; i < r; ++i) for (int j = 0; j < c; ++j)\n        cout << a[i][j] << (j + 1 == c ? '\\n' : ' ');\n}`,
    `r, c = map(int, input().split())\na = [list(map(int, input().split())) for _ in range(r)]\nfor row in a:\n    print(*row)`),
  },
  {
    id: "simulation",
    title: "流程模擬、時間與狀態更新",
    subtitle: "依照事件順序更新狀態；適用排隊、移動、日程、遊戲規則。",
    focus: ["狀態變數", "事件順序", "時間與週期"],
    codes: "a096 a157 a160 a166 a168 a172 a178 a180 a181 a182 a187 a194 a195 a204 a206 a211 a217 a219 a221 a224 a225 a226 a230 a231 a237 a238 a243 a251 a266".split(" "),
    lesson: lesson("toi-simulation", "逐步模擬・狀態轉移", "明確定義目前狀態，再依每個事件的先後順序更新。", [
      "把題目中的角色、位置、時間、剩餘資源寫成狀態變數。每個事件只依當下狀態計算下一個狀態。",
      "逐字逐句確認同一回合內的操作先後；若一輪包含「先恢復、再移動、最後判定」，程式也必須保持該順序。",
    ], "時間 O(事件數) ・ 空間 O(1)（不含輸入）", "不要用更新後的狀態重算本回合原本應同時判定的項目；必要時複製一份 old state。", "5\n+2 -1 +3 -2 +1", "3", "狀態變化", [
      { title: "設定初始狀態", description: "開始前明確記錄目前位置或累積量。", cells: ["+2", "-1", "+3", "-2", "+1"], active: [], variables: [["state", "0"]] },
      { title: "處理事件 1", description: "讀取 +2，依規則更新狀態。", cells: ["+2", "-1", "+3", "-2", "+1"], active: [0], variables: [["state", "2"]] },
      { title: "處理事件 2、3", description: "每次更新都從上一個事件的結果繼續。", cells: ["+2", "-1", "+3", "-2", "+1"], active: [1, 2], variables: [["state", "4"]] },
      { title: "處理完所有事件", description: "停止條件與最後輸出要分開檢查。", cells: ["+2", "-1", "+3", "-2", "+1"], active: [3, 4], variables: [["state", "3"]] },
    ],
    `#include <iostream>\nusing namespace std;\nint main() {\n    int n, state = 0; cin >> n;\n    for (int i = 0; i < n; ++i) { int change; cin >> change; state += change; }\n    cout << state << '\\n';\n}`,
    `n = int(input())\nchanges = list(map(int, input().split()))\nstate = 0\nfor change in changes[:n]:\n    state += change\nprint(state)`),
  },
  {
    id: "number-theory",
    title: "數論、質數與因數",
    subtitle: "枚舉候選、整除判斷、因數個數與數字性質。",
    focus: ["% 整除判斷", "平方根界線", "複雜度估算"],
    codes: "a097 a190 a198 a207 a222 a254 a261".split(" "),
    lesson: lesson("toi-number-theory", "枚舉因數・平方根界線", "檢查整除性時，善用因數成對出現，把不必要的搜尋範圍縮小。", [
      "若 d 是 n 的因數，n / d 也是因數；至少一個不大於 √n。因此判斷質數或列舉因數時，通常只需走訪到平方根。",
      "注意 1 不是質數，且因數計數時平方根若為整數只計一次。範圍查詢可逐一枚舉，並估算總運算次數。",
    ], "判斷質數 O(√n) ・ 空間 O(1)", "迴圈條件使用 d * d <= n 時可能溢位；較大範圍可改成 d <= n / d。", "36", "6", "因數成對", [
      { title: "從 1 開始檢查", description: "1 × 36 是一組因數。", cells: ["1", "36"], active: [0, 1], variables: [["pairs", "1 組"]] },
      { title: "找到 2 × 18", description: "2 整除 36，另一個因數是 18。", cells: ["2", "18"], active: [0, 1], variables: [["pairs", "2 組"]] },
      { title: "到平方根為止", description: "只需檢查到 6；之後的因數已成對出現。", cells: ["3", "12", "4", "9", "6"], active: [0, 1, 2, 3, 4], variables: [["√36", "6"]] },
      { title: "處理平方根", description: "6 × 6 是同一個因數，不可重複計數。", cells: ["1, 2, 3, 4, 6, 9, 12, 18, 36"], active: [0], variables: [["因數個數", "9"]] },
    ],
    `#include <iostream>\nusing namespace std;\nint main() {\n    long long n; cin >> n; int count = 0;\n    for (long long d = 1; d <= n / d; ++d) {\n        if (n % d == 0) count += (d == n / d ? 1 : 2);\n    }\n    cout << count << '\\n';\n}`,
    `n = int(input())\ncount = 0\nd = 1\nwhile d <= n // d:\n    if n % d == 0:\n        count += 1 if d == n // d else 2\n    d += 1\nprint(count)`),
  },
  {
    id: "search-optimization",
    title: "搜尋、貪心與進階解題",
    subtitle: "從暴力枚舉開始估算，再利用排序、剪枝、圖搜尋或狀態轉移。",
    focus: ["搜尋空間", "貪心選擇", "BFS / DP 入門"],
    codes: "a087 a089 a093 a107 a161 a167 a228 a229 a241 a248 a256 a257".split(" "),
    lesson: lesson("toi-search-optimization", "先定義狀態・再選搜尋法", "把每一個可行候選描述成狀態，按題目限制選擇掃描、搜尋或動態規劃。", [
      "先用限制估計暴力解的規模。如果每種狀態都可逐一嘗試，就以清楚正確的枚舉作基準，再尋找重複計算或可剪枝處。",
      "無權圖最短步數通常用 BFS；連通區塊用 DFS/BFS；若決策有重疊子問題，定義 dp 狀態與轉移。貪心則必須說明局部選擇為何安全。",
    ], "依方法而異：掃描 O(n)、排序 O(n log n)、圖搜尋 O(V + E)", "不要只因為小範例看起來可行就使用暴力；用最大限制計算迴圈次數與記憶體。", "4 4\n1 2\n2 3\n3 4\n1 4", "所有 4 個點連通", "圖搜尋佇列", [
      { title: "從起點開始", description: "標記起點已造訪並放入佇列。", cells: ["1", "2", "3", "4"], active: [0], variables: [["queue", "[1]"]] },
      { title: "探索相鄰點", description: "取出 1，將尚未造訪的鄰點加入佇列。", cells: ["1", "2", "3", "4"], active: [0, 1, 3], variables: [["queue", "[2, 4]"]] },
      { title: "繼續擴展", description: "由 2 或 4 繼續探索，已造訪的點不重複加入。", cells: ["1", "2", "3", "4"], active: [1, 2, 3], variables: [["visited", "1, 2, 3, 4"]] },
      { title: "搜尋結束", description: "佇列清空時，這個連通區塊已完整探索。", cells: ["1", "2", "3", "4"], active: [0, 1, 2, 3], variables: [["連通點數", "4"]] },
    ],
    `#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\nint main() {\n    int n, m; cin >> n >> m; vector<vector<int>> g(n);\n    while (m--) { int u, v; cin >> u >> v; --u; --v; g[u].push_back(v); g[v].push_back(u); }\n    vector<bool> seen(n); queue<int> q; q.push(0); seen[0] = true; int count = 0;\n    while (!q.empty()) { int u = q.front(); q.pop(); ++count; for (int v : g[u]) if (!seen[v]) { seen[v] = true; q.push(v); } }\n    cout << count << '\\n';\n}`,
    `from collections import deque\nn, m = map(int, input().split())\ng = [[] for _ in range(n)]\nfor _ in range(m):\n    u, v = map(int, input().split())\n    u -= 1; v -= 1\n    g[u].append(v); g[v].append(u)\nseen = [False] * n\nq = deque([0]); seen[0] = True\ncount = 0\nwhile q:\n    u = q.popleft(); count += 1\n    for v in g[u]:\n        if not seen[v]:\n            seen[v] = True; q.append(v)\nprint(count)`),
  },
];

const topicByCode = new Map<string, ToiCourseTopic>();
for (const topic of toiCourseTopics) {
  for (const code of topic.codes) topicByCode.set(code, topic);
}

export function getToiTopicForProblem(problemCode: string | null | undefined) {
  return problemCode ? topicByCode.get(problemCode) : undefined;
}

export function getToiTopic(problemCode: string | null | undefined) {
  return getToiTopicForProblem(problemCode) ?? toiCourseTopics[8];
}
