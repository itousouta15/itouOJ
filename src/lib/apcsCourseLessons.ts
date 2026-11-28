export type TraceStep = {
  title: string;
  description: string;
  cells: string[];
  active?: number[];
  variables: [string, string][];
};

export type ApcsLesson = {
  code: string;
  concept: string;
  goal: string;
  explanation: string[];
  complexity: string;
  pitfall: string;
  sampleInput: string;
  sampleOutput: string;
  traceLabel: string;
  trace: TraceStep[];
  cpp: string;
  python: string;
};

export const apcsCourseLessons: Record<string, ApcsLesson> = {
  a006: {
    code: "a006",
    concept: "條件判斷・維持目前最佳值",
    goal: "一次掃過三個數字，每讀到一個就更新目前最大值。",
    explanation: [
      "先把第一個數字當作目前最大值，再依序比較第二、第三個。這種「保存目前最佳答案」的做法，比把所有情況都列出來更容易擴充。",
      "比較時使用大於即可；若數字相同，最大值不變。負數也能正常處理，因為初始值取自輸入，而不是 0。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall: "不要把最大值預設為 0，否則三個輸入都是負數時會答錯。",
    sampleInput: "3 7 5",
    sampleOutput: "7",
    traceLabel: "目前最大值",
    trace: [
      { title: "讀入三個數", description: "公開範例依序是 3、7、5。先以第一個數建立答案。", cells: ["3", "7", "5"], active: [0], variables: [["best", "3"], ["下一個", "7"]] },
      { title: "比較第二個數", description: "7 大於 best，更新 best 為 7。", cells: ["3", "7", "5"], active: [1], variables: [["best", "7"], ["比較", "7 > 3？是"]] },
      { title: "比較第三個數", description: "5 沒有大於 best，因此答案保持 7。", cells: ["3", "7", "5"], active: [2], variables: [["best", "7"], ["比較", "5 > 7？否"]] },
      { title: "輸出答案", description: "所有數字都比較過了，best 就是最大值。", cells: ["3", "7", "5"], active: [1], variables: [["best", "7"], ["輸出", "7"]] },
    ],
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b, c;\n    cin >> a >> b >> c;\n\n    long long best = a;\n    if (b > best) best = b;\n    if (c > best) best = c;\n\n    cout << best << '\\n';\n    return 0;\n}`,
    python: `a, b, c = map(int, input().split())\n\nbest = a\nif b > best:\n    best = b\nif c > best:\n    best = c\n\nprint(best)`,
  },
  a007: {
    code: "a007",
    concept: "比較單價・交叉相乘",
    goal: "不直接算小數單價，改用交叉相乘比較每公升價格。",
    explanation: [
      "A 杯單價是 priceA / volumeA，B 杯單價是 priceB / volumeB。若直接除法會遇到小數精度問題。",
      "容量與價格皆為正數，所以 A 比較便宜等價於 priceA × volumeB < priceB × volumeA。題面給定的 0.75 與 1.2 可同乘 100 成為整數 75 與 120，再用整數比較。",
      "題頁只有固定的兩杯資料與一組輸入範例，沒有另外列出一般輸入範圍。以下依範例讀取四個數值；乘 100 轉整數只適用於題面這組資料，或容量至多兩位小數的延伸情況，不能據此宣稱能處理任意精度的小數。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall: "比較前先確認容量單位一致；不要用二進位浮點數直接比較兩個小數單價。",
    sampleInput: "0.75 42 1.2 65",
    sampleOutput: "B",
    traceLabel: "交叉乘積",
    trace: [
      { title: "讀入容量與價格", description: "A 是 0.75 公升 42 元；B 是 1.2 公升 65 元。", cells: ["A: 0.75L", "42 元", "B: 1.2L", "65 元"], active: [0, 1, 2, 3], variables: [["va", "75（百分之一公升）"], ["vb", "120"]] },
      { title: "計算交叉乘積", description: "比較 42 × 120 與 65 × 75，不必真的除出每公升價格。", cells: ["42 × 120", "= 5040", "65 × 75", "= 4875"], active: [1, 3], variables: [["A × vb", "5040"], ["B × va", "4875"]] },
      { title: "判斷較小的一側", description: "5040 > 4875，所以 A 的每公升價格較高，B 比較划算。", cells: ["5040", ">", "4875", "輸出 B"], active: [0, 2, 3], variables: [["答案", "B"]] },
    ],
    cpp: `#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    double volumeA, volumeB;\n    long long priceA, priceB;\n    cin >> volumeA >> priceA >> volumeB >> priceB;\n\n    long long a = llround(volumeA * 100);\n    long long b = llround(volumeB * 100);\n    long long left = priceA * b;\n    long long right = priceB * a;\n\n    if (left < right) cout << "A\\n";\n    else if (left > right) cout << "B\\n";\n    else cout << "Same\\n";\n}`,
    python: `from decimal import Decimal\n\nva, pa, vb, pb = input().split()\n# 把公升換成百分之一公升的整數，避免直接比較浮點數\na = int(Decimal(va) * 100)\nb = int(Decimal(vb) * 100)\nleft = int(pa) * b\nright = int(pb) * a\n\nif left < right:\n    print("A")\nelif left > right:\n    print("B")\nelse:\n    print("Same")`,
  },
  a010: {
    code: "a010",
    concept: "迴圈・兩個累積器",
    goal: "用一次迴圈同時累加總和與累乘總乘積。",
    explanation: [
      "從 1 到 n 逐一處理每個整數。sum 每次加上 i；product 每次乘上 i。兩個變數是不同的累積器，各自保存一種答案。",
      "乘積的初始值必須是 1，因為 1 是乘法的單位元素；若從 0 開始，之後乘再多次仍然是 0。",
    ],
    complexity: "時間 O(n) ・ 額外空間 O(1)",
    pitfall: "sum 從 0 開始、product 從 1 開始；混淆兩個初始值是常見錯誤。",
    sampleInput: "5",
    sampleOutput: "15\n120",
    traceLabel: "sum / product",
    trace: [
      { title: "初始化", description: "sum 是加法累積器，product 是乘法累積器。", cells: ["1", "2", "3", "4", "5"], active: [], variables: [["sum", "0"], ["product", "1"]] },
      { title: "處理 i = 1、2", description: "每回合執行 sum += i 與 product *= i。", cells: ["1", "2", "3", "4", "5"], active: [0, 1], variables: [["sum", "3"], ["product", "2"]] },
      { title: "處理 i = 3、4", description: "累加器延續上一回合的值，不會重新歸零。", cells: ["1", "2", "3", "4", "5"], active: [2, 3], variables: [["sum", "10"], ["product", "24"]] },
      { title: "處理 i = 5", description: "最後一回合後，輸出兩個累積器。", cells: ["1", "2", "3", "4", "5"], active: [4], variables: [["sum", "15"], ["product", "120"]] },
    ],
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n\n    long long sum = 0;\n    long long product = 1;\n    for (int i = 1; i <= n; ++i) {\n        sum += i;\n        product *= i;\n    }\n\n    cout << sum << '\\n' << product << '\\n';\n}`,
    python: `n = int(input())\n\nsum_value = 0\nproduct = 1\nfor i in range(1, n + 1):\n    sum_value += i\n    product *= i\n\nprint(sum_value)\nprint(product)`,
  },
  a019: {
    code: "a019",
    concept: "字串・滑動比對",
    goal: "把短字串 t 對齊在長字串 s 的每個可能起點，逐字確認。",
    explanation: [
      "長度為 n 的字串中，長度 m 的連續片段最多有 n - m + 1 個起點。每次從一個起點開始，逐字比對 t。",
      "只要某個起點的所有字元都相同，就找到子字串；掃過所有起點都失敗才輸出 No。若 t 比 s 長，答案一定是 No。",
    ],
    complexity: "時間 O(|s| × |t|) ・ 比對額外空間 O(1)，輸入字串 O(|s|+|t|)",
    pitfall: "起點最多到 |s| - |t|，不能讓 t 的最後一個字元超出 s 的範圍。",
    sampleInput: "programming\ngram",
    sampleOutput: "Yes",
    traceLabel: "逐格比對",
    trace: [
      { title: "從起點 0 開始", description: "把 gram 對齊 programming 的開頭，第一字 p 不等於 g。", cells: ["p", "r", "o", "g", "r", "a", "m", "m", "i", "n", "g"], active: [0], variables: [["起點", "0"], ["比對", "p ≠ g"]] },
      { title: "移到起點 1", description: "從 r 開始也不符合，移動起點再試。", cells: ["p", "r", "o", "g", "r", "a", "m", "m", "i", "n", "g"], active: [1], variables: [["起點", "1"], ["比對", "r ≠ g"]] },
      { title: "找到候選片段", description: "起點 3 開始依序是 g、r、a、m，與 t 完全相同。", cells: ["p", "r", "o", "g", "r", "a", "m", "m", "i", "n", "g"], active: [3, 4, 5, 6], variables: [["起點", "3"], ["比對", "gram = gram"]] },
      { title: "完成搜尋", description: "至少一個起點匹配成功，輸出 Yes。", cells: ["p", "r", "o", "g", "r", "a", "m", "m", "i", "n", "g"], active: [3, 4, 5, 6], variables: [["found", "true"], ["輸出", "Yes"]] },
    ],
    cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s, t;\n    cin >> s >> t;\n\n    bool found = false;\n    for (int start = 0; start + (int)t.size() <= (int)s.size(); ++start) {\n        bool match = true;\n        for (int j = 0; j < (int)t.size(); ++j) {\n            if (s[start + j] != t[j]) {\n                match = false;\n                break;\n            }\n        }\n        if (match) found = true;\n    }\n\n    cout << (found ? "Yes" : "No") << '\\n';\n}`,
    python: `s = input().strip()\nt = input().strip()\n\nfound = False\nfor start in range(len(s) - len(t) + 1):\n    match = True\n    for j in range(len(t)):\n        if s[start + j] != t[j]:\n            match = False\n            break\n    if match:\n        found = True\n\nprint("Yes" if found else "No")`,
  },
  a023: {
    code: "a023",
    concept: "陣列・分桶統計",
    goal: "把每個分數映射到 A、B、C、D、F 五個桶，再輸出各桶數量。",
    explanation: [
      "五種等第的門檻固定，因此不需要排序。每讀到一個分數，用 if / else if 找到對應等第，將該桶加一。",
      "所有成績處理完後，依指定順序輸出五個計數。就算某一級距沒有人，也要輸出 0。",
    ],
    complexity: "時間 O(n)；C++ 串流計數空間 O(1)，Python 保存分數需 O(n)",
    pitfall: "條件要由高分往低分檢查，且 90、80、70、60 的邊界要各測一次。",
    sampleInput: "6\n95 82 76 60 45 100",
    sampleOutput: "A: 2\nB: 1\nC: 1\nD: 1\nF: 1",
    traceLabel: "等第計數桶",
    trace: [
      { title: "建立五個桶", description: "每個等第一個計數器，起始都為 0。", cells: ["A", "B", "C", "D", "F"], active: [], variables: [["計數", "0, 0, 0, 0, 0"]] },
      { title: "讀到 95、82、76", description: "依分數門檻分別放入 A、B、C。", cells: ["A", "B", "C", "D", "F"], active: [0, 1, 2], variables: [["已處理", "95, 82, 76"], ["計數", "1, 1, 1, 0, 0"]] },
      { title: "讀到 60、45、100", description: "60 屬於 D，45 屬於 F，100 屬於 A。", cells: ["A", "B", "C", "D", "F"], active: [0, 3, 4], variables: [["已處理", "60, 45, 100"], ["計數", "2, 1, 1, 1, 1"]] },
      { title: "依順序輸出", description: "五個桶都要列出，包含計數為 0 的級距。", cells: ["A: 2", "B: 1", "C: 1", "D: 1", "F: 1"], active: [0, 1, 2, 3, 4], variables: [["總人數", "6"], ["輸出行數", "5"]] },
    ],
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    int countA = 0, countB = 0, countC = 0, countD = 0, countF = 0;\n\n    for (int i = 0; i < n; ++i) {\n        int score;\n        cin >> score;\n        if (score >= 90) ++countA;\n        else if (score >= 80) ++countB;\n        else if (score >= 70) ++countC;\n        else if (score >= 60) ++countD;\n        else ++countF;\n    }\n\n    cout << "A: " << countA << '\\n' << "B: " << countB << '\\n'\n         << "C: " << countC << '\\n' << "D: " << countD << '\\n'\n         << "F: " << countF << '\\n';\n}`,
    python: `n = int(input())\nscores = list(map(int, input().split()))\ncounts = [0, 0, 0, 0, 0]  # A, B, C, D, F\n\nfor score in scores[:n]:\n    if score >= 90:\n        counts[0] += 1\n    elif score >= 80:\n        counts[1] += 1\n    elif score >= 70:\n        counts[2] += 1\n    elif score >= 60:\n        counts[3] += 1\n    else:\n        counts[4] += 1\n\nfor grade, count in zip("ABCDF", counts):\n    print(f"{grade}: {count}")`,
  },
  a026: {
    code: "a026",
    concept: "陣列・鄰居比較與邊界",
    goal: "檢查每個位置是否嚴格大於存在的左右鄰居。",
    explanation: [
      "中間位置要同時大於左邊與右邊；第一個位置只跟右鄰居比，最後一個位置只跟左鄰居比。",
      "用一個迴圈走訪陣列，先處理左右是否存在，再進行比較。嚴格大於代表相等的平台不算峰值。",
    ],
    complexity: "時間 O(n) ・ 額外空間 O(1)",
    pitfall: "n = 1 時左右鄰居條件都不存在，依題目規則會算作峰值；相等則不算峰。",
    sampleInput: "5\n1 3 2 4 1",
    sampleOutput: "2",
    traceLabel: "峰值檢查",
    trace: [
      { title: "陣列與候選位置", description: "每個 index 只檢查一次，兩端少一個鄰居。", cells: ["1", "3", "2", "4", "1"], active: [], variables: [["peaks", "0"]] },
      { title: "檢查 index 1", description: "3 同時大於左邊 1 與右邊 2，是峰值。", cells: ["1", "3", "2", "4", "1"], active: [1], variables: [["比較", "3 > 1 且 3 > 2"], ["peaks", "1"]] },
      { title: "檢查 index 3", description: "4 同時大於左邊 2 與右邊 1，也是峰值。", cells: ["1", "3", "2", "4", "1"], active: [3], variables: [["比較", "4 > 2 且 4 > 1"], ["peaks", "2"]] },
      { title: "檢查邊界並輸出", description: "兩端依各自唯一鄰居比較；此例都不是峰值。", cells: ["1", "3", "2", "4", "1"], active: [0, 4], variables: [["peaks", "2"], ["輸出", "2"]] },
    ],
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int &x : a) cin >> x;\n\n    int peaks = 0;\n    for (int i = 0; i < n; ++i) {\n        bool higherThanNeighbors = true;\n        if (i > 0 && a[i] <= a[i - 1]) higherThanNeighbors = false;\n        if (i + 1 < n && a[i] <= a[i + 1]) higherThanNeighbors = false;\n        if (higherThanNeighbors) ++peaks;\n    }\n\n    cout << peaks << '\\n';\n}`,
    python: `n = int(input())\na = list(map(int, input().split()))\npeaks = 0\n\nfor i in range(n):\n    higher = True\n    if i > 0 and a[i] <= a[i - 1]:\n        higher = False\n    if i + 1 < n and a[i] <= a[i + 1]:\n        higher = False\n    if higher:\n        peaks += 1\n\nprint(peaks)`,
  },
  a029: {
    code: "a029",
    concept: "動態規劃・0/1 背包",
    goal: "dp[c] 表示容量不超過 c 時能取得的最大價值。",
    explanation: [
      "對每件物品，容量 c 有兩種選擇：不拿，維持 dp[c]；或拿，得到 dp[c - weight] + value。取兩者較大。",
      "容量必須由大到小更新，確保這一件物品不會在同一輪被重複使用。這就是 0/1 背包的一維寫法。",
    ],
    complexity: "時間 O(NW) ・ 空間 O(W)",
    pitfall: "若容量由小到大更新，同一件物品可能被拿很多次，會變成完全背包。",
    sampleInput: "3 10\n5 60\n4 40\n6 70",
    sampleOutput: "110",
    traceLabel: "dp[容量]",
    trace: [
      { title: "初始狀態", description: "公開範例容量為 10；每格依序表示容量 0 到 10 的最佳價值，初始全為 0。", cells: ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"], active: [], variables: [["容量範圍", "0..10"], ["dp[10]", "0"]] },
      { title: "處理物品 (重量 5、價值 60)", description: "容量由 10 往 5 更新，每個可容納的位置都只能拿這件一次。", cells: ["0", "0", "0", "0", "0", "60", "60", "60", "60", "60", "60"], active: [5, 6, 7, 8, 9, 10], variables: [["item", "(5, 60)"], ["dp[10]", "60"]] },
      { title: "處理物品 (重量 4、價值 40)", description: "容量 9、10 可同時容納前兩件；dp[10]=max(60,dp[6]+40)=100。", cells: ["0", "0", "0", "0", "40", "60", "60", "60", "60", "100", "100"], active: [4, 9, 10], variables: [["item", "(4, 40)"], ["dp[10]", "100"]] },
      { title: "處理物品 (重量 6、價值 70)", description: "容量 10 可選重量 4 與 6 的物品，價值 40+70=110；不能再加重量 5 的物品。", cells: ["0", "0", "0", "0", "40", "60", "70", "70", "70", "100", "110"], active: [6, 7, 8, 10], variables: [["item", "(6, 70)"], ["最佳價值", "110"]] },
    ],
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n, W;\n    cin >> n >> W;\n    vector<long long> dp(W + 1, 0);\n\n    for (int i = 0; i < n; ++i) {\n        int weight;\n        long long value;\n        cin >> weight >> value;\n        for (int cap = W; cap >= weight; --cap) {\n            dp[cap] = max(dp[cap], dp[cap - weight] + value);\n        }\n    }\n\n    cout << dp[W] << '\\n';\n}`,
    python: `n, capacity = map(int, input().split())\ndp = [0] * (capacity + 1)\n\nfor _ in range(n):\n    weight, value = map(int, input().split())\n    # 倒著更新：同一件物品只能使用一次\n    for cap in range(capacity, weight - 1, -1):\n        dp[cap] = max(dp[cap], dp[cap - weight] + value)\n\nprint(dp[capacity])`,
  },
  a030: {
    code: "a030",
    concept: "圖論・Dijkstra 最短路徑",
    goal: "用優先佇列每次擴展目前距離最短的節點。",
    explanation: [
      "把每條無向邊存進兩端的鄰接串列。dist[v] 是目前找到從 1 到 v 的最短距離，起點距離設為 0，其餘設為無限大。",
      "取出距離最小的節點 u，嘗試用 dist[u] + w 放寬每個鄰居。若佇列項目已不是最新距離，就略過；所有權重皆為正，適用 Dijkstra。",
    ],
    complexity: "時間 O(N+M log(M+2)) ・ 空間 O(N+M)；允許重邊，惰性優先佇列可有 O(M) 筆紀錄",
    pitfall: "距離可能超過 32 位元；C++ 用 long long。無向圖要把每條邊加入兩個方向。",
    sampleInput: "4 4\n1 2 5\n2 4 4\n1 3 2\n3 4 9",
    sampleOutput: "9",
    traceLabel: "各節點 dist",
    trace: [
      { title: "從節點 1 出發", description: "dist[1] = 0，其餘未知；佇列先放 (0, 1)。", cells: ["1: 0", "2: ∞", "3: ∞", "4: ∞"], active: [0], variables: [["優先佇列", "(0, 1)"]] },
      { title: "鬆弛節點 1 的邊", description: "到 2 的距離是 5，到 3 是 2。", cells: ["1: 0", "2: 5", "3: 2", "4: ∞"], active: [1, 2], variables: [["佇列", "(2,3), (5,2)"]] },
      { title: "先取距離 2 的節點 3", description: "由 3 到 4 還要 9，得到候選距離 11。", cells: ["1: 0", "2: 5", "3: 2", "4: 11"], active: [2, 3], variables: [["候選 dist[4]", "2 + 9 = 11"]] },
      { title: "再走 1 → 2 → 4", description: "節點 2 的距離是 5，再走 4 得到 9，比 11 更短。", cells: ["1: 0", "2: 5", "3: 2", "4: 9"], active: [1, 3], variables: [["候選 dist[4]", "5 + 4 = 9"], ["答案", "9"]] },
    ],
    cpp: `#include <iostream>\n#include <vector>\n#include <queue>\n#include <utility>\n#include <functional>\nusing namespace std;\nusing ll = long long;\n\nint main() {\n    int n, m;\n    cin >> n >> m;\n    vector<vector<pair<int, ll>>> graph(n + 1);\n    for (int i = 0; i < m; ++i) {\n        int u, v; ll w;\n        cin >> u >> v >> w;\n        graph[u].push_back({v, w});\n        graph[v].push_back({u, w});\n    }\n\n    const ll INF = (1LL << 62);\n    vector<ll> dist(n + 1, INF);\n    priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<pair<ll, int>>> pq;\n    dist[1] = 0;\n    pq.push({0, 1});\n\n    while (!pq.empty()) {\n        auto [d, u] = pq.top(); pq.pop();\n        if (d != dist[u]) continue;\n        for (auto [v, w] : graph[u]) {\n            if (d + w < dist[v]) {\n                dist[v] = d + w;\n                pq.push({dist[v], v});\n            }\n        }\n    }\n    cout << (dist[n] == INF ? -1 : dist[n]) << '\\n';\n}`,
    python: `import heapq\n\nn, m = map(int, input().split())\ngraph = [[] for _ in range(n + 1)]\nfor _ in range(m):\n    u, v, w = map(int, input().split())\n    graph[u].append((v, w))\n    graph[v].append((u, w))\n\nINF = 10**30\ndist = [INF] * (n + 1)\ndist[1] = 0\npq = [(0, 1)]\nwhile pq:\n    d, u = heapq.heappop(pq)\n    if d != dist[u]:\n        continue\n    for v, w in graph[u]:\n        if d + w < dist[v]:\n            dist[v] = d + w\n            heapq.heappush(pq, (dist[v], v))\n\nprint(-1 if dist[n] == INF else dist[n])`,
  },
  a031: {
    code: "a031",
    concept: "動態規劃・最長遞增子序列",
    goal: "用 tails[k] 保存長度 k+1 的遞增子序列所能達到的最小結尾。",
    explanation: [
      "依序讀每個數 x，在 tails 中找到第一個大於或等於 x 的位置，並用 x 取代它。若找不到，就把 x 加到尾端。",
      "tails 本身不一定是一條原序列中的子序列，但它的長度始終等於目前找到的最長嚴格遞增子序列長度。用 lower_bound 維持有序，能把每筆更新降到 O(log n)。",
    ],
    complexity: "時間 O(n log n) ・ 空間 O(n)",
    pitfall: "嚴格遞增要找第一個 >= x 的位置（lower_bound）；若允許相等才用 upper_bound。",
    sampleInput: "8\n10 9 2 5 3 7 101 18",
    sampleOutput: "4",
    traceLabel: "tails 狀態",
    trace: [
      { title: "讀入 10、9、2", description: "10 建立長度 1；9、2 都取代第一格，讓長度 1 的結尾更小。", cells: ["2"], active: [0], variables: [["目前 x", "2"], ["LIS 長度", "1"]] },
      { title: "讀入 5、3", description: "5 加在 2 後面；3 取代尾端，保留同長度但較有利的結尾。", cells: ["2", "3"], active: [1], variables: [["目前 x", "3"], ["LIS 長度", "2"]] },
      { title: "讀入 7、101", description: "7 延長序列，101 再延長一次。", cells: ["2", "3", "7", "101"], active: [2, 3], variables: [["目前 x", "101"], ["LIS 長度", "4"]] },
      { title: "讀入 18", description: "18 取代 101，長度仍是 4；最長長度就是 tails 的大小。", cells: ["2", "3", "7", "18"], active: [3], variables: [["tails", "[2, 3, 7, 18]"], ["輸出", "4"]] },
    ],
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> tails;\n    for (int i = 0; i < n; ++i) {\n        int x;\n        cin >> x;\n        auto it = lower_bound(tails.begin(), tails.end(), x);\n        if (it == tails.end()) tails.push_back(x);\n        else *it = x;\n    }\n    cout << tails.size() << '\\n';\n}`,
    python: `from bisect import bisect_left\n\nn = int(input())\na = list(map(int, input().split()))\ntails = []\nfor x in a[:n]:\n    i = bisect_left(tails, x)  # 第一個 >= x 的位置\n    if i == len(tails):\n        tails.append(x)\n    else:\n        tails[i] = x\n\nprint(len(tails))`,
  },
};
