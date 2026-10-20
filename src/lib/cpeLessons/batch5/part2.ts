import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a732", {
    topic: "dp",
    level: "medium",
    concept: "共用容量表的 0/1 背包",
    goal: "一次求出所有容量答案，再累加各家人的最佳價值。",
    explanation: [
      "每個人對每種商品最多拿一件，所以是 0/1 背包。令 dp[c] 為負重不超過 c 的最大價值，處理商品 (p,w) 時用 dp[c−w]+p 更新 dp[c]；容量由大到小，確保右側仍是未使用本商品的舊狀態。",
      "不同家人可以各自拿同一種商品，彼此獨立，故只須建一張容量 0 到 30 的表，再把每人的 dp[MW] 加起來。不能讓第一個人選走的商品從其他人的選項消失。依 T 處理各組，輸出一行整數總價值。",
    ],
    complexity: "每組時間 O(30N+G)，額外空間 O(30)。",
    pitfall: "容量正序會變成可重複取商品；家庭成員不共用商品限額。",
    traceLabel: "示意：商品 (6,2)、(10,3)，家人容量 3、5",
    trace: [
      {
        title: "第一商品",
        description: "容量 2 到 5 都可獲得 6。",
        cells: ["0", "0", "6", "6", "6", "6"],
        active: [2, 3, 4, 5],
        variables: [["商品數", "1"]],
      },
      {
        title: "第二商品",
        description: "容量 5 可合拿兩件，價值 16；容量 3 為 10。",
        cells: ["0", "0", "6", "10", "10", "16"],
        active: [3, 5],
        variables: [["dp[5]", "6+10=16"]],
      },
      {
        title: "家人獨立查表",
        description: "兩人最優值相加為 26。",
        cells: ["容量3→10", "容量5→16", "總計26"],
        active: [2],
        variables: [["答案", "26"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        int dp[31] = {};
        while (n--) {
            int p, w;
            cin >> p >> w;
            for (int c = 30; c >= w; --c)
                dp[c] = max(dp[c], dp[c - w] + p);
        }
        int g, total = 0;
        cin >> g;
        while (g--) {
            int c;
            cin >> c;
            total += dp[c];
        }
        cout << total << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    dp = [0] * 31
    for _ in range(next(it)):
        p, w = next(it), next(it)
        for c in range(30, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + p)
    g = next(it)
    print(sum(dp[next(it)] for _ in range(g)))
`,
  }),
  defineCpeLesson("a733", {
    topic: "strings",
    level: "hard",
    concept: "一元符號解析與優先序逐步化簡",
    goal: "每次只縮減一個二元運算，並列印完整等式。",
    explanation: [
      "去掉分隔空白後，以「讀整數、讀運算子、讀整數」交替掃描。期待整數時可先讀一個 + 或 − 作為一元符號；期待運算子時的 + 或 − 才是二元操作。因此 2*-3+-6-+4 能解析成數列 2,−3,−6,4 與操作 *,+,−。",
      "先找最左邊的乘除，若沒有才找最左邊加減；把相鄰兩個數縮成一個，刪除對應運算子，並輸出新等式。每次縮減都保留尚未計算的運算順序，直到只剩一數。使用整數運算，除法保證整除；輸出省略一元正號，題目之間留一空行，讀到 EOF。",
    ],
    complexity: "k 個運算子，時間 O(k²)，空間 O(k)，另計列印內容。",
    pitfall: "負號不一定是二元減法；不可直接求出最終答案而省略中間步驟。",
    traceLabel: "示意：2*−3+4=r",
    trace: [
      {
        title: "解析",
        description: "數字為 2、−3、4，優先運算是乘法。",
        cells: ["2", "*", "−3", "+", "4"],
        active: [0, 1, 2],
        variables: [["運算數", "2"]],
      },
      {
        title: "先乘",
        description: "2×(−3)=−6，得到 −6+4=r。",
        cells: ["−6", "+", "4"],
        active: [0],
        variables: [["運算數", "1"]],
      },
      {
        title: "再加",
        description: "−6+4=−2，得到 −2=r。",
        cells: ["−2", "=r"],
        active: [0],
        variables: [["運算數", "0"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <cctype>
using namespace std;
int main() {
    string line;
    bool first = true;
    while (getline(cin, line)) {
        string s;
        for (unsigned char c : line)
            if (!isspace(c))
                s += c;
        if (s.empty())
            continue;
        size_t eq = s.find('=');
        string lhs = s.substr(0, eq), name = s.substr(eq + 1);
        vector<long long> a;
        vector<char> op;
        size_t i = 0;
        while (i < lhs.size()) {
            int sign = 1;
            if (lhs[i] == '+' || lhs[i] == '-')
                sign = lhs[i++] == '-' ? -1 : 1;
            long long v = 0;
            while (i < lhs.size() && isdigit(lhs[i]))
                v = v * 10 + lhs[i++] - '0';
            a.push_back(sign * v);
            if (i < lhs.size())
                op.push_back(lhs[i++]);
        }
        if (!first)
            cout << '\n';
        first = false;
        auto show = [&]() {
            cout << a[0];
            for (size_t j = 0; j < op.size(); ++j)
                cout << ' ' << op[j] << ' ' << a[j + 1];
            cout << " = " << name << '\n';
        };
        show();
        while (!op.empty()) {
            size_t k = 0;
            while (k < op.size() && op[k] != '*' && op[k] != '/')
                ++k;
            if (k == op.size())
                k = 0;
            long long x = a[k], y = a[k + 1], v = 0;
            char c = op[k];
            if (c == '+')
                v = x + y;
            else if (c == '-')
                v = x - y;
            else if (c == '*')
                v = x * y;
            else
                v = x / y;
            a[k] = v;
            a.erase(a.begin() + k + 1);
            op.erase(op.begin() + k);
            show();
        }
    }
}`,
    python: String.raw`import sys, re

groups = []
for line in sys.stdin:
    s = ''.join(line.split())
    if not s:
        continue
    lhs, name = s.split('=')
    a = []
    op = []
    i = 0
    while i < len(lhs):
        match = re.match(r'[+-]?\d+', lhs[i:])
        a.append(int(match[0]))
        i += len(match[0])
        if i < len(lhs):
            op.append(lhs[i])
            i += 1

    def show():
        return str(a[0]) + ''.join(f' {c} {v}' for c, v in zip(op, a[1:])) + ' = ' + name

    out = [show()]
    while op:
        k = next((i for i, c in enumerate(op) if c in '*/'), 0)
        x, y, c = a[k], a[k + 1], op[k]
        if c == '+':
            v = x + y
        elif c == '-':
            v = x - y
        elif c == '*':
            v = x * y
        else:
            v = (abs(x) // abs(y)) * (-1 if (x < 0) != (y < 0) else 1)
        a[k : k + 2] = [v]
        del op[k]
        out.append(show())
    groups.append('\n'.join(out))
print('\n\n'.join(groups))
`,
  }),
  defineCpeLesson("a734", {
    topic: "strings",
    level: "hard",
    concept: "帶環狀狀態的密文驗證",
    goal: "逐段還原明文，同時檢查包裹字母順序。",
    explanation: [
      "先建立 ciph(L) 集合：其中的字母只能是三字母包裹段的中間，不能獨立解碼。若目前字元的下一字元屬於 ciph(L)，則目前位置必須開始三字母段；用 m 檢查開頭等於 L[m]、結尾等於 L[(m+1)%|L|]，再將中間字母反向位移 N 還原。L 和 ciph(L) 不相交，確保包裹首尾不會被錯認成中間字母。",
      "若沒有這個前瞻條件，就把目前字元視為單字元編碼，其反向位移後必須不屬於 L。注意 L 內字母本身也可能是其他一般字母的密文。任何驗證失敗便輸出 error in encryption。空白原樣複製且不重設 m；每一訊息行才重設 m=0。依訊息數逐行讀取，不同測試組間輸出空行。",
    ],
    complexity: "密文長 L，時間 O(L)，查表空間 O(26)，另計輸出。",
    pitfall: "只做凱撒反位移不夠，還要驗證包裹字母與環狀指標。",
    traceLabel: "示意：L=AB，N=2，密文 ACB",
    trace: [
      {
        title: "讀開頭 A",
        description: "A 屬於 L，且等於 L[0]，開始三字母段。",
        cells: ["A", "C", "B"],
        active: [0],
        variables: [["m", "0"]],
      },
      {
        title: "反解 C",
        description: "C 向前移 2 位得 A，A 屬於 L。",
        cells: ["C(2)", "−2", "A(0)"],
        active: [0, 2],
        variables: [["明文長度", "1"]],
      },
      {
        title: "檢查結尾 B",
        description: "B 等於 L[1]，段落合法，m 更新為 1。",
        cells: ["ACB", "→A"],
        active: [0, 1],
        variables: [["m", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <limits>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int cs = 0; cs < t; ++cs) {
        string key;
        int shift, n;
        cin >> key >> shift >> n;
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        if (cs)
            cout << '\n';
        while (n--) {
            string s, out;
            getline(cin, s);
            if (!s.empty() && s.back() == '\r')
                s.pop_back();
            size_t i = 0, m = 0;
            bool ok = true;
            auto decode = [&](char c) { return char('A' + (c - 'A' - shift + 26) % 26); };
            while (i < s.size()) {
                if (s[i] == ' ') {
                    out += ' ';
                    ++i;
                    continue;
                }
                if (i + 1 < s.size() && s[i + 1] >= 'A' && s[i + 1] <= 'Z' &&
                    key.find(decode(s[i + 1])) != string::npos) {
                    if (i + 2 >= s.size() || s[i] != key[m] || s[i + 1] < 'A' || s[i + 1] > 'Z' ||
                        s[i + 2] != key[(m + 1) % key.size()]) {
                        ok = false;
                        break;
                    }
                    char p = decode(s[i + 1]);
                    if (key.find(p) == string::npos) {
                        ok = false;
                        break;
                    }
                    out += p;
                    i += 3;
                    m = (m + 1) % key.size();
                } else {
                    char p = decode(s[i++]);
                    if (key.find(p) != string::npos) {
                        ok = false;
                        break;
                    }
                    out += p;
                }
            }
            cout << (ok ? out : "error in encryption") << '\n';
        }
    }
}`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
t = int(next(lines))
groups = []
for _ in range(t):
    key = next(lines)
    while not key:
        key = next(lines)
    shift = int(next(lines))
    n = int(next(lines))
    out = []

    def decode(c):
        return chr((ord(c) - 65 - shift) % 26 + 65)

    for _ in range(n):
        s = next(lines)
        i = m = 0
        text = []
        ok = True
        while i < len(s):
            if s[i] == ' ':
                text.append(' ')
                i += 1
                continue
            if i + 1 < len(s) and 'A' <= s[i + 1] <= 'Z' and decode(s[i + 1]) in key:
                if (
                    i + 2 >= len(s)
                    or s[i] != key[m]
                    or not 'A' <= s[i + 1] <= 'Z'
                    or s[i + 2] != key[(m + 1) % len(key)]
                ):
                    ok = False
                    break
                p = decode(s[i + 1])
                if p not in key:
                    ok = False
                    break
                text.append(p)
                i += 3
                m = (m + 1) % len(key)
            else:
                p = decode(s[i])
                i += 1
                if p in key:
                    ok = False
                    break
                text.append(p)
        out.append(''.join(text) if ok else 'error in encryption')
    groups.append('\n'.join(out))
print('\n\n'.join(groups))
`,
  }),
  defineCpeLesson("a735", {
    topic: "math",
    level: "medium",
    concept: "三角和的大小與奇偶條件",
    goal: "找出總和足夠大且差為偶數的最小正 n。",
    explanation: [
      "把全部數都取正，總和為 S=n(n+1)/2。把某些數改負會讓總和減少其總和的兩倍，因此要達到 |k| 必須 S≥|k| 且 S−|k| 為偶數。k 的正負只需整體翻轉所有符號，不影響 n。",
      "1 到 n 可以湊出 0 到 S 的每個整數子集合和，所以這兩個必要條件也充分。從 n=1 起逐項累加 S，第一個通過條件的 n 即最小答案。特別 k=0 時 n 必須正，因此答案是 3，不是 0。讀測試組數，組間輸出空行，累加使用 64 位整數。",
    ],
    complexity: "每題時間 O(√|k|+1)，空間 O(1)。",
    pitfall: "只檢查 S≥|k| 會忽略奇偶性；題目要求 n≥1。",
    traceLabel: "示意：k=2",
    trace: [
      {
        title: "n=1",
        description: "S=1 小於 2。",
        cells: ["1"],
        active: [0],
        variables: [
          ["S", "1"],
          ["差", "−1"],
        ],
      },
      {
        title: "n=2",
        description: "S=3 足夠，但差 1 是奇數。",
        cells: ["1", "2"],
        active: [1],
        variables: [
          ["S", "3"],
          ["差", "1"],
        ],
      },
      {
        title: "n=3",
        description: "S=6，差 4 可把 2 改負：1−2+3=2。",
        cells: ["+1", "−2", "+3"],
        active: [1],
        variables: [
          ["S", "6"],
          ["答案n", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <cstdlib>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int cs = 0; cs < t; ++cs) {
        long long k;
        cin >> k;
        k = llabs(k);
        long long n = 0, s = 0;
        do {
            s += ++n;
        } while (s < k || (s - k) % 2);
        if (cs)
            cout << '\n';
        cout << n << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
out = []
for _ in range(next(it)):
    k = abs(next(it))
    n = s = 0
    while True:
        n += 1
        s += n
        if s >= k and (s - k) % 2 == 0:
            break
    out.append(str(n))
print('\n\n'.join(out))
`,
  }),
  defineCpeLesson("a736", {
    topic: "simulation",
    level: "medium",
    concept: "時段規則查找與轉接環偵測",
    goal: "對每通電話追蹤當時有效的轉接鏈。",
    explanation: [
      "把規則依來源分機保存，時間當成題目所給的整數刻度，不是 hh:mm。對一通時間 t 的電話，從原分機開始，找出 start≤t≤start+duration 的規則並轉到目標，直到沒有有效規則。題目保證同一來源不會同時有兩個有效規則。",
      "每通電話各有自己的 visited 集合；若再次遇到已訪分機，代表沿確定性規則進入循環，最後由 9999 接聽，自我轉接也算循環。來源 0000 結束規則，時間 9000 結束來電；依系統輸出標題，時間和分機都補足四位數，最後印 END OF OUTPUT。",
    ],
    complexity: "每通最多檢查 O(R²) 的直接掃描上界，R≤100；空間 O(R)。",
    pitfall: "有效區間包含結束時刻；visited 不可跨來電共用。",
    traceLabel: "示意：t=150，1111→2222→1111 均有效",
    trace: [
      {
        title: "原始分機",
        description: "從 1111 開始並標記。",
        cells: ["1111", "2222"],
        active: [0],
        variables: [
          ["t", "150"],
          ["visited數", "1"],
        ],
      },
      {
        title: "第一次轉接",
        description: "1111 的有效規則轉至 2222。",
        cells: ["1111", "2222"],
        active: [1],
        variables: [["visited數", "2"]],
      },
      {
        title: "重訪 1111",
        description: "發現循環，最後響鈴分機改為 9999。",
        cells: ["1111", "2222", "9999"],
        active: [2],
        variables: [["rings", "9999"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <set>
#include <iomanip>
using namespace std;
struct Rule {
    int from, start, duration, to;
};
int main() {
    int systems;
    cin >> systems;
    cout << "CALL FORWARDING OUTPUT\n";
    for (int cs = 1; cs <= systems; ++cs) {
        vector<Rule> rules;
        int from;
        while (cin >> from && from) {
            Rule r;
            r.from = from;
            cin >> r.start >> r.duration >> r.to;
            rules.push_back(r);
        }
        cout << "SYSTEM " << cs << '\n';
        int t, original;
        while (cin >> t && t != 9000) {
            cin >> original;
            int cur = original;
            set<int> seen;
            while (true) {
                if (!seen.insert(cur).second) {
                    cur = 9999;
                    break;
                }
                int next = -1;
                for (auto r : rules)
                    if (r.from == cur && r.start <= t && t <= r.start + r.duration) {
                        next = r.to;
                        break;
                    }
                if (next < 0)
                    break;
                cur = next;
            }
            cout << setfill('0') << "AT " << setw(4) << t << " CALL TO " << setw(4) << original
                 << " RINGS " << setw(4) << cur << '\n'
                 << setfill(' ');
        }
    }
    cout << "END OF OUTPUT\n";
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
systems = next(it)
print('CALL FORWARDING OUTPUT')
for cs in range(1, systems + 1):
    rules = {}
    while True:
        source = next(it)
        if source == 0:
            break
        start, duration, target = next(it), next(it), next(it)
        rules.setdefault(source, []).append((start, start + duration, target))
    print(f'SYSTEM {cs}')
    while True:
        t = next(it)
        if t == 9000:
            break
        original = cur = next(it)
        seen = set()
        while True:
            if cur in seen:
                cur = 9999
                break
            seen.add(cur)
            target = next((b for s, e, b in rules.get(cur, []) if s <= t <= e), None)
            if target is None:
                break
            cur = target
        print(f'AT {t:04} CALL TO {original:04} RINGS {cur:04}')
print('END OF OUTPUT')
`,
  }),
  defineCpeLesson("a737", {
    topic: "math",
    level: "medium",
    concept: "十進位直式乘法與進位",
    goal: "以位數陣列計算最多 250 位整數的乘積。",
    explanation: [
      "把兩數由個位數起反向看待，a 的第 i 位和 b 的第 j 位相乘，貢獻會落在結果的第 i+j 位。先把全部位積累加到長度 |a|+|b| 的整數陣列，每格最大值不大，可安全使用一般 int。",
      "再由低位向高位處理進位：目前格除以 10 的商加到下一格，自己留下餘數。移除高位多餘零後反向輸出，但結果為零仍須保留一個 0。C++ 實作直式乘法；Python 可直接用任意精度 int。每兩個整數為一組，讀至 EOF，逐組輸出乘積。",
    ],
    complexity: "n、m 位數，時間 O(nm)，空間 O(n+m)。",
    pitfall: "不能用 long long 儲存原數，也不能把零乘積輸出成空字串。",
    traceLabel: "示意：12×13",
    trace: [
      {
        title: "位積累加",
        description: "低位陣列為 [2×3,1×3+2×1,1×1]。",
        cells: ["6", "5", "1"],
        active: [0, 1, 2],
        variables: [["未進位值", "156"]],
      },
      {
        title: "逐位正規化",
        description: "三格都小於 10，進位均為 0。",
        cells: ["個位6", "十位5", "百位1"],
        active: [0, 1, 2],
        variables: [["carry", "0"]],
      },
      {
        title: "反向輸出",
        description: "由百位到個位印出 156。",
        cells: ["1", "5", "6"],
        active: [0, 1, 2],
        variables: [["乘積", "156"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    string a, b;
    while (cin >> a >> b) {
        vector<int> v(a.size() + b.size());
        for (size_t i = 0; i < a.size(); ++i)
            for (size_t j = 0; j < b.size(); ++j)
                v[i + j] += (a[a.size() - 1 - i] - '0') * (b[b.size() - 1 - j] - '0');
        for (size_t i = 0; i + 1 < v.size(); ++i) {
            v[i + 1] += v[i] / 10;
            v[i] %= 10;
        }
        while (v.size() > 1 && v.back() == 0)
            v.pop_back();
        for (auto it = v.rbegin(); it != v.rend(); ++it)
            cout << *it;
        cout << '\n';
    }
}`,
    python: String.raw`import sys

data = sys.stdin.read().split()
for a, b in zip(data[::2], data[1::2]):
    print(int(a) * int(b))
`,
  }),
  defineCpeLesson("a738", {
    topic: "search",
    level: "hard",
    concept: "輪廓記憶搜尋與同類拼片去重",
    goal: "以唯一的下一空格固定拼片順序，精確計算矩形鋪排。",
    explanation: [
      "從下往上填滿板面，用每欄已填高度 profile 表示輪廓。找高度最低且最左的一欄 x，其下一空格在任何完整鋪法中，必定由一片左下角在該位置的矩形覆蓋。嘗試每個仍有庫存的尺寸及旋轉；只有跨越的欄高度都相同、且不超出邊界時才能放入，然後提高這些欄。",
      "同尺寸拼片只記剩餘數量，不能逐片編號；正方形只試一個方向，旋轉後相同的尺寸組先合併。以輪廓及各組剩餘數量為快取鍵，避免重算子問題，全部高度達 H 且庫存用完算 1 解。讀到 EOF。這是精確的指數級計數搜尋，題目只給板面上限而未限制狀態數，大面積且解法多時仍可能耗盡時間或記憶體；不能宣稱尺寸上限保證多項式效率。C++ 用十進位字串加法避免解數溢位。",
    ],
    complexity:
      "S 個可達輪廓／庫存狀態，每狀態 O(nW) 測試；空間 O(S(W+n))，另計大整數長度。S 最壞指數級。",
    pitfall: "不能把相同拼片的交換計為新解；滿板時也要確認全部庫存為零。",
    traceLabel: "示意：2×2 板，兩片 1×2，答案 2",
    trace: [
      {
        title: "空板",
        description: "兩欄高度都是 0，剩餘兩片。",
        cells: ["0", "0"],
        active: [0],
        variables: [["庫存", "2"]],
      },
      {
        title: "第一分支直放",
        description: "先填左欄到 2，再直放右欄得到一解。",
        cells: ["2", "0"],
        active: [0],
        variables: [
          ["庫存", "1"],
          ["此分支解數", "1"],
        ],
      },
      {
        title: "第二分支橫放",
        description: "兩欄先升到 1，再橫放一片，得到另一解。",
        cells: ["1→2", "1→2"],
        active: [0, 1],
        variables: [["總解數", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
#include <functional>
using namespace std;
string add(string a, const string &b) {
    int i = int(a.size()) - 1, j = int(b.size()) - 1, carry = 0;
    string out;
    while (i >= 0 || j >= 0 || carry) {
        int v = carry;
        if (i >= 0)
            v += a[i--] - '0';
        if (j >= 0)
            v += b[j--] - '0';
        out += char('0' + v % 10);
        carry = v / 10;
    }
    reverse(out.begin(), out.end());
    return out;
}
int main() {
    int W, H, n;
    while (cin >> W >> H >> n) {
        if (W > H)
            swap(W, H);
        map<pair<int, int>, int> groups;
        while (n--) {
            int m, w, h;
            cin >> m >> w >> h;
            if (w > h)
                swap(w, h);
            groups[{w, h}] += m;
        }
        vector<pair<int, int>> dim;
        vector<int> left;
        for (auto [d, m] : groups) {
            dim.push_back(d);
            left.push_back(m);
        }
        vector<int> root(W, 0);
        root.insert(root.end(), left.begin(), left.end());
        map<vector<int>, string> memo;
        struct Frame {
            vector<int> key;
            size_t branch = 0;
            string sum = "0";
        };
        vector<Frame> stack;
        stack.push_back({root});
        auto finish = [&](string value) {
            memo[stack.back().key] = value;
            stack.pop_back();
            if (!stack.empty())
                stack.back().sum = add(stack.back().sum, value);
        };
        // Explicit DFS frames avoid a call stack as deep as 10000 unit tiles.
        while (!stack.empty()) {
            Frame &frame = stack.back();
            auto &key = frame.key;
            int x = min_element(key.begin(), key.begin() + W) - key.begin(), y = key[x];
            if (y == H) {
                bool empty = true;
                for (size_t k = 0; k < dim.size(); ++k)
                    if (key[W + k])
                        empty = false;
                finish(empty ? "1" : "0");
                continue;
            }
            bool descended = false;
            while (frame.branch < 2 * dim.size()) {
                size_t option = frame.branch++, k = option / 2;
                int turn = option % 2;
                auto [a, b] = dim[k];
                if (!key[W + k] || (turn && a == b))
                    continue;
                int w = turn ? b : a, h = turn ? a : b;
                if (x + w > W || y + h > H)
                    continue;
                bool ok = true;
                for (int c = x; c < x + w; ++c)
                    if (key[c] != y)
                        ok = false;
                if (!ok)
                    continue;
                vector<int> child = key;
                --child[W + k];
                for (int c = x; c < x + w; ++c)
                    child[c] += h;
                auto hit = memo.find(child);
                if (hit != memo.end())
                    frame.sum = add(frame.sum, hit->second);
                else {
                    stack.push_back({child});
                    descended = true;
                    break;
                }
            }
            if (!descended)
                finish(frame.sum);
        }
        cout << memo[root] << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for token in it:
    W, H, n = token, next(it), next(it)
    W, H = min(W, H), max(W, H)
    groups = {}
    for _ in range(n):
        count, a, b = next(it), next(it), next(it)
        d = (min(a, b), max(a, b))
        groups[d] = groups.get(d, 0) + count
    dims = list(groups)
    root = (0,) * W + tuple(groups.values())
    memo = {}
    # Each frame stores state, next orientation to try, and accumulated count.
    stack = [[root, 0, 0]]

    def finish(value):
        state = stack.pop()[0]
        memo[state] = value
        if stack:
            stack[-1][2] += value

    while stack:
        state, option, total = stack[-1]
        profile = state[:W]
        y = min(profile)
        x = profile.index(y)
        if y == H:
            finish(int(not any(state[W:])))
            continue
        if option == 2 * len(dims):
            finish(total)
            continue
        stack[-1][1] += 1
        k, turn = divmod(option, 2)
        a, b = dims[k]
        if not state[W + k] or (turn and a == b):
            continue
        w, h = (b, a) if turn else (a, b)
        if x + w > W or y + h > H or any(v != y for v in profile[x : x + w]):
            continue
        child = list(state)
        child[W + k] -= 1
        child[x : x + w] = [y + h] * w
        child = tuple(child)
        if child in memo:
            stack[-1][2] += memo[child]
        else:
            stack.append([child, 0, 0])
    print(memo[root])
`,
  }),
  defineCpeLesson("a739", {
    topic: "search",
    level: "easy",
    concept: "嚴格超過目標的三角數",
    goal: "找到最小 T_n>s，利用差值求漏頁。",
    explanation: [
      "若全書 n 頁，完整頁碼和為 T_n=n(n+1)/2，漏掉頁碼 p 後得到 s=T_n−p，且 1≤p≤n。因此必須 T_n>s，並且前一個三角數 T_{n−1}≤s。這正好把 n 唯一定位為第一個嚴格大於 s 的三角數索引。",
      "用二分搜尋找 n，再輸出 p=T_n−s 與 n。即使 s 本身是三角數，也要前往下一本頁數較多的書，例如 s=3 由 n=3 漏掉 3。讀到 0 停止，乘法使用 long long。",
    ],
    complexity: "每題時間 O(log s)，空間 O(1)。",
    pitfall: "要找 >s 而不是 ≥s，否則會得到不存在的第 0 頁。",
    traceLabel: "示意：s=5",
    trace: [
      {
        title: "檢查 n=2",
        description: "T2=3，不足以扣掉正頁碼後得到 5。",
        cells: ["1", "2", "T2=3"],
        active: [2],
        variables: [["s", "5"]],
      },
      {
        title: "檢查 n=3",
        description: "T3=6，首次超過 5。",
        cells: ["1", "2", "3", "T3=6"],
        active: [3],
        variables: [["n", "3"]],
      },
      {
        title: "相減求漏頁",
        description: "6−5=1，所以漏第 1 頁、全書 3 頁。",
        cells: ["6", "−5", "1 3"],
        active: [2],
        variables: [["p", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long s;
    while (cin >> s && s) {
        long long lo = 1, hi = 2;
        while (hi * (hi + 1) / 2 <= s)
            hi *= 2;
        while (lo < hi) {
            long long m = (lo + hi) / 2;
            if (m * (m + 1) / 2 > s)
                hi = m;
            else
                lo = m + 1;
        }
        cout << lo * (lo + 1) / 2 - s << ' ' << lo << '\n';
    }
}`,
    python: String.raw`import sys

for s in map(int, sys.stdin.buffer.read().split()):
    if s == 0:
        break
    lo, hi = 1, 2
    while hi * (hi + 1) // 2 <= s:
        hi *= 2
    while lo < hi:
        m = (lo + hi) // 2
        if m * (m + 1) // 2 > s:
            hi = m
        else:
            lo = m + 1
    print(lo * (lo + 1) // 2 - s, lo)
`,
  }),
  defineCpeLesson("a740", {
    topic: "number-theory",
    level: "easy",
    concept: "N 進位在模 N−1 下的數字和",
    goal: "由最大位值和位數總和直接檢查候選進位。",
    explanation: [
      "N≡1 (mod N−1)，所以任意位數的 N 進位整數，模 N−1 的結果都等於各位數值之和。先將 0–9、A–Z、a–z 依序解成 0–61；正負號不算數字，整數正負也不影響是否整除。",
      "可用進位至少是 max(2,最大位值+1)。從這裡到 62 逐一測試數字和能否被 N−1 整除，第一個成功者就是最小解，全部失敗則印指定訊息。讀到 EOF，每個表示各印一行，不需要把整數完整轉成十進位。",
    ],
    complexity: "每筆時間 O(L+62)，空間 O(1)。",
    pitfall:
      "大小寫代表不同位值；只有整除條件還不夠，進位必須容納最大數字符號。",
    traceLabel: "示意：字串 12",
    trace: [
      {
        title: "計算位值",
        description: "數字和 1+2=3，最大位值為 2。",
        cells: ["1", "2"],
        active: [0, 1],
        variables: [
          ["sum", "3"],
          ["max", "2"],
        ],
      },
      {
        title: "測試 N=3",
        description: "3 mod 2=1，不符合。",
        cells: ["N=3", "N−1=2", "餘1"],
        active: [2],
        variables: [["可行", "0"]],
      },
      {
        title: "測試 N=4",
        description: "3 mod 3=0，最小進位為 4。",
        cells: ["N=4", "12(4)=6", "6/3=2"],
        active: [0, 2],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string s;
    while (cin >> s) {
        int sum = 0, mx = 0;
        for (char c : s) {
            int v;
            if (c >= '0' && c <= '9')
                v = c - '0';
            else if (c >= 'A' && c <= 'Z')
                v = c - 'A' + 10;
            else if (c >= 'a' && c <= 'z')
                v = c - 'a' + 36;
            else
                continue;
            sum += v;
            mx = max(mx, v);
        }
        int base = max(2, mx + 1);
        while (base <= 62 && sum % (base - 1))
            ++base;
        if (base <= 62)
            cout << base << '\n';
        else
            cout << "such number is impossible!\n";
    }
}`,
    python: String.raw`import sys

digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
for s in sys.stdin.read().split():
    values = [digits.index(c) for c in s if c in digits]
    total = sum(values)
    print(
        next(
            (str(b) for b in range(max(2, max(values, default=0) + 1), 63) if total % (b - 1) == 0),
            'such number is impossible!',
        )
    )
`,
  }),
  defineCpeLesson("a741", {
    topic: "simulation",
    level: "easy",
    concept: "中心對稱等價於一維反轉",
    goal: "同時檢查非負與旋轉 180 度不變。",
    explanation: [
      "將 N×N 矩陣依列攤平成長度 K=N² 的陣列。座標 (i,j) 對應位置 iN+j，旋轉後為 (N−1−i,N−1−j)，其位置恰好等於 K−1−(iN+j)，所以可直接比較陣列與反轉後的每個元素。",
      "另外每個數都必須非負；即使一對負數相等也不符合。本題數值可達 ±2³²，C++ 需 long long。讀取每組 N = n 標頭後仍須完整吃完全部元素，輸出 Test #t: Symmetric. 或 Non-symmetric.，保留連字號與句點。",
    ],
    complexity: "時間 O(N²)，空間 O(N²)。",
    pitfall: "檢查 M[i][j]=M[j][i] 是主對角線對稱，並非本題定義。",
    traceLabel: "示意：2×2 矩陣 [1,2;2,1]",
    trace: [
      {
        title: "攤平",
        description: "按列取得 1、2、2、1。",
        cells: ["1", "2", "2", "1"],
        active: [0, 1, 2, 3],
        variables: [["K", "4"]],
      },
      {
        title: "首尾配對",
        description: "位置 0 與 3 相等且非負。",
        cells: ["1", "2", "2", "1"],
        active: [0, 3],
        variables: [["檢查對數", "1"]],
      },
      {
        title: "中間配對",
        description: "位置 1 與 2 也相等且非負，符合定義。",
        cells: ["1", "2", "2", "1"],
        active: [1, 2],
        variables: [["對稱", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int cs = 1; cs <= t; ++cs) {
        char c, eq;
        int n;
        cin >> c >> eq >> n;
        vector<long long> a(n * n);
        for (auto &v : a)
            cin >> v;
        bool ok = true;
        for (size_t i = 0; i < a.size(); ++i)
            if (a[i] < 0 || a[i] != a[a.size() - 1 - i])
                ok = false;
        cout << "Test #" << cs << ": " << (ok ? "Symmetric." : "Non-symmetric.") << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for cs in range(1, int(next(it)) + 1):
    next(it)
    next(it)
    n = int(next(it))
    a = [int(next(it)) for _ in range(n * n)]
    ok = min(a) >= 0 and a == a[::-1]
    print(f'Test #{cs}: ' + ('Symmetric.' if ok else 'Non-symmetric.'))
`,
  }),
  defineCpeLesson("a742", {
    topic: "math",
    level: "easy",
    concept: "直線切割的增量計數",
    goal: "由第 n 刀最多新增 n 塊推導封閉公式。",
    explanation: [
      "第 n 條直線與先前 n−1 條線最多有 n−1 個不同交點，這些交點把新線切成最多 n 段，每一段穿過一個既有區塊並使總塊數增加 1，因此最多新增 n 塊。讓各線不平行且無三線共點，就能實現這個上界。",
      "從 0 刀的 1 塊起累加，答案為 1+1+2+…+N=1+N(N+1)/2。N 可達 210000000，乘積必須使用 64 位整數，不能先以 int 相乘。輸入直到任何負整數即結束；N=0 是合法資料，須輸出 1。",
    ],
    complexity: "每題時間 O(1)、空間 O(1)。",
    pitfall: "N=0 不是終止符；N(N+1) 在除以 2 前就可能溢位 32 位整數。",
    traceLabel: "示意：連續切三刀",
    trace: [
      {
        title: "第一刀",
        description: "新增 1 塊，共 2 塊。",
        cells: ["原1", "+1", "=2"],
        active: [2],
        variables: [["N", "1"]],
      },
      {
        title: "第二刀",
        description: "與第一刀相交，新增 2 塊，共 4 塊。",
        cells: ["原2", "+2", "=4"],
        active: [2],
        variables: [["N", "2"]],
      },
      {
        title: "第三刀",
        description: "與前兩線有不同交點，新增 3 塊，共 7 塊。",
        cells: ["原4", "+3", "=7"],
        active: [2],
        variables: [["N", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n && n >= 0)
        cout << 1 + n * (n + 1) / 2 << '\n';
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    if n < 0:
        break
    print(1 + n * (n + 1) // 2)
`,
  }),
  defineCpeLesson("a743", {
    topic: "search",
    level: "medium",
    concept: "受界限約束的分母枚舉",
    goal: "利用乘法關係只枚舉一個五位數。",
    explanation: [
      "設分母為 b，分子唯一決定為 a=N×b，所以不必列舉 10! 個數字排列。最小含不重複位數的五位分母為 01234，從 1234 枚舉到 floor(98765/N)，就涵蓋所有可能解。N 固定時 a 隨 b 遞增，答案自然符合分子排序。",
      "把 a、b 都視為固定五位，連前導零一共抽取十次數字，以布林表或位元遮罩拒絕任何重複。十位都不同便必定正好使用 0–9。輸出兩數補足五位；找不到解時印指定句子。讀到 N=0 停止，不同 N 之間印一空行。",
    ],
    complexity: "每題時間 O(10×98765/N)，額外空間 O(10)。",
    pitfall: "前導零也占用數字 0；不能只檢查通常十進位字串中看得到的位數。",
    traceLabel: "示意：N=62，b=01283",
    trace: [
      {
        title: "乘出分子",
        description: "1283×62=79546。",
        cells: ["01283", "×62", "79546"],
        active: [0, 2],
        variables: [["a", "79546"]],
      },
      {
        title: "檢查分母",
        description: "分母五位含 0、1、2、8、3，皆不同。",
        cells: ["0", "1", "2", "8", "3"],
        active: [0, 1, 2, 3, 4],
        variables: [["已用數字", "5"]],
      },
      {
        title: "檢查分子",
        description: "7、9、5、4、6 恰好補滿剩餘五數。",
        cells: ["7", "9", "5", "4", "6"],
        active: [0, 1, 2, 3, 4],
        variables: [["已用數字", "10"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    int n;
    bool first = true;
    while (cin >> n && n) {
        if (!first)
            cout << '\n';
        first = false;
        bool found = false;
        for (int b = 1234; b * n <= 98765; ++b) {
            int a = b * n, mask = 0;
            bool ok = true;
            for (int x : {a, b})
                for (int k = 0; k < 5; ++k) {
                    int d = x % 10;
                    x /= 10;
                    if (mask & (1 << d))
                        ok = false;
                    mask |= 1 << d;
                }
            if (ok) {
                found = true;
                cout << setfill('0') << setw(5) << a << " / " << setw(5) << b << setfill(' ')
                     << " = " << n << '\n';
            }
        }
        if (!found)
            cout << "There are no solutions for " << n << ".\n";
    }
}`,
    python: String.raw`import sys

groups = []
for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    out = []
    for b in range(1234, 98765 // n + 1):
        a = n * b
        if len(set(f'{a:05}{b:05}')) == 10:
            out.append(f'{a:05} / {b:05} = {n}')
    groups.append('\n'.join(out) if out else f'There are no solutions for {n}.')
print('\n\n'.join(groups))
`,
  }),
  defineCpeLesson("a744", {
    topic: "dp",
    level: "hard",
    concept: "凸成本分配空白與段落後綴 DP",
    goal: "同時決定換行與各間隔大小，使整段不美觀成本最小。",
    explanation: [
      "一行放 k≥2 個字，字元長總和為 L，空白總數必須為 n−L，分成 k−1 個正整數間隔。平方成本是凸函數，若兩間隔差至少 2，將較長的一格移給較短者會降低成本，因此最優間隔只相差 1；同成本時把較短間隔放前面。單字行成本依題目另算 0 或 500。",
      "令 dp[i] 為從第 i 字到段尾的最小成本，枚舉第一行結尾 j，取行成本加 dp[j+1]。先算完成本，再只對達到最小成本的第一行選項處理同分：把行內各間隔大小各編成一個位元組，接上已選的後綴簽章，直接比較整個序列，第一個差異較小者勝出。位元組存的是空白數，不是實際空白，故比較方向正確。總字元至多 10000，簽章總長上界約 5000 萬位元組；這個實作以明確的二次儲存換取簡單且精確的同分判斷。依空行分段、n=0 結束，每段後再印空行；包括最後一行也需要排版。",
    ],
    complexity:
      "N 字、寬 W≤80，成本 DP O(NW)；精確簽章重建最壞 O(N²W+NW²) 時間、O(N²+NW) 空間，位元組比較由語言內建完成。",
    pitfall:
      "最後一行也要對齊；不能使用一般單字換行的貪心，也不能將額外空白放在最前面。",
    traceLabel: "示意：寬 6，單字 a、b、cc",
    trace: [
      {
        title: "放入一行",
        description: "字元總長 4，兩個間隔共需 2 個空白。",
        cells: ["a(1)", "b(1)", "cc(2)"],
        active: [0, 1, 2],
        variables: [["空白總數", "2"]],
      },
      {
        title: "平均分配",
        description: "兩間隔都放 1，成本 0+0=0。",
        cells: ["a", "空白1", "b", "空白1", "cc"],
        active: [1, 3],
        variables: [["成本", "0"]],
      },
      {
        title: "選最小成本",
        description: "拆出任何短單字行至少付 500，故輸出 a b cc。",
        cells: ["長度6", "成本0", "dp[0]=0"],
        active: [2],
        variables: [["行數", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <functional>
#include <algorithm>
using namespace std;
int main() {
    int width;
    string line;
    while (cin >> width && width) {
        getline(cin, line);
        vector<string> w;
        while (getline(cin, line)) {
            if (!line.empty() && line.back() == '\r')
                line.pop_back();
            if (line.empty())
                break;
            istringstream in(line);
            string s;
            while (in >> s)
                w.push_back(s);
        }
        int n = w.size();
        vector<int> dp(n + 1), finish(n);
        vector<vector<int>> gaps(n);
        vector<string> signature(n + 1);
        // First compute costs alone. Build spacing signatures only for optimal lines.
        for (int i = n - 1; i >= 0; --i) {
            dp[i] = 100000000;
            int length = 0;
            for (int j = i; j < n; ++j) {
                length += w[j].size();
                int count = j - i;
                if (length + count > width)
                    break;
                int cost;
                if (!count)
                    cost = length == width ? 0 : 500;
                else {
                    int q = (width - length) / count, r = (width - length) % count;
                    cost = (count - r) * (q - 1) * (q - 1) + r * q * q;
                }
                dp[i] = min(dp[i], cost + dp[j + 1]);
            }
        }
        for (int i = n - 1; i >= 0; --i) {
            bool selected = false;
            int length = 0;
            for (int j = i; j < n; ++j) {
                length += w[j].size();
                int count = j - i;
                if (length + count > width)
                    break;
                vector<int> gap;
                int cost;
                if (!count)
                    cost = length == width ? 0 : 500;
                else {
                    int spaces = width - length, q = spaces / count, r = spaces % count;
                    gap.assign(count, q);
                    for (int z = count - r; z < count; ++z)
                        ++gap[z];
                    cost = (count - r) * (q - 1) * (q - 1) + r * q * q;
                }
                if (cost + dp[j + 1] != dp[i])
                    continue;
                string candidate;
                for (int value : gap)
                    candidate += char(value);
                candidate += signature[j + 1];
                if (!selected || candidate < signature[i]) {
                    selected = true;
                    signature[i] = candidate;
                    finish[i] = j;
                    gaps[i] = gap;
                }
            }
        }
        for (int i = 0; i < n;) {
            int j = finish[i];
            cout << w[i];
            for (int k = i + 1; k <= j; ++k)
                cout << string(gaps[i][k - i - 1], ' ') << w[k];
            cout << '\n';
            i = j + 1;
        }
        cout << '\n';
    }
}`,
    python: String.raw`import sys

lines = iter(sys.stdin.read().splitlines())
for line in lines:
    if not line:
        continue
    width = int(line)
    if width == 0:
        break
    words = []
    for line in lines:
        if line == '':
            break
        words.extend(line.split())
    n = len(words)
    dp = [0] * (n + 1)
    signatures = [b''] * (n + 1)
    finish = [0] * n
    gaps = [[] for _ in words]
    # Costs are independent of the lexicographic tie-break.
    for i in range(n - 1, -1, -1):
        dp[i] = 10**9
        length = 0
        for j in range(i, n):
            length += len(words[j])
            count = j - i
            if length + count > width:
                break
            if count == 0:
                cost = 0 if length == width else 500
            else:
                q, r = divmod(width - length, count)
                cost = (count - r) * (q - 1) ** 2 + r * q * q
            dp[i] = min(dp[i], cost + dp[j + 1])
    for i in range(n - 1, -1, -1):
        selected = False
        length = 0
        for j in range(i, n):
            length += len(words[j])
            count = j - i
            if length + count > width:
                break
            if count == 0:
                gap = []
                cost = 0 if length == width else 500
            else:
                q, r = divmod(width - length, count)
                gap = [q] * (count - r) + [q + 1] * r
                cost = (count - r) * (q - 1) ** 2 + r * q * q
            total = cost + dp[j + 1]
            if total != dp[i]:
                continue
            candidate = bytes(gap) + signatures[j + 1]
            if not selected or candidate < signatures[i]:
                selected = True
                signatures[i], finish[i], gaps[i] = candidate, j, gap
    i = 0
    while i < n:
        j = finish[i]
        print(words[i] + ''.join(' ' * g + word for g, word in zip(gaps[i], words[i + 1 : j + 1])))
        i = j + 1
    print()
`,
  }),
  defineCpeLesson("a745", {
    topic: "trees",
    level: "medium",
    concept: "子樹內的球序號縮小",
    goal: "只追蹤目標球，不模擬先前所有球。",
    explanation: [
      "每個節點交替把球送左、右，因此進入該節點的第 I 顆球，I 為奇數時往左，且在左子樹中是第 (I+1)/2 顆；I 為偶數時往右，在右子樹中是第 I/2 顆。子樹開關的初始狀態也全部是 false，故同一規則能遞迴套用。",
      "從根編號 p=1 開始，每次依奇偶把 p 改為 2p 或 2p+1，同時更新子樹內 I。走 D−1 層就停在葉。依第一行筆數處理，最後 −1 只是整份資料的結束標記，不再當新題目讀取。",
    ],
    complexity: "每題時間 O(D)，額外空間 O(1)。",
    pitfall: "每層都必須更新 I；只用原始 I 的奇偶會走錯。",
    traceLabel: "示意：D=4，I=2",
    trace: [
      {
        title: "根節點",
        description: "第 2 顆往右，到 3；在右子樹成為第 1 顆。",
        cells: ["1", "3"],
        active: [1],
        variables: [
          ["I", "1"],
          ["深度", "2"],
        ],
      },
      {
        title: "第二層",
        description: "第 1 顆往左，到 6。",
        cells: ["3", "6"],
        active: [1],
        variables: [
          ["I", "1"],
          ["深度", "3"],
        ],
      },
      {
        title: "葉節點",
        description: "再往左到 12，已達深度 4。",
        cells: ["6", "12"],
        active: [1],
        variables: [["輸出", "12"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int d, i, p = 1;
        cin >> d >> i;
        for (int depth = 1; depth < d; ++depth) {
            if (i % 2) {
                p *= 2;
                i = (i + 1) / 2;
            } else {
                p = p * 2 + 1;
                i /= 2;
            }
        }
        cout << p << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    d, i = next(it), next(it)
    p = 1
    for _ in range(d - 1):
        if i % 2:
            p *= 2
            i = (i + 1) // 2
        else:
            p = p * 2 + 1
            i //= 2
    print(p)
`,
  }),
  defineCpeLesson("a746", {
    topic: "sorting",
    level: "easy",
    concept: "頻率與反向 ASCII 的雙鍵排序",
    goal: "對每行獨立統計並依題目順序列印。",
    explanation: [
      "字元範圍固定為 ASCII 32–127，以計數陣列記每個字元出現次數。只把次數大於零的字元列入排序，排序鍵是 (次數,−ASCII)，因此同次數時編碼較大者先印。",
      "輸入逐行讀至 EOF，行內空白本身是 ASCII 32，必須統計，只有換行與歸位不計。每行資料分別輸出 ASCII 值及次數，兩組之間插入空行；不能把全篇文字的次數合在一起。",
    ],
    complexity: "每行長 L，時間 O(L+128 log 128)，空間 O(128)。",
    pitfall: "次數相同要 ASCII 遞減，與一般字母統計常用的遞增順序相反。",
    traceLabel: "示意：AABBC",
    trace: [
      {
        title: "統計",
        description: "A 和 B 各 2 次，C 出現 1 次。",
        cells: ["65:2", "66:2", "67:1"],
        active: [0, 1, 2],
        variables: [["總字元", "5"]],
      },
      {
        title: "按次數",
        description: "C 次數最少，先輸出 67 1。",
        cells: ["67 1", "65 2", "66 2"],
        active: [0],
        variables: [["最小次數", "1"]],
      },
      {
        title: "同次數反編碼",
        description: "B 的 66 大於 A 的 65，因此 B 在前。",
        cells: ["67 1", "66 2", "65 2"],
        active: [1, 2],
        variables: [["同次數", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    string s;
    bool first = true;
    while (getline(cin, s)) {
        int f[256] = {};
        for (unsigned char c : s)
            if (c != '\r')
                ++f[c];
        vector<int> a;
        for (int i = 32; i <= 127; ++i)
            if (f[i])
                a.push_back(i);
        sort(a.begin(), a.end(), [&](int x, int y) { return f[x] != f[y] ? f[x] < f[y] : x > y; });
        if (!first)
            cout << '\n';
        first = false;
        for (int c : a)
            cout << c << ' ' << f[c] << '\n';
    }
}`,
    python: String.raw`import sys
from collections import Counter

groups = []
for line in sys.stdin.read().splitlines():
    f = Counter(map(ord, line))
    groups.append('\n'.join(f'{c} {f[c]}' for c in sorted(f, key=lambda c: (f[c], -c))))
sys.stdout.write('\n\n'.join(groups) + ('\n' if groups else ''))
`,
  }),
  defineCpeLesson("a747", {
    topic: "strings",
    level: "easy",
    concept: "字母重排的排序簽章",
    goal: "用排序後字串辨識異序詞並保持字典輸入順序。",
    explanation: [
      "兩個單字能以字母重排互換，等價於每個字母的數量完全相同，也等價於排序後的字串相同。先替字典每個詞計算簽章，查詢時只比較簽章，不需枚舉任何排列。",
      "把同簽章的字典單字依輸入順序存入列表，查詢可直接取整份列表。先印 Anagrams for: word，再由 1 開始編號，編號寬度為 3；沒有結果則印 No anagrams for: word。END 只結束當組查詢，測試組之間留一空行，字典詞本身也可成為答案。",
    ],
    complexity:
      "字長≤L，預處理 O(NL log L)，每查詢 O(L log L+輸出量)；空間 O(NL)。",
    pitfall: "答案按字典輸入順序，不要為了簽章而把輸出詞列表也排序。",
    traceLabel: "示意：字典 eat、tea、tan，查詢 ate",
    trace: [
      {
        title: "字典簽章",
        description: "eat、tea 都是 aet，tan 是 ant。",
        cells: ["eat→aet", "tea→aet", "tan→ant"],
        active: [0, 1],
        variables: [["字典數", "3"]],
      },
      {
        title: "查詢簽章",
        description: "ate 排序後也是 aet。",
        cells: ["ate", "aet"],
        active: [1],
        variables: [["符合數", "2"]],
      },
      {
        title: "依原順序列出",
        description: "先 eat 再 tea，編號 1、2。",
        cells: ["1) eat", "2) tea"],
        active: [0, 1],
        variables: [["輸出數", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <iomanip>
using namespace std;
string signature(string s) {
    sort(s.begin(), s.end());
    return s;
}
int main() {
    int t;
    cin >> t;
    for (int cs = 0; cs < t; ++cs) {
        int n;
        cin >> n;
        map<string, vector<string>> dict;
        string s;
        while (n--) {
            cin >> s;
            dict[signature(s)].push_back(s);
        }
        if (cs)
            cout << '\n';
        while (cin >> s && s != "END") {
            cout << "Anagrams for: " << s << '\n';
            auto &a = dict[signature(s)];
            if (a.empty())
                cout << "No anagrams for: " << s << '\n';
            else
                for (size_t i = 0; i < a.size(); ++i)
                    cout << setw(3) << i + 1 << ") " << a[i] << '\n';
        }
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
groups = []
for _ in range(int(next(it))):
    dictionary = {}
    for _ in range(int(next(it))):
        word = next(it)
        key = ''.join(sorted(word))
        dictionary.setdefault(key, []).append(word)
    out = []
    for word in it:
        if word == 'END':
            break
        out.append('Anagrams for: ' + word)
        matches = dictionary.get(''.join(sorted(word)), [])
        if not matches:
            out.append('No anagrams for: ' + word)
        for i, s in enumerate(matches, 1):
            out.append(f'{i:3}) {s}')
    groups.append('\n'.join(out))
print('\n\n'.join(groups))
`,
  }),
];
