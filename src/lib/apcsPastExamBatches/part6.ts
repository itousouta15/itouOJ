import { definePastExamLesson as lesson } from "@/lib/apcsPastExamLessonBuilder";

export const lessonsPart6 = [
  lesson("a450", {
    concept: "連續區段・維護目前長度",
    goal: "一次掃描找出最長的嚴格遞減連續區段。",
    explanation: [
      "cur 表示以目前建築結尾的遞減區段長度。第一棟自成一段，cur=1；若下一棟比目前低，就把 cur 加一，否則從下一棟重新開始，令 cur=1。",
      "每次更新 cur 後，同時更新 best。因為每個可能的區段終點都被檢查過，best 就是全體最長區段。這裡要求相鄰建築，不能跳過較高的樓。",
    ],
    complexity: "時間 O(n) ・ 空間 O(n)，可改成串流 O(1)",
    pitfall: "相同高度也會中斷嚴格遞減；答案計算建築棟數，不是兩棟之間的路段數。",
    traceLabel: "範例的遞減區段",
    trace: [
      { title: "第一棟", description: "從高度 6 開始，目前區段與最佳長度都是 1。", cells: ["6", "2", "5", "3", "1"], active: [0], variables: [["cur", "1"], ["best", "1"]] },
      { title: "下降後又上升", description: "6→2 讓 cur=2；2→5 不能延續，因此在 5 重新開始。", cells: ["6", "2", "5", "3", "1"], active: [1, 2], variables: [["cur", "1"], ["best", "2"]] },
      { title: "延續到最後", description: "5→3→1 連續下降，區段含 3 棟建築。", cells: ["6", "2", "5", "3", "1"], active: [2, 3, 4], variables: [["cur", "3"], ["best", "3"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> h(n);
    for (int &x : h) cin >> x;
    int cur = 1, best = 1;
    for (int i = 1; i < n; ++i) {
        cur = h[i] < h[i-1] ? cur + 1 : 1;
        best = max(best, cur);
    }
    cout << best << '\n';
}`,
    python: `import sys
data = list(map(int, sys.stdin.buffer.read().split()))
n, h = data[0], data[1:]
cur = best = 1
for i in range(1, n):
    cur = cur + 1 if h[i] < h[i - 1] else 1
    best = max(best, cur)
print(best)`,
  }),
  lesson("a451", {
    concept: "最佳值・第一次出現的位置",
    goal: "維護最高上傳分數、首次取得時間及嚴重錯誤次數。",
    explanation: [
      "依時間順序讀入每次上傳。只有分數嚴格大於目前最高分時，才同時更新最高分與時間；分數相同時保留較早的時間。另用 errors 統計分數 -1 的上傳。",
      "讀完 K 筆後，依公式 best-K-2×errors 計算考試總分，最後用 max(0,...) 截掉負值。公式中的最高分與扣分後總分是不同的量，取得時間要根據最高上傳分數判斷。",
    ],
    complexity: "時間 O(K)；C++ 串流狀態空間 O(1)，Python 整批切詞需 O(K)",
    pitfall: "重複最高分不能覆寫首次時間；嚴重錯誤同樣算一次上傳，還要再額外扣 2 分。",
    traceLabel: "最高分與扣分項目",
    trace: [
      { title: "第一次上傳", description: "時間 3 上傳 89 分，暫時最高分是 89，首次時間為 3。", cells: ["3:89", "5:-1", "10:90", "15:0", "20:90"], active: [0], variables: [["best", "89"], ["time", "3"]] },
      { title: "錯誤與新高分", description: "時間 5 是嚴重錯誤；時間 10 的 90 分刷新最高分。", cells: ["3:89", "5:-1", "10:90", "15:0", "20:90"], active: [1, 2], variables: [["errors", "1"], ["best / time", "90 / 10"]] },
      { title: "相同分數與結算", description: "時間 20 也是 90 分，保留首次時間 10；總分為 90-5-2=83。", cells: ["3:89", "5:-1", "10:90", "15:0", "20:90"], active: [4], variables: [["總分", "83"], ["首次時間", "10"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int k; cin >> k;
    int best = -1, first = 0, errors = 0;
    for (int i = 0; i < k; ++i) {
        int t, s; cin >> t >> s;
        if (s == -1) ++errors;
        if (s > best) { best = s; first = t; }
    }
    cout << max(0, best-k-2*errors) << ' ' << first << '\n';
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
k = next(it)
best, first, errors = -1, 0, 0
for _ in range(k):
    t, s = next(it), next(it)
    errors += s == -1
    if s > best:
        best, first = s, t
print(max(0, best - k - 2 * errors), first)`,
  }),
  lesson("a452", {
    concept: "相鄰差分・曼哈頓距離",
    goal: "計算每對相鄰站點的水平與垂直距離，維護最大及最小值。",
    explanation: [
      "從 (x1,y1) 到 (x2,y2) 的行進時間是 |x1-x2|+|y1-y2|。只比較原路線相鄰的站點，因此 n 個站點恰有 n-1 段要處理。",
      "讀入下一站時，利用上一站座標求距離，再更新最大與最小值。完成後把下一站保存為上一站，繼續讀下一筆即可，不需要排序座標或枚舉所有點對。",
    ],
    complexity: "時間 O(n)；C++ 串流狀態空間 O(1)，Python 整批切詞需 O(n)",
    pitfall: "不能使用直線距離或座標差的代數和；兩個座標差都要各自取絕對值。",
    traceLabel: "範例的三段距離",
    trace: [
      { title: "第一段", description: "(1,1)→(1,3) 的距離為 0+2=2，先初始化 min 與 max。", cells: ["(1,1)", "(1,3)", "(4,5)", "(2,6)"], active: [0, 1], variables: [["distance", "2"], ["min / max", "2 / 2"]] },
      { title: "第二段", description: "(1,3)→(4,5) 的距離為 3+2=5，最大值更新成 5。", cells: ["(1,1)", "(1,3)", "(4,5)", "(2,6)"], active: [1, 2], variables: [["distance", "5"], ["min / max", "2 / 5"]] },
      { title: "最後一段", description: "(4,5)→(2,6) 的距離為 2+1=3；依題意輸出最大值 5、最小值 2。", cells: ["(1,1)", "(1,3)", "(4,5)", "(2,6)"], active: [2, 3], variables: [["distance", "3"], ["答案", "5 2"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, x, y; cin >> n >> x >> y;
    int low = INT_MAX, high = 0;
    for (int i = 1; i < n; ++i) {
        int nx, ny; cin >> nx >> ny;
        int d = abs(nx-x) + abs(ny-y);
        low = min(low, d); high = max(high, d);
        x = nx; y = ny;
    }
    cout << high << ' ' << low << '\n';
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, x, y = next(it), next(it), next(it)
low, high = float("inf"), 0
for _ in range(n - 1):
    nx, ny = next(it), next(it)
    d = abs(nx - x) + abs(ny - y)
    low, high = min(low, d), max(high, d)
    x, y = nx, ny
print(high, low)`,
  }),
  lesson("a453", {
    concept: "三筆資料的統計・條件累加",
    goal: "逐商品計算價差，符合門檻時累加件數與平均價格。",
    explanation: [
      "每件商品獨立判斷。讀入三天價格，求最大值與最小值；若兩者之差至少為 d，表示這件商品要買一件。",
      "符合條件時，件數加一，費用加上三個價格的總和除以 3。題目保證平均值為整數，因此可以使用整數運算；等於門檻也必須購買。",
    ],
    complexity: "時間 O(n)；C++ 串流狀態空間 O(1)，Python 整批切詞需 O(n)",
    pitfall: "價差判斷用 >= d；平均值由三天價格計算，不能用最高價與最低價的平均。",
    traceLabel: "逐商品判斷",
    trace: [
      { title: "第一件商品", description: "示範 d=4：24、33、42 的價差為 18，買入價格為 33。", cells: ["24,33,42", "51,48,60", "77,77,77"], active: [0], variables: [["件數", "1"], ["總費用", "33"]] },
      { title: "第二件商品", description: "60-48=12 符合門檻，三天平均為 53，累計費用 86。", cells: ["24,33,42", "51,48,60", "77,77,77"], active: [1], variables: [["件數", "2"], ["總費用", "86"]] },
      { title: "第三件商品", description: "三天價格相同，價差 0 小於 4，不購買。", cells: ["24,33,42", "51,48,60", "77,77,77"], active: [2], variables: [["件數", "2"], ["總費用", "86"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, d; cin >> n >> d;
    int count = 0, total = 0;
    while (n--) {
        int a, b, c; cin >> a >> b >> c;
        if (max({a,b,c}) - min({a,b,c}) >= d) {
            ++count; total += (a+b+c)/3;
        }
    }
    cout << count << ' ' << total << '\n';
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, d = next(it), next(it)
count = total = 0
for _ in range(n):
    prices = [next(it), next(it), next(it)]
    if max(prices) - min(prices) >= d:
        count += 1
        total += sum(prices) // 3
print(count, total)`,
  }),
  lesson("a454", {
    concept: "交易紀錄・商品淨數量",
    goal: "將放入與取出轉為數量增減，逐客人判斷是否同時保留兩種商品。",
    explanation: [
      "每位客人的紀錄從零開始計數。正數 x 令商品 x 的數量加一，負數 -x 令商品 x 的數量減一；讀到 0 表示這位客人的紀錄結束。",
      "只在整份紀錄完成後判斷 count[a]>0 且 count[b]>0，因為中途放入的商品可能稍後被取出。每位客人的計數陣列要重新清空；同樣的商品編號 a=b 也能自然處理。",
    ],
    complexity: "令 T 為紀錄總數：時間 O(T+100n)；C++ 空間 O(100)，Python 整批切詞共 O(T+100)",
    pitfall: "不能只記錄是否曾出現過 a、b；必須扣除取出次數，也不能將不同客人的紀錄混在一起。",
    traceLabel: "商品 3 與 9 的淨數量",
    trace: [
      { title: "第一位客人", description: "3、9 各放一件，再取出 3，商品 3 的淨數量暫時為 0。", cells: ["3", "9", "-3", "3", "9", "0"], active: [0, 1, 2], variables: [["count[3]", "0"], ["count[9]", "1"]] },
      { title: "結束第一份紀錄", description: "又放入 3、9，最後兩種商品都有剩下，符合人數加一。", cells: ["3", "9", "-3", "3", "9", "0"], active: [3, 4, 5], variables: [["count[3] / count[9]", "1 / 2"], ["符合人數", "1"]] },
      { title: "第二位客人", description: "第二份紀錄 3,3,-3,-3,9 的商品 3 最後為 0，不符合；答案仍為 1。", cells: ["3", "3", "-3", "-3", "9", "0"], active: [0, 1, 2, 3, 4, 5], variables: [["count[3] / count[9]", "0 / 1"], ["符合人數", "1"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int a, b, n; cin >> a >> b >> n;
    int answer = 0;
    while (n--) {
        int count[101] = {}, x;
        while (cin >> x && x != 0) count[abs(x)] += x > 0 ? 1 : -1;
        answer += count[a] > 0 && count[b] > 0;
    }
    cout << answer << '\n';
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
a, b, n = next(it), next(it), next(it)
answer = 0
for _ in range(n):
    count = [0] * 101
    for x in it:
        if x == 0:
            break
        count[abs(x)] += 1 if x > 0 else -1
    answer += count[a] > 0 and count[b] > 0
print(answer)`,
  }),
  lesson("a456", {
    concept: "迴圈模擬・同時成立的條件",
    goal: "依照跳躍、檢查落點、扣血的順序更新角色狀態。",
    explanation: [
      "用 position 和 health 記錄角色狀態。每回合先 position+=health，接著以 position%x1==0 和 position%x2==0 判斷兩種陷阱，分別扣除傷害。",
      "只要 health>0 就繼續。兩個陷阱要用兩個獨立 if，因為同一落點可能同時觸發兩種傷害。每次生命下降後，後續跳躍距離也跟著改變。",
    ],
    complexity: "每次掉血前最多 max(x1,x2) 次跳躍，時間 O(k·max(x1,x2)) ・ 空間 O(1)",
    pitfall: "不能用 if/else if 處理兩種陷阱；生命恰好等於 0 時也要停止，且應先跳再扣血。",
    traceLabel: "k=7 的角色狀態",
    trace: [
      { title: "第一跳", description: "以生命 7 跳到位置 7，7 不是 3 或 2 的倍數，生命仍為 7。", cells: ["0", "7", "14", "18"], active: [1], variables: [["position", "7"], ["health", "7"]] },
      { title: "第二跳", description: "再跳 7 格到位置 14，觸發 2 的倍數陷阱，生命減 3 變成 4。", cells: ["0", "7", "14", "18"], active: [2], variables: [["position", "14"], ["health", "4"]] },
      { title: "第三跳", description: "跳 4 格到 18，同時是 3 與 2 的倍數，生命扣 2 再扣 3 成為 -1，停止於 18。", cells: ["0", "7", "14", "18"], active: [3], variables: [["position", "18"], ["health", "-1"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int health, x1, y1, x2, y2;
    cin >> health >> x1 >> y1 >> x2 >> y2;
    int position = 0;
    while (health > 0) {
        position += health;
        if (position % x1 == 0) health -= y1;
        if (position % x2 == 0) health -= y2;
    }
    cout << position << '\n';
}`,
    python: `import sys
health, x1, y1, x2, y2 = map(int, sys.stdin.buffer.read().split())
position = 0
while health > 0:
    position += health
    if position % x1 == 0:
        health -= y1
    if position % x2 == 0:
        health -= y2
print(position)`,
  }),
  lesson("a458", {
    concept: "布林正規化・真值表",
    goal: "先將任意整數轉成真假，再依序檢查 AND、OR 與 XOR。",
    explanation: [
      "題目處理邏輯運算，不是整數的位元運算。先做 a=(a!=0)、b=(b!=0)，將所有非零數字都轉成 true。",
      "AND 的結果是兩者皆真，OR 是至少一者為真，XOR 是兩者真假不同。依規定順序檢查三種結果是否等於 c，符合就輸出名稱；若完全沒有輸出，最後輸出 IMPOSSIBLE。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall: "3 XOR 0 的邏輯結果是 1，而不是整數位元運算得到的 3；多個符合的運算子都要列出。",
    traceLabel: "示例 a=3、b=0、c=1",
    trace: [
      { title: "轉成真假", description: "3 是非零，所以 a=true；0 代表 b=false。", cells: ["a=3", "b=0", "c=1"], active: [0, 1], variables: [["A", "true"], ["B", "false"]] },
      { title: "AND 與 OR", description: "AND 是 0 不符目標，OR 是 1 符合，先輸出 OR。", cells: ["AND=0", "OR=1", "XOR=1"], active: [0, 1], variables: [["目標", "1"], ["已輸出", "OR"]] },
      { title: "XOR", description: "兩者真假不同，XOR 也是 1，因此再輸出 XOR。", cells: ["AND=0", "OR=1", "XOR=1"], active: [2], variables: [["答案", "OR、XOR"], ["順序", "依 AND→OR→XOR"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    int a, b, c; cin >> a >> b >> c;
    bool x = a != 0, y = b != 0, found = false;
    vector<pair<string, bool>> results = {{"AND", x && y}, {"OR", x || y}, {"XOR", x != y}};
    for (auto [name, value] : results) if (value == c) {
        cout << name << '\n'; found = true;
    }
    if (!found) cout << "IMPOSSIBLE\n";
}`,
    python: `a, b, c = map(int, input().split())
x, y = a != 0, b != 0
results = [("AND", x and y), ("OR", x or y), ("XOR", x != y)]
answer = [name for name, value in results if value == c]
print("\\n".join(answer) if answer else "IMPOSSIBLE")`,
  }),
  lesson("a459", {
    concept: "排序化簡・三角形與平方比較",
    goal: "排序邊長後，先確認能否成形，再比較最長邊的平方。",
    explanation: [
      "排序得到 a≤b≤c 後，只要檢查 a+b>c 就能判斷三角形是否存在。其餘兩個三角形不等式因為 c 已是最大邊，自動成立。",
      "確認存在後比較 a²+b² 與 c²。相等是直角，小於是鈍角，大於是銳角。使用整數平方即可，不必算角度或開根號；排序後的三條邊也要先輸出。",
    ],
    complexity: "時間 O(1) ・ 空間 O(1)",
    pitfall: "a+b=c 是退化情況，應輸出 No；必須先判斷存在性，不能直接用平方關係分類。",
    traceLabel: "3、4、5 的分類流程",
    trace: [
      { title: "排序邊長", description: "依遞增順序得到 3、4、5，最長邊是 5。", cells: ["3", "4", "5"], active: [2], variables: [["a / b / c", "3 / 4 / 5"]] },
      { title: "確認存在", description: "3+4=7，大於最長邊 5，因此可以構成三角形。", cells: ["3+4=7", "5"], active: [0, 1], variables: [["三角形不等式", "7 > 5"]] },
      { title: "比較平方", description: "3²+4²=9+16=25，等於 5²，因此輸出 Right。", cells: ["9", "16", "25"], active: [0, 1, 2], variables: [["a²+b²", "25"], ["c²", "25"], ["分類", "Right"]] },
    ],
    cpp: String.raw`#include <bits/stdc++.h>
using namespace std;
int main() {
    long long s[3]; cin >> s[0] >> s[1] >> s[2];
    sort(s, s+3);
    long long a=s[0], b=s[1], c=s[2];
    cout << a << ' ' << b << ' ' << c << '\n';
    if (a+b <= c) cout << "No\n";
    else if (a*a+b*b == c*c) cout << "Right\n";
    else if (a*a+b*b < c*c) cout << "Obtuse\n";
    else cout << "Acute\n";
}`,
    python: `a, b, c = sorted(map(int, input().split()))
print(a, b, c)
if a + b <= c:
    print("No")
elif a*a + b*b == c*c:
    print("Right")
elif a*a + b*b < c*c:
    print("Obtuse")
else:
    print("Acute")`,
  }),
];
