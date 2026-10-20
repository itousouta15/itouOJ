import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a604", {
    topic: "strings",
    level: "easy",
    concept: "區分大小寫的字母頻率",
    goal: "保留逐行邊界，依指定字母順序列出最高頻率。",
    explanation: [
      "每行建立 52 個字母的計數，大寫 A–Z 與小寫 a–z 分開；空白、數字及標點都略過。掃完後求最大頻率，再按照大寫優先、小寫其次的順序收集所有同頻字母。",
      "使用 getline 或逐行迭代，不可把整份輸入以空白切開，因為每行是獨立問題。將同頻字母直接串接，再印一個空白與頻率。若一行沒有英文字母，程式採空字母串加 0 的自然延伸；本地題敘未額外定義該情況。",
    ],
    complexity: "每行 O(L+52) 時間，O(52) 空間。",
    pitfall: "大小寫不合併，且其他字元不參與最高頻率比較。",
    traceLabel: "示意：AaA bb!",
    trace: [
      {
        title: "計數大寫",
        description: "兩個 A 都記入同一格。",
        cells: ["A:2", "a:0", "b:0"],
        active: [0],
        variables: [["A", "2"]],
      },
      {
        title: "計數小寫",
        description: "a 出現 1 次、b 出現 2 次，空白與 ! 略過。",
        cells: ["A:2", "a:1", "b:2"],
        active: [1, 2],
        variables: [["最大頻率", "2"]],
      },
      {
        title: "按序輸出",
        description: "A 與 b 並列，結果為 Ab 2。",
        cells: ["A", "b", "2"],
        active: [0, 1],
        variables: [["輸出", "Ab 2"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
using namespace std;
int main() {
    string s, letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    while (getline(cin, s)) {
        int count[52] = {};
        for (char ch : s) {
            size_t p = letters.find(ch);
            if (p != string::npos)
                ++count[p];
        }
        int best = *max_element(count, count + 52);
        string answer;
        if (best)
            for (int i = 0; i < 52; ++i)
                if (count[i] == best)
                    answer += letters[i];
        cout << answer << ' ' << best << '\n';
    }
}`,
    python: String.raw`import sys

letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
for line in sys.stdin:
    counts = dict.fromkeys(letters, 0)
    for ch in line:
        if ch in counts:
            counts[ch] += 1
    best = max(counts.values())
    answer = ''.join(ch for ch in letters if best and counts[ch] == best)
    print(answer, best)
`,
  }),
  defineCpeLesson("a605", {
    topic: "geometry",
    level: "easy",
    concept: "平行四邊形的向量加減",
    goal: "找出重複端點，利用鄰邊向量還原第四點。",
    explanation: [
      "設共同端點為 C，另兩個已知點為 A、B。兩條相鄰邊向量是 A−C、B−C，因此第四點是 C+(A−C)+(B−C)=A+B−C。先在四個輸入點中找出重複的共同端點。",
      "四個輸入點的總和是 A+B+2C，所以也可用總和減去 3C 得到第四點，不必重新排列端點。每組有八個數，讀至 EOF；固定輸出三位小數。相同座標由相同十進位輸入讀成相同 double，可直接比較；極小的負零在輸出前歸零。",
    ],
    complexity: "每組時間 O(1)，空間 O(1)。",
    pitfall: "不是把四點平均；共同端點可能出現在任何兩個位置。",
    traceLabel: "示意：C=(1,1)，A=(4,1)，B=(1,3)",
    trace: [
      {
        title: "辨認共同點",
        description: "輸入 C、A、B、C，共同端點 (1,1) 出現兩次。",
        cells: ["(1,1)", "(4,1)", "(1,3)", "(1,1)"],
        active: [0, 3],
        variables: [["C", "(1,1)"]],
      },
      {
        title: "兩邊向量",
        description: "A−C=(3,0)，B−C=(0,2)。",
        cells: ["(3,0)", "(0,2)"],
        active: [0, 1],
        variables: [["合向量", "(3,2)"]],
      },
      {
        title: "還原頂點",
        description: "C+(3,2)=(4,3)，輸出 4.000 3.000。",
        cells: ["1+3=4", "1+2=3"],
        active: [0, 1],
        variables: [["第四點", "(4,3)"]],
      },
    ],
    cpp: String.raw`#include <cmath>
#include <iomanip>
#include <iostream>
using namespace std;
int main() {
    double x[4], y[4];
    cout << fixed << setprecision(3);
    while (cin >> x[0] >> y[0]) {
        for (int i = 1; i < 4; ++i)
            cin >> x[i] >> y[i];
        int common = 0;
        for (int i = 0; i < 4; ++i)
            for (int j = i + 1; j < 4; ++j)
                if (x[i] == x[j] && y[i] == y[j])
                    common = i;
        double a = -3 * x[common], b = -3 * y[common];
        for (int i = 0; i < 4; ++i) {
            a += x[i];
            b += y[i];
        }
        if (abs(a) < 0.0000001)
            a = 0;
        if (abs(b) < 0.0000001)
            b = 0;
        cout << a << ' ' << b << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(float, sys.stdin.buffer.read().split()))
for x in it:
    p = [(x, next(it))] + [(next(it), next(it)) for _ in range(3)]
    common = next(p[i] for i in range(4) for j in range(i + 1, 4) if p[i] == p[j])
    a = sum(v[0] for v in p) - 3 * common[0]
    b = sum(v[1] for v in p) - 3 * common[1]
    if abs(a) < 1e-7:
        a = 0.0
    if abs(b) < 1e-7:
        b = 0.0
    print(f'{a:.3f} {b:.3f}')
`,
  }),
  defineCpeLesson("a606", {
    topic: "strings",
    level: "hard",
    concept: "KMP 前綴函數與最長回文後綴",
    goal: "在線性時間內找出末尾需要補上的最少字元。",
    explanation: [
      "若原字串 s 的最長回文後綴長度為 L，只需在末尾補上前 n−L 個字元的反轉。反過來，任何只補 k 個字元的回文，都要求原字串後 n−k 個字元自己為回文，所以最長回文後綴確實給出最少補字數。",
      "令 r=reverse(s)，建立 r+'#'+s 的 KMP 前綴函數。最後的前綴匹配長度就是 r 的前綴與 s 後綴的最大相同長度，也就是 L。# 不在英文字母輸入中，可阻止匹配越過分隔；每行讀至 EOF，不改變大小寫，答案為 s+r[L:]。",
    ],
    complexity: "時間 O(n)，空間 O(n)。",
    pitfall: "需要的是回文後綴而非前綴；逐次暴力檢查可能退化成 O(n²)。",
    traceLabel: "示意：s=abac",
    trace: [
      {
        title: "反轉與串接",
        description: "r=caba，計算 caba#abac 的前綴函數。",
        cells: ["caba", "#", "abac"],
        active: [0, 2],
        variables: [["n", "4"]],
      },
      {
        title: "尾端匹配",
        description: "s 的後綴 c 與 r 的前綴 c 相同，L=1。",
        cells: ["aba", "c"],
        active: [1],
        variables: [
          ["L", "1"],
          ["需補長度", "3"],
        ],
      },
      {
        title: "補反轉前段",
        description: "補上 aba，得到 abacaba，總長 7。",
        cells: ["abac", "aba"],
        active: [1],
        variables: [
          ["答案", "abacaba"],
          ["長度", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    string s;
    while (getline(cin, s)) {
        if (!s.empty() && s.back() == '\r')
            s.pop_back();
        string r = s;
        reverse(r.begin(), r.end());
        string text = r + "#" + s;
        vector<int> pi(text.size());
        for (int i = 1; i < (int)text.size(); ++i) {
            int j = pi[i - 1];
            while (j && text[i] != text[j])
                j = pi[j - 1];
            if (text[i] == text[j])
                ++j;
            pi[i] = j;
        }
        cout << s << r.substr(pi.back()) << '\n';
    }
}`,
    python: String.raw`import sys

for line in sys.stdin:
    s = line.rstrip('\r\n')
    r = s[::-1]
    text = r + '#' + s
    pi = [0] * len(text)
    for i in range(1, len(text)):
        j = pi[i - 1]
        while j and text[i] != text[j]:
            j = pi[j - 1]
        if text[i] == text[j]:
            j += 1
        pi[i] = j
    print(s + r[pi[-1] :])
`,
  }),
  defineCpeLesson("a607", {
    topic: "simulation",
    level: "medium",
    concept: "分鐘區間分類與整數分計費",
    goal: "準確處理跨午夜、跨費率與固定欄寬輸出。",
    explanation: [
      "把時分轉成從午夜起的分鐘。若結束分鐘不大於開始分鐘，就加 1440；相等代表完整 24 小時。枚舉半開區間 [start,end) 的每分鐘，取模 1440 後，以 480、1080、1320 為邊界分成日間、晚間、夜間。",
      "通話最長只有 1440 分鐘，直接逐分分類已足夠快，也能避開跨午夜的分段錯誤。費率用整數分儲存，先算總分再格式化為兩位小數。輸出六欄靠右、寬度 10、6、6、6、3、8，沒有額外分隔符；讀到 # 結束，題敘中的欄位標示數字不輸出。",
    ],
    complexity: "每通 O(1440) 時間，O(1) 空間。",
    pitfall: "18:00 屬晚間、22:00 屬夜間；相同起訖時間不能算成零分鐘。",
    traceLabel: "示意：A 級 17:58 到 18:04",
    trace: [
      {
        title: "轉換分鐘",
        description: "開始 1078，結束 1084，總長 6 分鐘。",
        cells: ["1078", "1080", "1084"],
        active: [0, 2],
        variables: [["通話長", "6"]],
      },
      {
        title: "分時段",
        description: "[1078,1080) 兩分鐘日間；其後四分鐘晚間。",
        cells: ["日 2", "晚 4", "夜 0"],
        active: [0, 1],
        variables: [["總分鐘", "6"]],
      },
      {
        title: "整數分費用",
        description: "2×10+4×6=44 分，即 0.44 元。",
        cells: ["20 分", "24 分", "0 分"],
        active: [0, 1],
        variables: [["總費用", "0.44"]],
      },
    ],
    cpp: String.raw`#include <iomanip>
#include <iostream>
#include <string>
using namespace std;
int main() {
    int rate[5][3] = {{10, 6, 2}, {25, 15, 5}, {53, 33, 13}, {87, 47, 17}, {144, 80, 30}};
    string type, phone;
    while (cin >> type && type != "#") {
        int h1, m1, h2, m2;
        cin >> phone >> h1 >> m1 >> h2 >> m2;
        int start = h1 * 60 + m1, end = h2 * 60 + m2;
        if (end <= start)
            end += 1440;
        int count[3] = {};
        for (int t = start; t < end; ++t) {
            int x = t % 1440;
            int band = (x >= 480 && x < 1080) ? 0 : (x >= 1080 && x < 1320) ? 1 : 2;
            ++count[band];
        }
        int cost = 0;
        for (int j = 0; j < 3; ++j)
            cost += count[j] * rate[type[0] - 'A'][j];
        string money =
            to_string(cost / 100) + "." + (cost % 100 < 10 ? "0" : "") + to_string(cost % 100);
        cout << setw(10) << phone << setw(6) << count[0] << setw(6) << count[1] << setw(6)
             << count[2] << setw(3) << type << setw(8) << money << '\n';
    }
}`,
    python: String.raw`import sys

rates = {
    'A': (10, 6, 2),
    'B': (25, 15, 5),
    'C': (53, 33, 13),
    'D': (87, 47, 17),
    'E': (144, 80, 30),
}
for line in sys.stdin:
    fields = line.split()
    if not fields:
        continue
    if fields[0] == '#':
        break
    kind, phone = fields[:2]
    h1, m1, h2, m2 = map(int, fields[2:])
    start, end = h1 * 60 + m1, h2 * 60 + m2
    if end <= start:
        end += 1440
    count = [0, 0, 0]
    for minute in range(start, end):
        x = minute % 1440
        band = 0 if 480 <= x < 1080 else 1 if 1080 <= x < 1320 else 2
        count[band] += 1
    cost = sum(x * y for x, y in zip(count, rates[kind]))
    money = f'{cost // 100}.{cost % 100:02d}'
    print(f'{phone:>10}{count[0]:6d}{count[1]:6d}{count[2]:6d}{kind:>3}{money:>8}')
`,
  }),
  defineCpeLesson("a608", {
    topic: "geometry",
    level: "easy",
    concept: "圓心角、弧長與半角弦長",
    goal: "統一角度單位後求較短弧與兩衛星直線距離。",
    explanation: [
      "軌道半徑為 R=6440+s。若單位是 min，先除以 60 轉成度；把角度正規化到 [0,360)，再取 min(a,360−a)，得到不超過 180 度的較短圓心角。乘 π/180 轉為弧度 θ。",
      "弧長是 Rθ；兩半徑與弦構成等腰三角形，從圓心垂直到弦可得到半弦 R·sin(θ/2)，所以弦長為 2R·sin(θ/2)。半角公式也避免小角時 1−cosθ 的消去誤差。讀至 EOF，兩個結果皆印六位小數。",
    ],
    complexity: "每筆時間、空間均 O(1)。",
    pitfall: "高度不是半徑；角分不是弧度；大於 180 度必須改取較短弧。",
    traceLabel: "示意：s=0，a=180 deg",
    trace: [
      {
        title: "軌道半徑",
        description: "衛星高度 0，R=6440。",
        cells: ["6440", "0"],
        active: [0, 1],
        variables: [["R", "6440"]],
      },
      {
        title: "轉弧度",
        description: "180 度對應 π 弧度，半角為 π/2。",
        cells: ["180°", "3.141592654", "1.570796327"],
        active: [1, 2],
        variables: [["θ", "π"]],
      },
      {
        title: "計算距離",
        description: "弦長是直徑 12880；弧長為 6440π。",
        cells: ["20231.856689", "12880.000000"],
        active: [0, 1],
        variables: [
          ["弧長", "20231.856689"],
          ["弦長", "12880"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <string>
using namespace std;
int main() {
    double s, a;
    string unit;
    const double pi = acos(-1.0);
    cout << fixed << setprecision(6);
    while (cin >> s >> a >> unit) {
        if (unit == "min")
            a /= 60;
        a = fmod(a, 360.0);
        a = min(a, 360 - a);
        double theta = a * pi / 180, r = 6440 + s;
        cout << r * theta << ' ' << 2 * r * sin(theta / 2) << '\n';
    }
}`,
    python: String.raw`import sys, math

for line in sys.stdin:
    if not line.strip():
        continue
    s, a, unit = line.split()
    r, a = 6440 + float(s), float(a)
    if unit == 'min':
        a /= 60
    a %= 360
    theta = math.radians(min(a, 360 - a))
    print(f'{r * theta:.6f} {2 * r * math.sin(theta / 2):.6f}')
`,
  }),
  defineCpeLesson("a609", {
    topic: "dp",
    level: "hard",
    concept: "固定個數的可達和與位元集合",
    goal: "列出恰選 N 個數的可達總和，再評估兩組乘積極值。",
    explanation: [
      "設全部總和為 S，第一組總和為 x，第二組便是 S−x，乘積只取決於 x。真正限制是恰好選 N 個，而非任意子集合。每個值加 50 後落在 [0,100]，選 N 個的位移和 u 對應 x=u−50N；這樣可用非負索引表示。",
      "令 bits[k] 的第 u 位表示已處理元素中恰選 k 個能否得到位移和 u。加入 v 時從 k 大到小做 bits[k] |= bits[k−1] << (v+50)，防止同一數字重用。最後掃描 bits[N] 的可達位，計算 x(S−x) 的最大與最小；C++ 以固定 bitset，Python 以大整數。輸入至 EOF，每筆先最大再最小。",
    ],
    complexity:
      "設 B=100N≤5000，C++ 約 O((N+M)NB/word)；Python 為同量級位元運算，空間 O(NB)。",
    pitfall: "有負數，不能只找總和的一半；最小乘積也須檢查所有可達和。",
    traceLabel: "示意：N=M=2，數列 1、2、3、4",
    trace: [
      {
        title: "固定選兩個",
        description: "可達第一組總和為 3、4、5、6、7。",
        cells: ["3", "4", "5", "6", "7"],
        active: [0, 1, 2, 3, 4],
        variables: [["總和 S", "10"]],
      },
      {
        title: "靠近中間",
        description: "x=5 得 5×5=25，為最大。",
        cells: ["21", "24", "25", "24", "21"],
        active: [2],
        variables: [["最大", "25"]],
      },
      {
        title: "兩側極值",
        description: "x=3 或 7 都得 21，為最小。",
        cells: ["21", "24", "25", "24", "21"],
        active: [0, 4],
        variables: [["輸出", "25 21"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <bitset>
#include <iostream>
#include <limits>
#include <vector>
using namespace std;
int main() {
    int n, m;
    while (cin >> n >> m) {
        vector<bitset<5001>> dp(n + 1);
        dp[0][0] = 1;
        long long total = 0;
        for (int i = 0; i < n + m; ++i) {
            int x;
            cin >> x;
            total += x;
            for (int k = min(n, i + 1); k >= 1; --k)
                dp[k] |= dp[k - 1] << (x + 50);
        }
        long long hi = numeric_limits<long long>::min(), lo = numeric_limits<long long>::max();
        for (int u = 0; u <= 100 * n; ++u)
            if (dp[n][u]) {
                long long x = u - 50 * n, value = x * (total - x);
                hi = max(hi, value);
                lo = min(lo, value);
            }
        cout << hi << ' ' << lo << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    m = next(it)
    dp = [1] + [0] * n
    total = 0
    for i in range(n + m):
        x = next(it)
        total += x
        for k in range(min(n, i + 1), 0, -1):
            dp[k] |= dp[k - 1] << (x + 50)
    hi, lo = -(10**30), 10**30
    states = dp[n]
    while states:
        bit = states & -states
        x = bit.bit_length() - 1 - 50 * n
        value = x * (total - x)
        hi, lo = max(hi, value), min(lo, value)
        states -= bit
    print(hi, lo)
`,
  }),
  defineCpeLesson("a610", {
    topic: "number-theory",
    level: "easy",
    concept: "整除鏈與嚴格遞減條件",
    goal: "確認 n 是否能連續整除 m 到 1，並輸出完整序列。",
    explanation: [
      "若 m>1，每次精確除以 m 都會嚴格下降。從 n 開始，遇到不能整除便無解；若最後降到 1 就是所求序列，也等價於 n 是 m 的非負整數次方。直接反覆除法比浮點對數判斷可靠。",
      "n=0 無法到達 1。當 n>1 時，m=0 無法除、m=1 無法嚴格下降，皆回報 Boring!。n=1 已在目標，本程式依本地敘述未要求至少一次除法，採零次操作輸出單元素序列 1（即使 m≤1）；若評測另外要求至少兩項，這個邊界須由題目補充。先保存整段，確定成功後才輸出，避免失敗時已印出半條鏈。",
    ],
    complexity: "時間與輸出空間 O(log_m n)，非法 m 為 O(1)。",
    pitfall: "m=1 會造成無限迴圈；不能在確認成功之前逐項輸出。",
    traceLabel: "示意：n=81,m=3",
    trace: [
      {
        title: "第一次除法",
        description: "81 能整除 3，得到 27。",
        cells: ["81", "27"],
        active: [1],
        variables: [["餘數", "0"]],
      },
      {
        title: "持續整除",
        description: "27/3=9，9/3=3。",
        cells: ["81", "27", "9", "3"],
        active: [2, 3],
        variables: [["目前", "3"]],
      },
      {
        title: "到達 1",
        description: "3/3=1，整條鏈合法且嚴格遞減。",
        cells: ["81", "27", "9", "3", "1"],
        active: [4],
        variables: [["輸出個數", "5"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    long long n, m;
    while (cin >> n >> m) {
        if (n == 1) {
            cout << "1\n";
            continue;
        }
        if (n < 1 || m <= 1) {
            cout << "Boring!\n";
            continue;
        }
        vector<long long> answer = {n};
        while (n > 1 && n % m == 0) {
            n /= m;
            answer.push_back(n);
        }
        if (n != 1)
            cout << "Boring!\n";
        else {
            for (int i = 0; i < (int)answer.size(); ++i) {
                if (i)
                    cout << ' ';
                cout << answer[i];
            }
            cout << '\n';
        }
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    m = next(it)
    if n == 1:
        print(1)
        continue
    if n < 1 or m <= 1:
        print('Boring!')
        continue
    answer = [n]
    while n > 1 and n % m == 0:
        n //= m
        answer.append(n)
    if n == 1:
        print(*answer)
    else:
        print('Boring!')
`,
  }),
  defineCpeLesson("a611", {
    topic: "sorting",
    level: "hard",
    concept: "對稱距離分組與字典序貪心",
    goal: "滿足重量由外向內不增，並選字母序最小的信箱配置。",
    explanation: [
      "將所有員工的包裹數遞減排序，離中心最遠的一對格子必須使用前兩大數，下一對用第三、第四大，以此類推。相同重量可能跨越多個距離層，但每層所需的重量多重集合仍固定。奇數 N 的中央層只有一個格子。",
      "按位置由左至右填入。位置 i 所屬層為 min(i,N−1−i)，從未使用員工中選字母最小、且重量仍存在該層需求的那位，再移除該重量一次。相同重量的員工可互換，不會影響剩餘可行性，因此每一步選最小字母便保證整體字典序最小。統計時忽略超出前 N 個字母的字元，# 結束；最後輸出字母及對應包裹數兩行。",
    ],
    complexity: "時間 O(N²+L)，空間 O(N)，L 為包裹字串長。",
    pitfall: "左右同距離可互換，不能只排序後固定交錯放；零包裹員工也須分配。",
    traceLabel: "示意：N=5，A:0、B:1、C:2、D:3、E:4",
    trace: [
      {
        title: "分配重量層",
        description: "最外層需求 {4,3}，次外層 {2,1}，中央 {0}。",
        cells: ["{4,3}", "{2,1}", "{0}"],
        active: [0, 1, 2],
        variables: [["N", "5"]],
      },
      {
        title: "從左選最小字母",
        description: "外層先選 D，次外層選 B，中央只可 A。",
        cells: ["D:3", "B:1", "A:0", "?", "?"],
        active: [0, 1, 2],
        variables: [["前綴", "D B A"]],
      },
      {
        title: "完成右側",
        description: "剩餘需求是 C:2、E:4，得到 D B A C E。",
        cells: ["D:3", "B:1", "A:0", "C:2", "E:4"],
        active: [3, 4],
        variables: [["重量序列", "3 1 0 2 4"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <functional>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<int> count(n);
        char ch;
        while (cin >> ch && ch != '#')
            if (ch >= 'A' && ch < 'A' + n)
                ++count[ch - 'A'];
        vector<int> weights = count;
        sort(weights.begin(), weights.end(), greater<int>());
        vector<vector<int>> need((n + 1) / 2);
        for (int i = 0; i < n; ++i)
            need[i / 2].push_back(weights[i]);
        vector<bool> used(n);
        vector<int> order;
        for (int i = 0; i < n; ++i) {
            auto &group = need[min(i, n - 1 - i)];
            for (int j = 0; j < n; ++j)
                if (!used[j]) {
                    auto it = find(group.begin(), group.end(), count[j]);
                    if (it != group.end()) {
                        used[j] = true;
                        order.push_back(j);
                        group.erase(it);
                        break;
                    }
                }
        }
        for (int i = 0; i < n; ++i) {
            if (i)
                cout << ' ';
            cout << char('A' + order[i]);
        }
        cout << '\n';
        for (int i = 0; i < n; ++i) {
            if (i)
                cout << ' ';
            cout << count[order[i]];
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())
for _ in range(int(next(it))):
    n = int(next(it))
    count = [0] * n
    while True:
        token = next(it)
        for ch in token:
            if 65 <= ch < 65 + n:
                count[ch - 65] += 1
        if 35 in token:
            break
    weights = sorted(count, reverse=True)
    need = [weights[i : i + 2] for i in range(0, n, 2)]
    used, order = set(), []
    for i in range(n):
        group = need[min(i, n - 1 - i)]
        for j in range(n):
            if j not in used and count[j] in group:
                used.add(j)
                order.append(j)
                group.remove(count[j])
                break
    print(' '.join(chr(65 + j) for j in order))
    print(*(count[j] for j in order))
`,
  }),
  defineCpeLesson("a612", {
    topic: "geometry",
    level: "easy",
    concept: "邊長排序與嚴格多邊形不等式",
    goal: "依分類優先順序判斷四條邊能組成的形狀。",
    explanation: [
      "排序後 a≤b≤c≤d。四邊相等就可組成正方形；否則 a=b 且 c=d 可組成長方形。這兩種判斷必須先做，因為它們也都是一般四邊形。",
      "剩餘情況有非退化四邊形的充要條件是 a+b+c>d：最長邊必須小於其餘三邊總和。等號只能攤平成直線，應輸出 banana。題敘稱為正邊長，但邊界文字提到 0，程式保守地將非正邊分類為 banana。加總使用 64 位元，避免三個接近 2^30 的邊溢位。",
    ],
    complexity: "每筆時間、空間 O(1)。",
    pitfall: "正方形優先於長方形；四邊形條件使用嚴格大於。",
    traceLabel: "示意：1、2、3、6",
    trace: [
      {
        title: "排序邊長",
        description: "已是 1≤2≤3≤6。",
        cells: ["1", "2", "3", "6"],
        active: [0, 1, 2, 3],
        variables: [["最長邊", "6"]],
      },
      {
        title: "排除特殊類型",
        description: "四邊不等，也沒有兩對相等邊。",
        cells: ["1≠2", "3≠6"],
        active: [0, 1],
        variables: [
          ["square", "否"],
          ["rectangle", "否"],
        ],
      },
      {
        title: "檢查退化",
        description: "1+2+3=6，不嚴格大於最長邊，輸出 banana。",
        cells: ["6", "=", "6"],
        active: [0, 2],
        variables: [["分類", "banana"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        long long a[4];
        for (auto &x : a)
            cin >> x;
        sort(a, a + 4);
        if (a[0] <= 0)
            cout << "banana\n";
        else if (a[0] == a[3])
            cout << "square\n";
        else if (a[0] == a[1] && a[2] == a[3])
            cout << "rectangle\n";
        else if (a[0] + a[1] + a[2] > a[3])
            cout << "quadrangle\n";
        else
            cout << "banana\n";
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    a, b, c, d = sorted(next(it) for _ in range(4))
    if a <= 0:
        answer = 'banana'
    elif a == d:
        answer = 'square'
    elif a == b and c == d:
        answer = 'rectangle'
    elif a + b + c > d:
        answer = 'quadrangle'
    else:
        answer = 'banana'
    print(answer)
`,
  }),
  defineCpeLesson("a613", {
    topic: "trees",
    level: "medium",
    concept: "符號乘法線段樹",
    goal: "在大量單點更新與區間查詢下只保存乘積正負。",
    explanation: [
      "把每個數字壓成 −1、0、1，乘法後仍只需要這三種狀態。符號乘法具結合律，單位元是 1，因此線段樹每個內部節點保存左右子區間符號的乘積，無須計算可能溢位的實際乘積。",
      "更新葉節點後往根重算；查詢使用半開區間，左右指標往上爬，把涵蓋的節點符號相乘。索引 I、J 是一基，轉成葉位置時務必一致。每組查詢結果串成一行，+、−、0 之間沒有空白；多組輸入讀至 EOF。",
    ],
    complexity: "建樹 O(N)，每指令 O(log N)，空間 O(N)。",
    pitfall: "零是乘法吸收元，不能只統計負數而忽略零；更新是指定值而非乘上 V。",
    traceLabel: "示意：[-2,6,0,-1]",
    trace: [
      {
        title: "符號化",
        description: "葉子為 −1、1、0、−1，整段乘積為零。",
        cells: ["−1", "1", "0", "−1"],
        active: [0, 1, 2, 3],
        variables: [["P 1 4", "0"]],
      },
      {
        title: "更新第 3 項",
        description: "改成 7 後符號為正，負數共有兩個。",
        cells: ["−1", "1", "1", "−1"],
        active: [2],
        variables: [["P 1 4", "+"]],
      },
      {
        title: "更新第 1 項",
        description: "改成 10，整段只剩一個負數。",
        cells: ["1", "1", "1", "−1"],
        active: [0],
        variables: [["P 1 4", "−"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
int sign(int x) {
    return (x > 0) - (x < 0);
}
int main() {
    int n, k;
    while (cin >> n >> k) {
        int size = 1;
        while (size < n)
            size *= 2;
        vector<int> tree(2 * size, 1);
        for (int i = 0, x; i < n; ++i) {
            cin >> x;
            tree[size + i] = sign(x);
        }
        for (int i = size - 1; i; --i)
            tree[i] = tree[2 * i] * tree[2 * i + 1];
        string answer;
        while (k--) {
            char op;
            int i, j;
            cin >> op >> i >> j;
            if (op == 'C') {
                int p = size + i - 1;
                tree[p] = sign(j);
                while (p > 1) {
                    p /= 2;
                    tree[p] = tree[p * 2] * tree[p * 2 + 1];
                }
            } else {
                int l = size + i - 1, r = size + j, value = 1;
                while (l < r) {
                    if (l & 1)
                        value *= tree[l++];
                    if (r & 1)
                        value *= tree[--r];
                    l /= 2;
                    r /= 2;
                }
                answer += value == 0 ? '0' : value > 0 ? '+' : '-';
            }
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.buffer.read().split())


def sign(x):
    return (x > 0) - (x < 0)


for token in it:
    n, k = int(token), int(next(it))
    size = 1
    while size < n:
        size *= 2
    tree = [1] * (2 * size)
    for i in range(n):
        tree[size + i] = sign(int(next(it)))
    for i in range(size - 1, 0, -1):
        tree[i] = tree[i * 2] * tree[i * 2 + 1]
    answer = []
    for _ in range(k):
        op, i, j = next(it), int(next(it)), int(next(it))
        if op == b'C':
            p = size + i - 1
            tree[p] = sign(j)
            while p > 1:
                p //= 2
                tree[p] = tree[p * 2] * tree[p * 2 + 1]
        else:
            l, r, value = size + i - 1, size + j, 1
            while l < r:
                if l & 1:
                    value *= tree[l]
                    l += 1
                if r & 1:
                    r -= 1
                    value *= tree[r]
                l //= 2
                r //= 2
            answer.append('0' if value == 0 else '+' if value > 0 else '-')
    print(''.join(answer))
`,
  }),
  defineCpeLesson("a614", {
    topic: "graphs",
    level: "medium",
    concept: "字母替換隱含圖與 BFS 路徑還原",
    goal: "只產生相差一字母的鄰居，搜尋最短 doublet 序列。",
    explanation: [
      "把每個字典單字當頂點，恰一位置不同時有邊。無須兩兩比較整本字典；擴展單字時枚舉每個位置及 a–z 的替換，若新字在字典中便是鄰居。這只會連到等長單字，避免不必要的圖建構。",
      "每個查詢使用 BFS，首次到達一字時保存其前驅；BFS 按距離分層，因此第一次到達終點時得到最短序列。從終點沿前驅回到起點再反轉輸出。字典由第一個空行終止；查詢間恰留一空行，無解印 No solution.。原題允許任一最短序列，本地公開資料採唯一解或無解。",
    ],
    complexity:
      "每查詢訪問 V 個長 L 單字，約 O(26VL²) 字元處理；空間 O(DL+V)。",
    pitfall: "起終點都必須在字典；不可用 DFS 的第一條路徑當最短解。",
    traceLabel: "示意：字典 cat、cot、cog、dog，查 cat 到 dog",
    trace: [
      {
        title: "起點層",
        description: "cat 距離 0，替換 a 為 o 可到 cot。",
        cells: ["cat:0", "cot:1"],
        active: [1],
        variables: [
          ["parent(cot)", "cat"],
          ["距離", "1"],
        ],
      },
      {
        title: "下一層",
        description: "cot 改最後一字得 cog，距離 2。",
        cells: ["cat:0", "cot:1", "cog:2"],
        active: [2],
        variables: [
          ["parent(cog)", "cot"],
          ["距離", "2"],
        ],
      },
      {
        title: "還原最短路",
        description: "cog 到 dog，距離 3；沿前驅反轉得到四個單字。",
        cells: ["cat", "cot", "cog", "dog"],
        active: [3],
        variables: [
          ["邊數", "3"],
          ["單字數", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
int main() {
    unordered_set<string> dict;
    string line;
    while (getline(cin, line)) {
        if (!line.empty() && line.back() == '\r')
            line.pop_back();
        if (line.empty())
            break;
        dict.insert(line);
    }
    string start, goal;
    bool first = true;
    while (cin >> start >> goal) {
        if (!first)
            cout << '\n';
        first = false;
        unordered_map<string, string> parent;
        queue<string> q;
        if (dict.count(start) && dict.count(goal)) {
            parent[start] = start;
            q.push(start);
        }
        while (!q.empty() && !parent.count(goal)) {
            string u = q.front();
            q.pop();
            string v = u;
            for (int i = 0; i < (int)u.size(); ++i) {
                for (char ch = 'a'; ch <= 'z'; ++ch) {
                    v[i] = ch;
                    if (dict.count(v) && !parent.count(v)) {
                        parent[v] = u;
                        q.push(v);
                    }
                }
                v[i] = u[i];
            }
        }
        if (!parent.count(goal)) {
            cout << "No solution.\n";
            continue;
        }
        vector<string> path;
        string v = goal;
        for (;;) {
            path.push_back(v);
            if (v == start)
                break;
            v = parent[v];
        }
        reverse(path.begin(), path.end());
        for (auto &w : path)
            cout << w << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque

lines = iter(sys.stdin.read().splitlines())
dictionary = set()
for line in lines:
    if line == '':
        break
    dictionary.add(line)
outputs = []
for line in lines:
    if not line.strip():
        continue
    start, goal = line.split()
    parent = {start: None} if start in dictionary and goal in dictionary else {}
    queue = deque(parent)
    while queue and goal not in parent:
        u = queue.popleft()
        for i in range(len(u)):
            for ch in 'abcdefghijklmnopqrstuvwxyz':
                v = u[:i] + ch + u[i + 1 :]
                if v in dictionary and v not in parent:
                    parent[v] = u
                    queue.append(v)
    if goal not in parent:
        outputs.append('No solution.')
    else:
        path, v = [], goal
        while v is not None:
            path.append(v)
            v = parent[v]
        outputs.append('\n'.join(reversed(path)))
print('\n\n'.join(outputs))
`,
  }),
  defineCpeLesson("a615", {
    topic: "sorting",
    level: "easy",
    concept: "往返覆蓋區間的距離下界",
    goal: "僅以最左和最右商店位置求最少步行距離。",
    explanation: [
      "所有商店都位於 [lo,hi]，其中 lo、hi 是最小與最大座標。任何從車出發又回到車的路線，為了拜訪兩端，區間中每段路至少要走兩次，所以總距離至少為 2(hi−lo)。",
      "把車停在 lo，走到 hi 並沿原路返回，沿途就拜訪全部商店，而且恰好達到下界。停在區間內其他位置也可達同樣距離，因此無須枚舉停車點或排序整份資料。每筆先讀 n，再掃 n 個位置，只有一家或所有位置相同時答案為 0。",
    ],
    complexity: "每筆 O(n) 時間，O(1) 額外空間。",
    pitfall: "需要回到車旁，不能只輸出最大座標減最小座標。",
    traceLabel: "示意：商店 7、14、30",
    trace: [
      {
        title: "取得兩端",
        description: "掃描後最小 7、最大 30。",
        cells: ["7", "14", "30"],
        active: [0, 2],
        variables: [
          ["lo", "7"],
          ["hi", "30"],
        ],
      },
      {
        title: "向右走訪",
        description: "從 7 走到 30，路程 23，途中經過 14。",
        cells: ["7→14:7", "14→30:16"],
        active: [0, 1],
        variables: [["去程", "23"]],
      },
      {
        title: "返回車旁",
        description: "再走 23 回到 7，總距離 46。",
        cells: ["23", "23"],
        active: [1],
        variables: [["答案", "46"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n, x;
        cin >> n >> x;
        int lo = x, hi = x;
        for (int i = 1; i < n; ++i) {
            cin >> x;
            lo = min(lo, x);
            hi = max(hi, x);
        }
        cout << 2 * (hi - lo) << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it)
    lo = hi = next(it)
    for _ in range(n - 1):
        x = next(it)
        lo = min(lo, x)
        hi = max(hi, x)
    print(2 * (hi - lo))
`,
  }),
  defineCpeLesson("a616", {
    topic: "graphs",
    level: "medium",
    concept: "相同關係的並查集合併",
    goal: "以連通分量數計算最多可能宗教數。",
    explanation: [
      "每對已知學生必須同宗教，相同關係又具傳遞性，因此同一連通分量中的所有學生都被迫同宗教。不同分量之間沒有資訊限制，讓每個分量信不同宗教便可得到最大值。",
      "以並查集維護分量，初始 n 個；每讀到配對，找出兩人的根，只有根不同時才合併並把分量數減一。路徑壓縮與按大小合併讓大量關係仍可快速處理，重複配對不會多減。讀到 0 0 停止，輸出 Case k: c。",
    ],
    complexity: "時間 O((n+m)α(n))，空間 O(n)。",
    pitfall: "不能以 n−m 當答案，環和重複關係不會減少分量數。",
    traceLabel: "示意：5 人，關係 (1,2)、(2,3)、(1,3)",
    trace: [
      {
        title: "第一個合併",
        description: "1、2 同宗教，分量由 5 降為 4。",
        cells: ["{1,2}", "{3}", "{4}", "{5}"],
        active: [0],
        variables: [["分量", "4"]],
      },
      {
        title: "傳遞關係",
        description: "合併 2、3，得到 {1,2,3}。",
        cells: ["{1,2,3}", "{4}", "{5}"],
        active: [0],
        variables: [["分量", "3"]],
      },
      {
        title: "冗餘關係",
        description: "1 與 3 已同根，不再減少，最多 3 種。",
        cells: ["{1,2,3}", "{4}", "{5}"],
        active: [0],
        variables: [["答案", "3"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;
int root(vector<int> &p, int x) {
    while (p[x] != x) {
        p[x] = p[p[x]];
        x = p[x];
    }
    return x;
}
int main() {
    int n, m, cs = 0;
    while (cin >> n >> m && (n || m)) {
        vector<int> p(n + 1), size(n + 1, 1);
        iota(p.begin(), p.end(), 0);
        int count = n;
        while (m--) {
            int a, b;
            cin >> a >> b;
            a = root(p, a);
            b = root(p, b);
            if (a == b)
                continue;
            if (size[a] < size[b])
                swap(a, b);
            p[b] = a;
            size[a] += size[b];
            --count;
        }
        cout << "Case " << ++cs << ": " << count << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
cs = 0
for n in it:
    m = next(it)
    if n == m == 0:
        break
    parent, size = list(range(n + 1)), [1] * (n + 1)

    def root(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    count = n
    for _ in range(m):
        a, b = root(next(it)), root(next(it))
        if a == b:
            continue
        if size[a] < size[b]:
            a, b = b, a
        parent[b] = a
        size[a] += size[b]
        count -= 1
    cs += 1
    print(f'Case {cs}: {count}')
`,
  }),
  defineCpeLesson("a617", {
    topic: "math",
    level: "medium",
    concept: "閏年累積公式與日期端點修正",
    goal: "不逐年枚舉，計算閉日期區間內的 2 月 29 日。",
    explanation: [
      "截至年份 y 的閏年數是 C(y)=⌊y/4⌋−⌊y/100⌋+⌊y/400⌋。先找可能包含閏日的首年 lo 與末年 hi：起日若晚於 2 月 29 日就把首年加一；迄日若早於 2 月 29 日就把末年減一。",
      "月份使用完整英文名稱轉成 1–12。起日為 February 29 時不排除，迄日為 February 29 時也包含，因此兩邊判斷嚴格度不同。若 lo>hi 答案為 0，否則 C(hi)−C(lo−1)。年份可達二十億，直接逐年檢查不可行；輸出 Case k: L。",
    ],
    complexity: "每筆時間、空間 O(1)。",
    pitfall: "1900 型百年不是閏年，2000 型四百年才是；逗號附在日期數字後。",
    traceLabel: "示意：2000/3/1 到 2004/2/29",
    trace: [
      {
        title: "修正首年",
        description: "2000 的閏日已過，lo=2001。",
        cells: ["2000 排除", "2001"],
        active: [1],
        variables: [["lo", "2001"]],
      },
      {
        title: "修正末年",
        description: "迄日正好為閏日，hi=2004 保留。",
        cells: ["2001", "2002", "2003", "2004"],
        active: [3],
        variables: [["hi", "2004"]],
      },
      {
        title: "累積相減",
        description: "C(2004)=486，C(2000)=485，差為 1。",
        cells: ["486", "485", "1"],
        active: [2],
        variables: [["答案", "1"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;
long long countLeap(long long y) {
    return y / 4 - y / 100 + y / 400;
}
int main() {
    vector<string> months = {"January", "February", "March",     "April",   "May",      "June",
                             "July",    "August",   "September", "October", "November", "December"};
    int t;
    cin >> t;
    for (int cs = 1; cs <= t; ++cs) {
        long long years[2];
        int mon[2], day[2];
        char comma;
        string name;
        for (int j = 0; j < 2; ++j) {
            cin >> name >> day[j] >> comma >> years[j];
            mon[j] = find(months.begin(), months.end(), name) - months.begin() + 1;
        }
        long long lo = years[0] + (mon[0] > 2),
                  hi = years[1] - (mon[1] < 2 || (mon[1] == 2 && day[1] < 29));
        cout << "Case " << cs << ": " << (lo > hi ? 0 : countLeap(hi) - countLeap(lo - 1)) << '\n';
    }
}`,
    python: String.raw`import sys

months = (
    'January February March April May June July August September October November December'.split()
)


def read_date():
    month, day, year = sys.stdin.readline().split()
    return int(year), months.index(month) + 1, int(day.rstrip(','))


def count(y):
    return y // 4 - y // 100 + y // 400


for cs in range(1, int(sys.stdin.readline()) + 1):
    y, m, d = read_date()
    lo = y + (m > 2)
    y, m, d = read_date()
    hi = y - (m < 2 or (m == 2 and d < 29))
    print(f'Case {cs}: {max(0, count(hi) - count(lo - 1))}')
`,
  }),
  defineCpeLesson("a618", {
    topic: "graphs",
    level: "hard",
    concept: "限制中途點的路徑搜尋",
    goal: "確認新版地圖保留舊地點，且每條舊路能只經新點細分。",
    explanation: [
      "先把舊圖所有端點形成舊地點集合 O，新圖所有端點形成 B。O 必須為 B 的子集；接著對每條舊邊 u−v，在新圖搜尋 u 到 v，但走訪時只允許起點、終點及不屬於 O 的新地點。其他舊點不能當作中途站。",
      "若每條舊邊都能以這種方式連通，便符合更詳細版本定義；不需要要求不同舊邊的替代路徑互不相交。可以用一次以 u 為起點的搜尋收集所有遇到的舊點，遇到舊點便不再往外展開。本程式為易讀採每邊 BFS。每張以 * * * 結束，END 只會出現在地圖名稱處；輸出必須保留兩張圖的名稱。",
    ],
    complexity:
      "舊圖U點e邊、新圖V點E邊。忽略名稱字元成本時，C++含建圖時間 O((U+V+e+E+e(V+E)) log(U+V+1))，空間 O(U+V+e+E)；名稱最長L時，時間與字串儲存上界再乘L。",
    pitfall: "普通連通性不足：經過其他舊地點的路徑不算合法細分。",
    traceLabel: "示意：舊邊 A−B、B−C；新邊 A−X、X−B、B−C",
    trace: [
      {
        title: "保留地點",
        description: "舊點 A、B、C 都仍存在；X 是新增地點。",
        cells: ["A", "B", "C", "X"],
        active: [0, 1, 2],
        variables: [
          ["舊點數", "3"],
          ["新點數", "1"],
        ],
      },
      {
        title: "驗證 A−B",
        description: "A→X→B 可達，中途只有新增 X。",
        cells: ["A", "X", "B"],
        active: [1],
        variables: [
          ["A−B", "通過"],
          ["已驗證邊數", "1"],
        ],
      },
      {
        title: "驗證 B−C",
        description: "直接邊 B−C 仍存在，所以新版合法。",
        cells: ["B", "C"],
        active: [0, 1],
        variables: [
          ["判定", "YES"],
          ["已驗證邊數", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <map>
#include <queue>
#include <set>
#include <string>
#include <vector>
using namespace std;
struct Map {
    string name;
    map<string, vector<string>> g;
    vector<pair<string, string>> edges;
};
Map readMap(string name) {
    Map a;
    a.name = name;
    string u, v, star;
    while (cin >> u) {
        if (u == "*") {
            cin >> v >> star;
            break;
        }
        cin >> v;
        a.g[u].push_back(v);
        a.g[v].push_back(u);
        a.edges.push_back({u, v});
    }
    return a;
}
int main() {
    string name;
    while (cin >> name && name != "END") {
        Map a = readMap(name);
        cin >> name;
        Map b = readMap(name);
        bool ok = true;
        for (auto &entry : a.g)
            if (!b.g.count(entry.first))
                ok = false;
        for (auto [start, goal] : a.edges) {
            if (!ok)
                break;
            queue<string> q;
            set<string> seen = {start};
            q.push(start);
            while (!q.empty()) {
                string u = q.front();
                q.pop();
                for (auto &v : b.g[u])
                    if (!seen.count(v)) {
                        seen.insert(v);
                        if (v == goal || !a.g.count(v))
                            q.push(v);
                    }
                if (seen.count(goal))
                    break;
            }
            if (!seen.count(goal))
                ok = false;
        }
        cout << (ok ? "YES: " : "NO: ") << b.name
             << (ok ? " is a more detailed version of " : " is not a more detailed version of ")
             << a.name << '\n';
    }
}`,
    python: String.raw`import sys
from collections import deque

lines = iter(line.strip() for line in sys.stdin if line.strip())


def read_map(name):
    graph, edges = {}, []
    for line in lines:
        if line == '* * *':
            break
        a, b = line.split()
        graph.setdefault(a, []).append(b)
        graph.setdefault(b, []).append(a)
        edges.append((a, b))
    return graph, edges


for name_a in lines:
    if name_a == 'END':
        break
    old, edges = read_map(name_a)
    name_b = next(lines)
    new, _ = read_map(name_b)
    ok = old.keys() <= new.keys()
    for start, goal in edges:
        if not ok:
            break
        seen, queue = {start}, deque([start])
        while queue and goal not in seen:
            u = queue.popleft()
            for v in new[u]:
                if v in seen:
                    continue
                seen.add(v)
                if v == goal or v not in old:
                    queue.append(v)
        ok = goal in seen
    print(
        f'YES: {name_b} is a more detailed version of {name_a}'
        if ok
        else f'NO: {name_b} is not a more detailed version of {name_a}'
    )
`,
  }),
  defineCpeLesson("a619", {
    topic: "dp",
    level: "medium",
    concept: "雙向 LIS 與對稱山形子序列",
    goal: "求每個峰頂左右能支撐的嚴格單調長度。",
    explanation: [
      "對每個位置 i，求以它結尾的嚴格遞增子序列長度 L[i]，再從右往左做同樣計算得到 R[i]，代表以 i 開頭往右嚴格遞減的最大長度。兩側都包含峰頂 i。",
      "Wavio 要求左右等長，所以峰頂 i 的最大長度是 2·min(L[i],R[i])−1，取所有峰頂最大值。LIS 用 tails 陣列與 lower_bound：tails[k] 保持長度 k+1 子序列的最小尾值，插入位置加一即該點的 LIS 長度。相等數字取代同一位置，不能增加長度。每筆 N 後可跨多行讀元素，至 EOF。",
    ],
    complexity: "時間 O(N log N)，空間 O(N)。",
    pitfall:
      "不能直接把左右長度相加，兩側必須等長；upper_bound 會錯把相等值視為可遞增。",
    traceLabel: "示意：1、2、3、2、1",
    trace: [
      {
        title: "由左計算",
        description: "各點遞增長度為 1、2、3、2、1。",
        cells: ["1", "2", "3", "2", "1"],
        active: [0, 1, 2],
        variables: [["L", "1,2,3,2,1"]],
      },
      {
        title: "由右計算",
        description: "由右向左遞增，轉回原索引仍是 1、2、3、2、1。",
        cells: ["1", "2", "3", "2", "1"],
        active: [2, 3, 4],
        variables: [["R", "1,2,3,2,1"]],
      },
      {
        title: "選峰頂",
        description: "中間 min(3,3)=3，因此長度 2×3−1=5。",
        cells: ["1", "2", "3", "2", "1"],
        active: [2],
        variables: [["答案", "5"]],
      },
    ],
    cpp: String.raw`#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n;
    while (cin >> n) {
        vector<int> a(n), left(n), right(n), tails;
        for (int &x : a)
            cin >> x;
        for (int i = 0; i < n; ++i) {
            int p = lower_bound(tails.begin(), tails.end(), a[i]) - tails.begin();
            left[i] = p + 1;
            if (p == (int)tails.size())
                tails.push_back(a[i]);
            else
                tails[p] = a[i];
        }
        tails.clear();
        for (int i = n - 1; i >= 0; --i) {
            int p = lower_bound(tails.begin(), tails.end(), a[i]) - tails.begin();
            right[i] = p + 1;
            if (p == (int)tails.size())
                tails.push_back(a[i]);
            else
                tails[p] = a[i];
        }
        int answer = 1;
        for (int i = 0; i < n; ++i)
            answer = max(answer, 2 * min(left[i], right[i]) - 1);
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left


def lengths(a):
    tails, out = [], []
    for x in a:
        p = bisect_left(tails, x)
        out.append(p + 1)
        if p == len(tails):
            tails.append(x)
        else:
            tails[p] = x
    return out


it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    a = [next(it) for _ in range(n)]
    left, right = lengths(a), lengths(a[::-1])[::-1]
    print(max(2 * min(l, r) - 1 for l, r in zip(left, right)))
`,
  }),
];
