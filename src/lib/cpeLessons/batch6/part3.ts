import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a812", {
    topic: "strings",
    level: "easy",
    concept: "反向比較與部分鏡射映射",
    goal: "獨立判斷一般迴文與鏡像性質，組合四種輸出。",
    explanation: [
      "一般迴文檢查 s[i]=s[n−1−i]。鏡像字串則檢查 mirror[s[i]]=s[n−1−i]，映射表只填題目列出的字元，雙向配對都要建立，例如 E→3 與 3→E。沒有映射的字元會讓鏡像性質失敗。",
      "兩個布林值必須獨立計算，因為鏡像字串不一定是一般迴文，例如 E3。中央字元也需檢查：奇數長度的中間字元必須能映射回自己。最後依兩個性質選四種固定文字，原字串照印，每筆後再輸出空白行。輸入只用 O 而不用 0，不需額外替換。",
    ],
    complexity: "每筆時間 O(n)，C++ 額外空間 O(1)，Python 反轉字串 O(n)。",
    pitfall: "映射表不是完整字母表；S、2 是互為鏡像，但 S 本身不對稱。",
    traceLabel: "示意：E3",
    trace: [
      {
        title: "一般迴文",
        description: "左 E 與右 3 不同，一般迴文失敗。",
        cells: ["E", "3"],
        active: [0, 1],
        variables: [["palindrome", "0"]],
      },
      {
        title: "鏡射左字元",
        description: "mirror(E)=3，恰等於右字元。",
        cells: ["E→3", "右:3"],
        active: [0, 1],
        variables: [["通過配對數", "1"]],
      },
      {
        title: "鏡射右字元",
        description: "mirror(3)=E，也符合，分類為 mirrored string。",
        cells: ["3→E", "左:E"],
        active: [0, 1],
        variables: [
          ["mirrored", "1"],
          ["palindrome", "0"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    string from = "AEHIJLMOSTUVWXYZ12358", to = "A3HILJMO2TUVWXY51SEZ8";
    char mirror[256] = {};
    for (int i = 0; i < int(from.size()); ++i)
        mirror[(unsigned char)from[i]] = to[i];
    string s;
    while (cin >> s) {
        bool pal = true, mir = true;
        for (int i = 0; i < int(s.size()); ++i) {
            char other = s[s.size() - 1 - i];
            if (s[i] != other)
                pal = false;
            if (mirror[(unsigned char)s[i]] != other)
                mir = false;
        }
        string kind = mir ? (pal ? "a mirrored palindrome" : "a mirrored string")
                          : (pal ? "a regular palindrome" : "not a palindrome");
        cout << s << " -- is " << kind << ".\n\n";
    }
}`,
    python: String.raw`import sys

mirror = dict(zip('AEHIJLMOSTUVWXYZ12358', 'A3HILJMO2TUVWXY51SEZ8'))
for s in sys.stdin.read().split():
    pal = s == s[::-1]
    mir = all(mirror.get(a) == b for a, b in zip(s, reversed(s)))
    if mir:
        kind = 'a mirrored palindrome' if pal else 'a mirrored string'
    else:
        kind = 'a regular palindrome' if pal else 'not a palindrome'
    print(f'{s} -- is {kind}.\n')
`,
  }),
  defineCpeLesson("a813", {
    topic: "basics",
    level: "easy",
    concept: "閉區間代入與整除測試",
    goal: "逐一檢查二次函數的 L+1 個值。",
    explanation: [
      "L 小於 1000，直接枚舉 x=0 到 L，計算 f(x)=ax²+bx+c 並檢查 f(x)%d 是否為 0 即可。每一個 x 對應一個函數值，即使不同 x 得到相同值也要各算一次，因為題目計算的是這串值中符合條件的項數。",
      "用 Horner 形式 (a×x+b)×x+c 可以減少乘法並維持整數計算。C++ 使用 long long 避免未來邊界擴充時的乘積溢位；負值的餘數符號在兩語言中不同，但『餘數等於 0』的判斷相同。五個輸入全 0 才停止，必須先判終止再做除法。",
    ],
    complexity: "每筆時間 O(L+1)，空間 O(1)。",
    pitfall: "範圍包含 0 與 L，共 L+1 項；不可對終止列的 d=0 取模。",
    traceLabel: "示意：f(x)=x²，d=3，L=2",
    trace: [
      {
        title: "x=0",
        description: "f(0)=0，可被 3 整除。",
        cells: ["0²=0", "0 mod 3=0"],
        active: [1],
        variables: [["count", "1"]],
      },
      {
        title: "x=1",
        description: "f(1)=1，餘數 1，不增加。",
        cells: ["1²=1", "1 mod 3=1"],
        active: [1],
        variables: [["count", "1"]],
      },
      {
        title: "x=2",
        description: "f(2)=4，餘數 1，答案仍是 1。",
        cells: ["2²=4", "4 mod 3=1"],
        active: [1],
        variables: [
          ["count", "1"],
          ["檢查項數", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long a, b, c, d, l;
    while (cin >> a >> b >> c >> d >> l) {
        if (a == 0 && b == 0 && c == 0 && d == 0 && l == 0)
            break;
        int count = 0;
        for (long long x = 0; x <= l; ++x)
            if (((a * x + b) * x + c) % d == 0)
                ++count;
        cout << count << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for a in it:
    b, c, d, l = next(it), next(it), next(it), next(it)
    if a == b == c == d == l == 0:
        break
    print(sum(((a * x + b) * x + c) % d == 0 for x in range(l + 1)))
`,
  }),
  defineCpeLesson("a814", {
    topic: "simulation",
    level: "easy",
    concept: "Luhn 的交錯倍增與數位和",
    goal: "保留前導零並驗證 16 位信用卡數字。",
    explanation: [
      "將四組各四位的字串串接成長度 16 的字串。從右側倒數第二位開始，每隔一位倍增；在固定長度 16 下，恰好是零基底索引 0、2、…、14。其餘索引原值加入。",
      "倍增值最多 18，數位和可直接算 value/10+value%10，也可在 value>9 時減 9。累加後只檢查總和%10==0，符合輸出 Valid，否則 Invalid。資料第一行是筆數，四段都要當字串讀取，否則 0012 會遺失兩個前導零。",
    ],
    complexity: "每筆固定 16 位，時間與空間 O(1)。",
    pitfall: "不是把乘積 18 當成 18 加入，而是加 1+8=9；倍增從倒數第二位開始。",
    traceLabel: "示意：0000 0000 0000 0018",
    trace: [
      {
        title: "讀入保留零",
        description: "最後兩位是 1、8，前十四位全為零。",
        cells: ["0000", "0000", "0000", "0018"],
        active: [3],
        variables: [["長度", "16"]],
      },
      {
        title: "倍增索引 14",
        description: "倒數第二位 1 倍增成 2，貢獻為 2。",
        cells: ["1×2=2", "末位8"],
        active: [0],
        variables: [["倍增總和", "2"]],
      },
      {
        title: "加入未倍增位",
        description: "2+8=10，個位數為 0，所以 Valid。",
        cells: ["2", "8", "10"],
        active: [2],
        variables: [["sum mod 10", "0"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        string s, part;
        for (int i = 0; i < 4; ++i) {
            cin >> part;
            s += part;
        }
        int sum = 0;
        for (int i = 0; i < 16; ++i) {
            int v = s[i] - '0';
            if (i % 2 == 0)
                v *= 2;
            sum += v / 10 + v % 10;
        }
        cout << (sum % 10 == 0 ? "Valid" : "Invalid") << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    s = ''.join(next(it) for _ in range(4))
    total = 0
    for i, ch in enumerate(s):
        value = int(ch) * (2 if i % 2 == 0 else 1)
        total += value // 10 + value % 10
    print('Valid' if total % 10 == 0 else 'Invalid')
`,
  }),
  defineCpeLesson("a815", {
    topic: "graphs",
    level: "hard",
    concept: "依街道排序的 Hierholzer 歐拉迴路",
    goal: "從指定住家出發，輸出字典序最小的全街道往返。",
    explanation: [
      "雙向圖存在歐拉迴路的必要條件是每個路口度數皆為偶數；題目已保證所有街道連通，因此也充分。自環在同一路口的鄰接表加入兩次，正確貢獻度數 2；平行街道以各自編號區分。起點固定為第一條輸入街道較小端點。",
      "每個鄰接表按街道編號升序排列，用 Hierholzer 取最小尚未使用邊，無邊可走時才把進入該點的街道加入反向答案，最後反轉。無法立即完成的分支會在回溯時拼接成子迴路；這種延後定稿保留最早可行的小編號前綴，得到字典序最小路線。以邊編號標記已用，不能以端點對標記；每個城市後都有空白行。",
    ],
    complexity: "E 條街道，時間 O(E log E)，空間 O(E+V)。",
    pitfall:
      "直接貪心印出走過的邊會卡在橋上；Hierholzer 必須於回溯收集再反轉。",
    traceLabel: "示意：三角形街道 1:(1,2)、2:(2,3)、3:(3,1)",
    trace: [
      {
        title: "從住家 1 出發",
        description: "1 與 3 之中先選街道 1，到路口 2。",
        cells: ["1→2 邊1", "2→3 邊2", "3→1 邊3"],
        active: [0],
        variables: [["已用邊", "1"]],
      },
      {
        title: "完成環",
        description: "再走邊 2、3 回到 1，所有邊已使用。",
        cells: ["1", "2", "3", "1"],
        active: [3],
        variables: [["已用邊", "3"]],
      },
      {
        title: "回溯反轉",
        description: "回溯收集 3、2、1，反轉後輸出 1 2 3。",
        cells: ["3,2,1", "1,2,3"],
        active: [1],
        variables: [["輸出邊數", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;
int main() {
    int x, y, z;
    while (cin >> x >> y && (x || y)) {
        int start = min(x, y), count = 0;
        vector<vector<pair<int, int>>> adj(45);
        do {
            cin >> z;
            adj[x].push_back({z, y});
            adj[y].push_back({z, x});
            ++count;
            cin >> x >> y;
        } while (x || y);
        bool ok = true;
        for (auto &a : adj) {
            if (a.size() % 2)
                ok = false;
            sort(a.begin(), a.end());
        }
        vector<bool> used(2000);
        vector<int> next(45), answer;
        vector<pair<int, int>> stack{{start, -1}};
        if (ok)
            while (!stack.empty()) {
                int u = stack.back().first;
                while (next[u] < int(adj[u].size()) && used[adj[u][next[u]].first])
                    ++next[u];
                if (next[u] == int(adj[u].size())) {
                    int edge = stack.back().second;
                    stack.pop_back();
                    if (edge != -1)
                        answer.push_back(edge);
                } else {
                    auto [edge, v] = adj[u][next[u]++];
                    used[edge] = true;
                    stack.push_back({v, edge});
                }
            }
        if (!ok || int(answer.size()) != count)
            cout << "Round trip does not exist.\n\n";
        else {
            reverse(answer.begin(), answer.end());
            for (int i = 0; i < count; ++i)
                cout << (i ? " " : "") << answer[i];
            cout << "\n\n";
        }
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for x in it:
    y = next(it)
    if x == y == 0:
        break
    start, count = min(x, y), 0
    adj = [[] for _ in range(45)]
    while x or y:
        edge = next(it)
        adj[x].append((edge, y))
        adj[y].append((edge, x))
        count += 1
        x, y = next(it), next(it)
    if any(len(a) % 2 for a in adj):
        print('Round trip does not exist.\n')
        continue
    for a in adj:
        a.sort(reverse=True)
    used, answer, stack = set(), [], [(start, -1)]
    while stack:
        u = stack[-1][0]
        while adj[u] and adj[u][-1][0] in used:
            adj[u].pop()
        if adj[u]:
            edge, v = adj[u].pop()
            used.add(edge)
            stack.append((v, edge))
        else:
            _, edge = stack.pop()
            if edge != -1:
                answer.append(edge)
    if len(answer) != count:
        print('Round trip does not exist.\n')
    else:
        print(*reversed(answer))
        print()
`,
  }),
  defineCpeLesson("a816", {
    topic: "simulation",
    level: "easy",
    concept: "空瓶數的批次守恆",
    goal: "每次整批兌換並回收剛喝完的空瓶。",
    explanation: [
      "起始空瓶數為 e+f。若目前有 empty 個空瓶，能一次兌換 q=empty//c 瓶，喝完後產生 q 個新空瓶，並留下 empty%c 個原本無法湊足的空瓶。因此更新為 empty=empty%c+q，答案累加 q。",
      "每輪至少換一瓶且 c>1，每喝一瓶都讓空瓶淨減少 c−1，所以過程必然停止。當 empty<c 時已無法再換，累計數就是最多喝到的數量，不涉及借瓶或其他來源。第一行是測試筆數，每筆只輸出整數答案。",
    ],
    complexity: "初始空瓶 E=e+f；批次迭代至多 O(log(E+1)) 輪，空間 O(1)。",
    pitfall: "兌換後不能只保留餘數，喝完的 q 個瓶子必須加回。",
    traceLabel: "示意：e=9、f=0、c=3",
    trace: [
      {
        title: "第一次兌換",
        description: "9 個空瓶換 3 瓶，喝完手上有 3 個空瓶。",
        cells: ["9", "3", "3"],
        active: [2],
        variables: [
          ["drinks", "3"],
          ["empty", "3"],
        ],
      },
      {
        title: "第二次兌換",
        description: "3 個空瓶換 1 瓶，喝完剩 1 個空瓶。",
        cells: ["3", "1", "1"],
        active: [2],
        variables: [
          ["drinks", "4"],
          ["empty", "1"],
        ],
      },
      {
        title: "不足停止",
        description: "1<3，無法再換，總共 4 瓶。",
        cells: ["1", "3", "4"],
        active: [2],
        variables: [["答案", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int t;
    cin >> t;
    while (t--) {
        int e, f, c;
        cin >> e >> f >> c;
        int empty = e + f, drinks = 0;
        while (empty >= c) {
            int q = empty / c;
            drinks += q;
            empty = empty % c + q;
        }
        cout << drinks << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    e, f, c = next(it), next(it), next(it)
    empty, drinks = e + f, 0
    while empty >= c:
        q, rem = divmod(empty, c)
        drinks += q
        empty = rem + q
    print(drinks)
`,
  }),
  defineCpeLesson("a817", {
    topic: "strings",
    level: "hard",
    concept: "遞迴下降剖析與帶符號任意精度整數",
    goal: "按優先順序精確求值，支援長乘法與快速乘方。",
    explanation: [
      "將文法分為 expression（加減）、term（乘法）、power（乘方）、number（十進位整數）。每層只呼叫更高優先級的層，再處理自己的運算子；辨認乘法時先排除 **。乘方採一般數學的右結合，因此 2**3**2 解為 2**(3**2)。本地與原 PDF 未明列結合方向，這是本教材採用的慣例。",
      "Python 使用任意精度 int 並自行剖析，無需 eval；C++17 以基底 10000 的小端陣列保存大小，另外保存正負號，實作絕對值比較、加減與直式乘法。乘方使用指數二分，每次依奇偶乘入答案、底數平方、指數除二。即使輸入全正，加減結果仍可能為負。完整輸出一行，不得加入 PDF 排版反斜線；結果位數未給上限，計算成本必須隨實際產出大小計。",
    ],
    complexity:
      "設最大中間位數 D、運算數 K、乘方指數 e；直式加減 O(D)、乘法 O(D²)，每個乘方 O(D² log e) 上界，空間 O(KD)。",
    pitfall:
      "不能使用浮點 pow；Python 需解除預設十進位轉換位數限制。規格沒有明確的乘方結合方向或輸出位數上限。",
    traceLabel: "示意：12*3+2**5-40",
    trace: [
      {
        title: "先算乘方",
        description: "2**5=32；快速乘方使用 5 的二進位 101。",
        cells: ["12*3", "32", "-40"],
        active: [1],
        variables: [
          ["指數", "5"],
          ["乘方值", "32"],
        ],
      },
      {
        title: "再算乘法",
        description: "12×3=36，留下加減式 36+32−40。",
        cells: ["36", "+32", "-40"],
        active: [0],
        variables: [["乘法值", "36"]],
      },
      {
        title: "由左到右加減",
        description: "36+32=68，再減 40 得 28。",
        cells: ["68", "40", "28"],
        active: [2],
        variables: [["答案", "28"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <sstream>
#include <algorithm>
#include <cctype>
using namespace std;
struct Big {
    static const int base = 10000;
    vector<int> a;
    int sign = 1;
    Big(int n = 0) {
        do {
            a.push_back(n % base);
            n /= base;
        } while (n);
    }
    Big(const string &s) {
        for (int end = int(s.size()); end > 0; end -= 4) {
            int begin = max(0, end - 4);
            a.push_back(stoi(s.substr(begin, end - begin)));
        }
        trim();
    }
    void trim() {
        while (a.size() > 1 && !a.back())
            a.pop_back();
        if (zero())
            sign = 1;
    }
    bool zero() const {
        return a.size() == 1 && a[0] == 0;
    }
    bool one() const {
        return a.size() == 1 && a[0] == 1 && sign == 1;
    }
    void half() {
        int carry = 0;
        for (int i = int(a.size()) - 1; i >= 0; --i) {
            int v = carry * base + a[i];
            a[i] = v / 2;
            carry = v % 2;
        }
        trim();
    }
    string str() const {
        ostringstream out;
        if (sign < 0)
            out << '-';
        out << a.back();
        for (int i = int(a.size()) - 2; i >= 0; --i)
            out << setw(4) << setfill('0') << a[i];
        return out.str();
    }
};
int compare(const Big &x, const Big &y) {
    if (x.a.size() != y.a.size())
        return x.a.size() < y.a.size() ? -1 : 1;
    for (int i = int(x.a.size()) - 1; i >= 0; --i)
        if (x.a[i] != y.a[i])
            return x.a[i] < y.a[i] ? -1 : 1;
    return 0;
}
Big operator+(Big x, Big y) {
    Big out;
    out.a.clear();
    if (x.sign == y.sign) {
        int carry = 0;
        for (size_t i = 0; i < max(x.a.size(), y.a.size()) || carry; ++i) {
            int v = carry + (i < x.a.size() ? x.a[i] : 0) + (i < y.a.size() ? y.a[i] : 0);
            out.a.push_back(v % Big::base);
            carry = v / Big::base;
        }
        out.sign = x.sign;
    } else {
        if (compare(x, y) < 0)
            swap(x, y);
        int borrow = 0;
        for (size_t i = 0; i < x.a.size(); ++i) {
            int v = x.a[i] - borrow - (i < y.a.size() ? y.a[i] : 0);
            borrow = v < 0;
            if (borrow)
                v += Big::base;
            out.a.push_back(v);
        }
        out.sign = x.sign;
    }
    out.trim();
    return out;
}
Big operator-(Big x, Big y) {
    if (!y.zero())
        y.sign = -y.sign;
    return x + y;
}
Big operator*(const Big &x, const Big &y) {
    Big out;
    out.a.assign(x.a.size() + y.a.size() + 1, 0);
    out.sign = x.sign * y.sign;
    for (size_t i = 0; i < x.a.size(); ++i) {
        long long carry = 0;
        for (size_t j = 0; j < y.a.size() || carry; ++j) {
            long long v = out.a[i + j] + carry + (j < y.a.size() ? 1LL * x.a[i] * y.a[j] : 0);
            out.a[i + j] = int(v % Big::base);
            carry = v / Big::base;
        }
    }
    out.trim();
    return out;
}
Big power(Big b, Big e) {
    Big result(1);
    if (b.one())
        return result;
    while (!e.zero()) {
        if (e.a[0] % 2)
            result = result * b;
        e.half();
        if (!e.zero())
            b = b * b;
    }
    return result;
}
struct Parser {
    string s;
    size_t p = 0;
    bool exponent() const {
        return s.compare(p, 2, "**") == 0;
    }
    Big number() {
        size_t begin = p;
        while (p < s.size() && isdigit(static_cast<unsigned char>(s[p])))
            ++p;
        return Big(s.substr(begin, p - begin));
    }
    Big factor() {
        Big b = number();
        if (exponent()) {
            p += 2;
            Big e = factor();
            return power(b, e);
        }
        return b;
    }
    Big term() {
        Big value = factor();
        while (p < s.size() && s[p] == '*' && !exponent()) {
            ++p;
            value = value * factor();
        }
        return value;
    }
    Big expression() {
        Big value = term();
        while (p < s.size()) {
            char op = s[p++];
            Big rhs = term();
            value = op == '+' ? value + rhs : value - rhs;
        }
        return value;
    }
};
int main() {
    string s;
    while (getline(cin, s))
        if (!s.empty()) {
            Parser parser{s};
            cout << parser.expression().str() << '\n';
        }
}`,
    python: String.raw`import sys

if hasattr(sys, 'set_int_max_str_digits'):
    sys.set_int_max_str_digits(0)


class Parser:
    def __init__(self, s):
        self.s, self.p = s, 0

    def factor(self):
        start = self.p
        while self.p < len(self.s) and self.s[self.p].isdigit():
            self.p += 1
        value = int(self.s[start : self.p])
        if self.s.startswith('**', self.p):
            self.p += 2
            exponent = self.factor()
            value = pow(value, exponent)
        return value

    def term(self):
        value = self.factor()
        while (
            self.p < len(self.s) and self.s[self.p] == '*' and not self.s.startswith('**', self.p)
        ):
            self.p += 1
            value *= self.factor()
        return value

    def expression(self):
        value = self.term()
        while self.p < len(self.s):
            op = self.s[self.p]
            self.p += 1
            rhs = self.term()
            value = value + rhs if op == '+' else value - rhs
        return value


for line in sys.stdin:
    if line.strip():
        print(Parser(line.strip()).expression())
`,
  }),
  defineCpeLesson("a818", {
    topic: "math",
    level: "easy",
    concept: "倍增上界與整數對數",
    goal: "推導恰好 N 行所需的最少貼上次數。",
    explanation: [
      "一次貼上最多複製目前全部敘述，因此 k 次貼上後不可能超過 2ᵏ 行。若要到 N 行，必須 2ᵏ≥N，這是次數的下界。從 1 開始持續倍增，找到第一個不小於 N 的值，就得到候選 k。",
      "此下界可達：在最後一次之前先倍增到 2ᵏ⁻¹，再只複製 N−2ᵏ⁻¹ 行，這個數不超過目前已有行數，故能恰好完成 N。N=1 不需任何貼上。用整數倍增避免 log2 在二次冪邊界的誤差；負數結束，輸出 Case X: Y。",
    ],
    complexity: "每筆時間 O(log N)，空間 O(1)。",
    pitfall: "目標必須恰好 N，但最後一次可只複製部分，不必是二次冪。",
    traceLabel: "示意：N=5",
    trace: [
      {
        title: "第一次",
        description: "由 1 行複製 1 行，得到 2 行。",
        cells: ["1", "+1", "2"],
        active: [2],
        variables: [["貼上次數", "1"]],
      },
      {
        title: "第二次",
        description: "由 2 行複製全部，得到 4 行。",
        cells: ["2", "+2", "4"],
        active: [2],
        variables: [["貼上次數", "2"]],
      },
      {
        title: "第三次",
        description: "只複製 1 行，就恰好得到 5；兩次最多 4 所以不能更少。",
        cells: ["4", "+1", "5"],
        active: [2],
        variables: [["最少次數", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int n, tc = 0;
    while (cin >> n && n >= 0) {
        int capacity = 1, count = 0;
        while (capacity < n) {
            capacity *= 2;
            ++count;
        }
        cout << "Case " << ++tc << ": " << count << '\n';
    }
}`,
    python: String.raw`import sys

tc = 0
for n in map(int, sys.stdin.buffer.read().split()):
    if n < 0:
        break
    capacity, count = 1, 0
    while capacity < n:
        capacity *= 2
        count += 1
    tc += 1
    print(f'Case {tc}: {count}')
`,
  }),
  defineCpeLesson("a819", {
    topic: "strings",
    level: "easy",
    concept: "固定長度區塊的原地反轉",
    goal: "保持分組順序，只反轉組內字元。",
    explanation: [
      "字串長度 n 保證是 G 的倍數，每組長度 k=n/G。第 j 組恰為索引 jk 到 (j+1)k−1 的連續區段，逐組將這段反轉即可。區間彼此不重疊且覆蓋整串，所以每個字元恰好參與一次反轉。",
      "C++ 的 reverse 使用半開區間 [start,start+k)，Python 可取切片再以 [::-1] 反轉後串接。不能反轉整個字串後再分組，因為那也會顛倒各組先後。G=0 只有一個欄位，遇到時立即結束，不再讀字串。",
    ],
    complexity: "每筆時間 O(n)，C++ 原地額外空間 O(1)，Python 結果 O(n)。",
    pitfall: "G 是組數，不是每組長度；尾端半開界線要用 start+k。",
    traceLabel: "示意：G=3，ABCDEF",
    trace: [
      {
        title: "切分",
        description: "長度 6，分成三組，每組長 2。",
        cells: ["AB", "CD", "EF"],
        active: [0, 1, 2],
        variables: [["k", "2"]],
      },
      {
        title: "前兩組",
        description: "AB→BA，CD→DC，組順序保持。",
        cells: ["BA", "DC", "EF"],
        active: [0, 1],
        variables: [["完成組數", "2"]],
      },
      {
        title: "最後一組",
        description: "EF→FE，串接為 BADCFE。",
        cells: ["BA", "DC", "FE"],
        active: [2],
        variables: [
          ["答案", "BADCFE"],
          ["長度", "6"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    int g;
    string s;
    while (cin >> g && g) {
        cin >> s;
        int k = int(s.size()) / g;
        for (int i = 0; i < int(s.size()); i += k)
            reverse(s.begin() + i, s.begin() + i + k);
        cout << s << '\n';
    }
}`,
    python: String.raw`import sys

it = iter(sys.stdin.read().split())
for token in it:
    g = int(token)
    if not g:
        break
    s = next(it)
    k = len(s) // g
    print(''.join(s[i : i + k][::-1] for i in range(0, len(s), k)))
`,
  }),
  defineCpeLesson("a820", {
    topic: "number-theory",
    level: "medium",
    concept: "負二進位的非負餘數",
    goal: "用 n=(−2)q+r，r∈{0,1} 反覆抽出位元。",
    explanation: [
      "一般進位轉換反覆取餘數，但 −2 為除數時，各語言的整除規則不同。先取 n 的奇偶作為合法位元 r：C++ 用 (n%2+2)%2，Python 用 n%2，保證 r 為 0 或 1。再以 q=(n−r)/(−2) 更新 n，因分子是偶數所以沒有截斷問題。",
      "每次都維持原值等於已取出的低位貢獻，加上剩餘商乘以相應的負二次方。持續到商為 0，再反轉位元便是答案；正負輸入都不需要負號。0 要特判成字串 0。輸出案例格式含井號：Case #x: representation。",
    ],
    complexity: "每筆時間與輸出空間 O(log(|n|+2))。",
    pitfall: "直接使用對 −2 的負餘數可能產生 −1 位元；不能額外在負數前印負號。",
    traceLabel: "示意：n=−3",
    trace: [
      {
        title: "第一位",
        description: "r=1，q=(−3−1)/(−2)=2。",
        cells: ["-3", "r=1", "q=2"],
        active: [1, 2],
        variables: [["低位字串", "1"]],
      },
      {
        title: "第二位",
        description: "2 的 r=0，q=−1。",
        cells: ["2", "r=0", "q=-1"],
        active: [1, 2],
        variables: [["低位字串", "10"]],
      },
      {
        title: "完成剩餘兩位",
        description:
          "−1 取 1 商 1，再取 1 商 0；反轉 1011 得 1101，值為 −8+4+1=−3。",
        cells: ["-1→1", "1→0", "1101"],
        active: [2],
        variables: [["驗算", "-3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        long long n;
        cin >> n;
        string s;
        if (!n)
            s = "0";
        while (n) {
            int r = int((n % 2 + 2) % 2);
            s += char('0' + r);
            n = (n - r) / -2;
        }
        reverse(s.begin(), s.end());
        cout << "Case #" << tc << ": " << s << '\n';
    }
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
for tc, n in enumerate(data[1 : 1 + data[0]], 1):
    digits = []
    while n:
        r = n % 2
        digits.append(str(r))
        n = (n - r) // -2
    print(f"Case #{tc}: {''.join(reversed(digits)) or '0'}")
`,
  }),
  defineCpeLesson("a821", {
    topic: "trees",
    level: "hard",
    concept: "補零葉節點的 R 元霍夫曼樹",
    goal: "依權重與字母平手規則建立指定的最短平均編碼。",
    explanation: [
      "完整 R 元樹每次合併會讓項目數減少 R−1，所以起始葉數必須滿足 (葉數−1)%(R−1)=0。補入最少零權重虛構字母即可，順序放在真字母之後。用最小堆按『權重、子樹最前字母』排序，每次取 R 個項目，依取出順序給 0 到 R−1。",
      "霍夫曼的交換論證指出，最小權重葉可以安排在最深層成為兄弟而不增加代價，合併後問題縮小，故反覆合併最小項目能最佳化加權碼長。程式保存各項目包含的葉，合併時把新數字加在每個既有碼的前方，等價於最後從根往下讀碼。合併項目保留最小字母索引處理平手；輸出只列真字母，平均值以整數分子做百分位四捨五入。",
    ],
    complexity:
      "補完 P 個葉、碼長 H；堆操作 O(P log P)，碼字前綴更新最壞 O(PH²)，空間 O(PH)。P 在本題很小。",
    pitfall:
      "只用權重排序不足以重現指定編碼；補入虛構字母的索引不能排在 A 之前。",
    traceLabel: "示意：R=3，A:1、B:1、C:2、D:4",
    trace: [
      {
        title: "補零",
        description: "4 葉不合 (P−1)%2=0，加入虛構葉 E:0 得 5 葉。",
        cells: ["E:0", "A:1", "B:1", "C:2", "D:4"],
        active: [0],
        variables: [["P", "5"]],
      },
      {
        title: "第一次合併",
        description: "E、A、B 分配 0、1、2，合併權重 2，最前字母 A。",
        cells: ["E:0", "A:1", "B:2", "合併:2"],
        active: [3],
        variables: [["剩餘項目", "3"]],
      },
      {
        title: "根合併",
        description:
          "合併項目 2 先於 C:2，再 D:4；A=01、B=02、C=1、D=2，平均 10/8=1.25。",
        cells: ["A:01", "B:02", "C:1", "D:2"],
        active: [0, 1, 2, 3],
        variables: [
          ["加權長度", "10"],
          ["平均", "1.25"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <tuple>
#include <functional>
#include <algorithm>
#include <iomanip>
using namespace std;
int main() {
    int r, n, tc = 0;
    while (cin >> r && r) {
        cin >> n;
        vector<int> freq(n);
        for (int &x : freq)
            cin >> x;
        int pad = (r - 1 - (n - 1) % (r - 1)) % (r - 1), p = n + pad;
        vector<vector<int>> leaves;
        vector<string> code(p);
        using Item = tuple<long long, int, int>;
        priority_queue<Item, vector<Item>, greater<Item>> heap;
        for (int i = 0; i < p; ++i) {
            leaves.push_back({i});
            heap.push({i < n ? freq[i] : 0, i, i});
        }
        while (heap.size() > 1) {
            long long sum = 0;
            int first = p;
            vector<int> group;
            for (int digit = 0; digit < r; ++digit) {
                auto [w, m, id] = heap.top();
                heap.pop();
                sum += w;
                first = min(first, m);
                for (int leaf : leaves[id]) {
                    code[leaf] = char('0' + digit) + code[leaf];
                    group.push_back(leaf);
                }
            }
            int id = int(leaves.size());
            leaves.push_back(group);
            heap.push({sum, first, id});
        }
        long long weighted = 0, total = 0;
        for (int i = 0; i < n; ++i) {
            weighted += 1LL * freq[i] * code[i].size();
            total += freq[i];
        }
        long long cents = (200 * weighted + total) / (2 * total);
        cout << "Set " << ++tc << "; average length " << cents / 100 << '.' << setw(2)
             << setfill('0') << cents % 100 << setfill(' ') << '\n';
        for (int i = 0; i < n; ++i)
            cout << "    " << char('A' + i) << ": " << code[i] << '\n';
        cout << '\n';
    }
}`,
    python: String.raw`import sys
import heapq

it = iter(map(int, sys.stdin.buffer.read().split()))
tc = 0
for r in it:
    if not r:
        break
    n = next(it)
    freq = [next(it) for _ in range(n)]
    pad = (-(n - 1)) % (r - 1)
    p = n + pad
    code = [''] * p
    heap = [(freq[i] if i < n else 0, i, [i]) for i in range(p)]
    heapq.heapify(heap)
    while len(heap) > 1:
        weight, first, group = 0, p, []
        for digit in range(r):
            w, m, leaves = heapq.heappop(heap)
            weight += w
            first = min(first, m)
            for leaf in leaves:
                code[leaf] = str(digit) + code[leaf]
            group.extend(leaves)
        heapq.heappush(heap, (weight, first, group))
    weighted = sum(f * len(c) for f, c in zip(freq, code))
    total = sum(freq)
    cents = (200 * weighted + total) // (2 * total)
    tc += 1
    print(f'Set {tc}; average length {cents // 100}.{cents % 100:02d}')
    for i in range(n):
        print(f'    {chr(65 + i)}: {code[i]}')
    print()
`,
  }),
  defineCpeLesson("a822", {
    topic: "dp",
    level: "easy",
    concept: "分性別的同步世代遞推",
    goal: "把不死神奇雌蜂納入每年的數量更新。",
    explanation: [
      "以 m 表示雄蜂數、f 表示包含神奇雌蜂的所有雌蜂數，起始為 m=0、f=1。下一年每隻舊雄蜂與舊雌蜂都生一隻雄蜂，因此 newM=m+f；普通雌蜂由每隻雄蜂各生一隻，再加存活的神奇雌蜂，故 newF=m+1。",
      "兩個新值都必須由舊值計算，再同步替換。重複 N 次就得到所求，輸出 m 與 m+f。N=0 是合法查詢，答案 0 1；只有 −1 結束。本地答案可能達到 2³²，C++ 不可用有號 32 位元整數，改用 long long。",
    ],
    complexity: "每筆時間 O(N)，空間 O(1)。",
    pitfall:
      "神奇雌蜂每年存活，但不能讓所有舊雌蜂都繼續存活；更新第二個值時不要用新 m。",
    traceLabel: "示意：前三年",
    trace: [
      {
        title: "第 1 年",
        description: "從 (m,f)=(0,1) 更新成 (1,1)，總數 2。",
        cells: ["雄1", "雌1"],
        active: [0, 1],
        variables: [
          ["N", "1"],
          ["總數", "2"],
        ],
      },
      {
        title: "第 2 年",
        description: "newM=1+1=2，newF=1+1=2。",
        cells: ["雄2", "雌2"],
        active: [0, 1],
        variables: [
          ["N", "2"],
          ["總數", "4"],
        ],
      },
      {
        title: "第 3 年",
        description: "newM=2+2=4，newF=2+1=3。",
        cells: ["雄4", "雌3"],
        active: [0, 1],
        variables: [
          ["N", "3"],
          ["總數", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int n;
    while (cin >> n && n != -1) {
        long long m = 0, f = 1;
        for (int i = 0; i < n; ++i) {
            long long nm = m + f, nf = m + 1;
            m = nm;
            f = nf;
        }
        cout << m << ' ' << m + f << '\n';
    }
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    if n == -1:
        break
    m, f = 0, 1
    for _ in range(n):
        m, f = m + f, m + 1
    print(m, m + f)
`,
  }),
  defineCpeLesson("a823", {
    topic: "number-theory",
    level: "easy",
    concept: "二進位轉換與一位元計數",
    goal: "同時得到不含前導零的表示與 1 的數量。",
    explanation: [
      "對正整數反覆取 n%2 作為最低位，再用 n/=2 移除該位；把取得的位元反轉便是二進位表示。同時將每個位元加到 count，就得到其中 1 的個數，而不是只保存奇偶。",
      "若使用內建格式轉換，也要對生成的二進位字串統計 1，兩者來源一致更容易驗證。輸出句子裡雖然寫 (mod 2)，P 仍然必須是完整的個數，例如 7 的二進位 111 要寫 3，不能寫 1。0 是結束標記，不輸出。",
    ],
    complexity: "每筆時間與字串空間 O(log I)。",
    pitfall: "P 不要真的取模；輸出句尾有句點，二進位不可有前導零。",
    traceLabel: "示意：I=10",
    trace: [
      {
        title: "最低位",
        description: "10%2=0，商 5，count=0。",
        cells: ["10", "0", "5"],
        active: [1],
        variables: [["count", "0"]],
      },
      {
        title: "接續位元",
        description: "5 取 1 商 2，再取 0 商 1，count=1。",
        cells: ["0", "1", "0"],
        active: [1, 2],
        variables: [["count", "1"]],
      },
      {
        title: "最高位",
        description: "1 取 1，反轉 0101 得 1010，共兩個 1。",
        cells: ["1010", "2"],
        active: [0, 1],
        variables: [["P", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    unsigned int n;
    while (cin >> n && n) {
        string b;
        int count = 0;
        while (n) {
            int bit = n % 2;
            count += bit;
            b += char('0' + bit);
            n /= 2;
        }
        reverse(b.begin(), b.end());
        cout << "The parity of " << b << " is " << count << " (mod 2).\n";
    }
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    if not n:
        break
    b = format(n, 'b')
    print(f"The parity of {b} is {b.count('1')} (mod 2).")
`,
  }),
  defineCpeLesson("a824", {
    topic: "strings",
    level: "easy",
    concept: "英文字母分詞、正規化與集合排序",
    goal: "從標點混雜的文章建立不分大小寫字典。",
    explanation: [
      "只有連續 A–Z 或 a–z 才是單字，任何其他字元都結束目前片段。掃描時把字母轉小寫加入 word，遇到分隔字元就把非空 word 放進集合並清空。這會把大小寫不同的同字合併，標點與數字都不會混進字典。",
      "C++ 可直接使用有序 set，同時去重與排序；Python 先以 [A-Za-z]+ 擷取英文片段，再對片段轉小寫、用 set 去重後 sorted 輸出。先分詞可避免全文 Unicode 小寫轉換把非英文字元變成 ASCII 字母。EOF 時還要提交最後一個單字，避免文章最後沒有換行而漏字。每行結束本身也是分隔字元，不能跨行把片段接成一詞。",
    ],
    complexity:
      "L 字元、W 個不同單字；分詞 O(L)，排序約 O(W log W) 次字串比較，空間 O(L) 上界。",
    pitfall:
      "不能只按空白 split，像 road. 的句點必須排除；don't 在本題會切成 don 與 t。",
    traceLabel: "示意：Cat, cat2DOG!",
    trace: [
      {
        title: "第一片段",
        description: "Cat 正規化成 cat，逗號結束單字。",
        cells: ["Cat", "cat"],
        active: [1],
        variables: [["不同單字數", "1"]],
      },
      {
        title: "重複詞",
        description: "cat2 中的 2 是分隔符；cat 已存在，不增加。",
        cells: ["cat", "2"],
        active: [0],
        variables: [["不同單字數", "1"]],
      },
      {
        title: "加入 dog",
        description: "DOG 變 dog，驚嘆號分隔；排序輸出 cat、dog。",
        cells: ["cat", "dog"],
        active: [0, 1],
        variables: [["不同單字數", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <set>
using namespace std;
int main() {
    set<string> words;
    string word;
    char ch;
    while (cin.get(ch)) {
        if (ch >= 'A' && ch <= 'Z')
            word += char(ch - 'A' + 'a');
        else if (ch >= 'a' && ch <= 'z')
            word += ch;
        else if (!word.empty()) {
            words.insert(word);
            word.clear();
        }
    }
    if (!word.empty())
        words.insert(word);
    for (const string &s : words)
        cout << s << '\n';
}`,
    python: String.raw`import sys
import re

words = {word.lower() for word in re.findall(r'[A-Za-z]+', sys.stdin.read())}
for word in sorted(words):
    print(word)
`,
  }),
  defineCpeLesson("a825", {
    topic: "simulation",
    level: "medium",
    concept: "先移除區域 1 的 Josephus 遞推",
    goal: "用存活者公式搜尋使區域 13 最後停電的最小步長。",
    explanation: [
      "區域 1 已經先停電，剩下依序為 2 到 N，共 N−1 個區域。將它們零基底編號為 0 到 N−2，區域 13 的索引是 11。對固定步長 m，Josephus 存活者用 survivor=0 起算，對 size=2 到 N−1 更新 survivor=(survivor+m)%size。",
      "這個遞推把第一個被刪掉的位置後方重新當成 0，再把較小圈的答案平移 m，因而等價於完整數數刪除。從 m=1 遞增，第一個使 survivor=11 的 m 就是最小答案。N=13 時 m=1 會逐一停掉 2 到 12，13 最後，公式同樣適用；N=0 結束。",
    ],
    complexity: "若答案為 M，每筆時間 O(MN)，額外空間 O(1)。",
    pitfall: "遞推的圈大小是 N−1，目標索引是 11，因為區域 1 已先移除。",
    traceLabel: "示意：N=13，m=1",
    trace: [
      {
        title: "先停區域 1",
        description: "剩餘 12 區，區域 13 對應索引 11。",
        cells: ["2→0", "3→1", "13→11"],
        active: [2],
        variables: [["圈大小", "12"]],
      },
      {
        title: "遞推到 size=3",
        description: "size=2 得 (0+1)%2=1；size=3 得 2。",
        cells: ["size1:0", "size2:1", "size3:2"],
        active: [2],
        variables: [
          ["m", "1"],
          ["survivor", "2"],
        ],
      },
      {
        title: "遞推到 size=12",
        description: "m=1 時始終 survivor=size−1，最後得到 11，對應區域 13。",
        cells: ["size12:11", "區域13"],
        active: [0, 1],
        variables: [["最小 m", "1"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int n;
    while (cin >> n && n) {
        int m = 1;
        for (;; ++m) {
            int survivor = 0;
            for (int size = 2; size <= n - 1; ++size)
                survivor = (survivor + m) % size;
            if (survivor == 11)
                break;
        }
        cout << m << '\n';
    }
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    m = 1
    while True:
        survivor = 0
        for size in range(2, n):
            survivor = (survivor + m) % size
        if survivor == 11:
            break
        m += 1
    print(m)
`,
  }),
  defineCpeLesson("a826", {
    topic: "number-theory",
    level: "easy",
    concept: "字元直方圖與頻率質數篩",
    goal: "依 ASCII 順序列出次數為質數的字元。",
    explanation: [
      "字串長度最多 2000，先篩出 0 到 2000 中哪些頻率是質數，特別把 0、1 設為非質數。每筆建立字元次數表，逐一計數；大小寫各佔不同位置，不可先轉小寫。",
      "最後按 ASCII 順序掃描字元，當 prime[count[ch]] 為真就加入答案。直接掃陣列或將符合條件的字元排序，都能滿足數字先於大寫、大寫先於小寫的順序。答案空字串時改輸出 empty，每筆標頭 Case k: 後恰有一個空白。",
    ],
    complexity:
      "預篩 O(U log log U)，U=2000；每筆 O(n+128) 時間，空間 O(U+128)。",
    pitfall: "出現一次不是質數；重複字元只輸出一次，輸出不加分隔符。",
    traceLabel: "示意：AABBBcccc",
    trace: [
      {
        title: "統計",
        description: "A 有 2 次，B 有 3 次，c 有 4 次。",
        cells: ["A:2", "B:3", "c:4"],
        active: [0, 1, 2],
        variables: [["字元總數", "9"]],
      },
      {
        title: "判斷質數",
        description: "2、3 是質數；4=2×2，不是質數。",
        cells: ["2:是", "3:是", "4:否"],
        active: [0, 1],
        variables: [["合格字元數", "2"]],
      },
      {
        title: "排序輸出",
        description: "A 的 ASCII 65 小於 B 的 66，輸出 AB。",
        cells: ["A:65", "B:66", "AB"],
        active: [2],
        variables: [["答案長度", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    vector<bool> prime(2001, true);
    prime[0] = prime[1] = false;
    for (int p = 2; p * p <= 2000; ++p)
        if (prime[p])
            for (int x = p * p; x <= 2000; x += p)
                prime[x] = false;
    int t;
    cin >> t;
    for (int tc = 1; tc <= t; ++tc) {
        string s, ans;
        cin >> s;
        int count[128] = {};
        for (unsigned char c : s)
            ++count[c];
        for (int c = 0; c < 128; ++c)
            if (prime[count[c]])
                ans += char(c);
        cout << "Case " << tc << ": " << (ans.empty() ? "empty" : ans) << '\n';
    }
}`,
    python: String.raw`import sys
from collections import Counter

prime = [True] * 2001
prime[0] = prime[1] = False
for p in range(2, 45):
    if prime[p]:
        for x in range(p * p, 2001, p):
            prime[x] = False
data = sys.stdin.read().split()
for tc, s in enumerate(data[1 : 1 + int(data[0])], 1):
    counts = Counter(s)
    ans = ''.join(sorted(c for c, n in counts.items() if prime[n]))
    print(f"Case {tc}: {ans or 'empty'}")
`,
  }),
  defineCpeLesson("a827", {
    topic: "math",
    level: "medium",
    concept: "十進位拆位與十個末位候選",
    goal: "由 N−⌊N/10⌋ 的值反推所有可能 N。",
    explanation: [
      "令 N=10q+r，其中 q 是刪除末位後的整數，0≤r≤9，且 N 至少兩位所以 q≥1。已知差值 D=N−q=9q+r。枚舉末位 r=0 到 9，只要 D−r 是 9 的倍數且 q=(D−r)/9≥1，就得到一個合法 N=10q+r。",
      "只需十個候選，與 D 大小無關。由 D=N−q 也可用 N=D+q 計算，最後排序輸出。當 D 是 9 的倍數時通常有兩解，分別對應 r=0 與 r=9，因此不能只輸出單一商。D 最大 10¹⁸，N 約 1.12×10¹⁸，仍在 signed long long 範圍內。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "兩解時必須升序；不可用浮點乘 10/9，會在 10¹⁸ 附近失去整數精度。",
    traceLabel: "示意：D=18",
    trace: [
      {
        title: "末位 0",
        description: "18−0=18=9×2，所以 q=2，N=20。",
        cells: ["r=0", "q=2", "N=20"],
        active: [2],
        variables: [["候選數", "1"]],
      },
      {
        title: "末位 9",
        description: "18−9=9=9×1，所以 q=1，N=19；其餘末位不整除。",
        cells: ["r=9", "q=1", "N=19"],
        active: [2],
        variables: [["候選數", "2"]],
      },
      {
        title: "排序驗算",
        description: "19−1=18，20−2=18，輸出 19 20。",
        cells: ["19", "20"],
        active: [0, 1],
        variables: [["共同差值", "18"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    long long d;
    while (cin >> d && d) {
        vector<long long> ans;
        for (int r = 0; r <= 9; ++r)
            if ((d - r) % 9 == 0 && (d - r) / 9 >= 1)
                ans.push_back(d + (d - r) / 9);
        sort(ans.begin(), ans.end());
        for (int i = 0; i < int(ans.size()); ++i)
            cout << (i ? " " : "") << ans[i];
        cout << '\n';
    }
}`,
    python: String.raw`import sys

for d in map(int, sys.stdin.buffer.read().split()):
    if not d:
        break
    ans = [d + (d - r) // 9 for r in range(10) if (d - r) % 9 == 0 and (d - r) // 9 >= 1]
    print(*sorted(ans))
`,
  }),
];
