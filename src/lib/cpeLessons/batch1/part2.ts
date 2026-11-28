import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a476", {
    topic: "math",
    level: "medium",
    concept: "f91的分段閉式",
    goal: "以歸納化簡巢狀遞迴，快速處理大量輸入。",
    explanation: [
      "N≥101時定義已給出N−10。N=100時，f91(100)=f91(f91(111))=f91(101)=91；對91到100，同樣可先讓內層落在直接計算區，再逐步得到91。接著由100往下做強歸納：若較大的輸入且不超過100皆回傳91，N≤90時內層f91(N+11)=91，外層f91(91)也等於91。",
      "因此所有1≤N≤100的結果都是91，其餘為N−10。最多25萬筆資料，直接套用分段公式能免去大量重複遞迴與堆疊成本。讀到0停止，保留原輸入作為輸出括號中的數值，格式精確為f91(N) = R。",
    ],
    complexity: "每筆時間 O(1)，額外空間 O(1)；Python緩存輸出為 O(T)。",
    pitfall: "臨界值100仍回傳91，101也回傳91；0是停止標記而非測試值。",
    traceLabel: "示意：化簡f91(99)",
    trace: [
      {
        title: "展開99",
        description: "99≤100，變成f91(f91(110))。",
        cells: ["99", "110", "外層待算"],
        active: [1],
        variables: [
          ["N", "99"],
          ["N+11", "110"],
        ],
      },
      {
        title: "計算內層",
        description: "110>100，內層等於100。",
        cells: ["f91(110)=100", "f91(100)"],
        active: [0],
        variables: [["內層值", "100"]],
      },
      {
        title: "完成外層",
        description: "f91(100)=f91(101)=91，原輸入99的答案為91。",
        cells: ["111→101", "101→91", "99→91"],
        active: [2],
        variables: [["結果", "91"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    while (cin >> n && n)
        cout << "f91(" << n << ") = " << (n <= 100 ? 91 : n - 10) << '\n';
}`,
    python: String.raw`import sys

out = []
for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    out.append(f'f91({n}) = {91 if n <= 100 else n - 10}')
sys.stdout.write('\n'.join(out) + ('\n' if out else ''))
`,
  }),
  defineCpeLesson("a477", {
    topic: "math",
    level: "easy",
    concept: "等加速度與中點速度",
    goal: "消去未知初速度與加速度，直接求兩倍時間位移。",
    explanation: [
      "設初速度u、加速度a，則t時的速度v=u+at。經過2t的位移為u(2t)+a(2t)²/2=2t(u+at)=2tv。因此即使不知道初速度與加速度，仍能從給定的中點速度計算總位移。",
      "也可理解成等加速度下，整段時間的平均速度正好是中點速度v。保留正負號，因為題目求的是位移，不是路程。t=0時公式自然得到0，不需要除以t。逐對讀取直到EOF，每筆輸出整數結果。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "不能額外假設初速度為0；負速度對應負位移，且0 0不是結束標記。",
    traceLabel: "示意：v=5、t=12",
    trace: [
      {
        title: "找時間中點",
        description: "總時間為24，中點時間12的速度是5。",
        cells: ["0秒", "12秒", "24秒"],
        active: [1],
        variables: [
          ["t", "12"],
          ["v", "5"],
        ],
      },
      {
        title: "化簡公式",
        description: "2t(u+at)中的括號就是5。",
        cells: ["2t=24", "u+at=5"],
        active: [0, 1],
        variables: [["平均速度", "5"]],
      },
      {
        title: "計算位移",
        description: "24×5=120。",
        cells: ["24", "×5", "120"],
        active: [2],
        variables: [["位移", "120"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long v, t;
    while (cin >> v >> t)
        cout << 2 * v * t << '\n';
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
for v, t in zip(data[::2], data[1::2]):
    print(2 * v * t)
`,
  }),
  defineCpeLesson("a478", {
    topic: "dp",
    level: "hard",
    concept: "位數、1的數量與餘數DP",
    goal: "不用列舉64位元整數，計數等量0、1且可整除K的數。",
    explanation: [
      "N為奇數時不可能平分0與1，K=0也依本地題意直接回傳0。其餘先固定最高位為1，設dp[j][r]是目前前綴使用j個1、除以K餘r的方案數。接上一位b後，新餘數為(2r+b)%K，新1數為j+b；相同狀態相加，因為未來只需知道這兩項資訊。",
      "逐位使用新陣列轉移，限制1的個數不超過N/2，並可略過已使用過多0的狀態。完成N位後取dp[N/2][0]。不能把前導0也計入，否則位數會錯。答案不取模，最多C(63,31)，64位元有號整數可容納；輸出Case p: answer，編號從1開始。",
    ],
    complexity: "每筆時間 O(N²K)，額外空間 O(NK)。",
    pitfall:
      "本題K=0答案為0，不可做除以0；64位元數值本身不用建立，只有計數需要64位元。",
    traceLabel: "示意：N=4、K=2，最高位固定1",
    trace: [
      {
        title: "一位前綴",
        description: "只有1，使用1個1，餘數1。",
        cells: ["1"],
        active: [0],
        variables: [
          ["長度", "1"],
          ["(ones,remainder)", "(1,1)"],
        ],
      },
      {
        title: "三位前綴",
        description: "可延伸成100、101、110；111已超過2個1。",
        cells: ["100:(1,0)", "101:(2,1)", "110:(2,0)"],
        active: [0, 1, 2],
        variables: [
          ["長度", "3"],
          ["候選數", "3"],
        ],
      },
      {
        title: "完成四位",
        description: "等量候選1001、1010、1100，其中後兩個餘數0。",
        cells: ["1001→1", "1010→0", "1100→0"],
        active: [1, 2],
        variables: [
          ["目標ones", "2"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
long long solve(int n, int k) {
    if (k == 0 || n % 2)
        return 0;
    int half = n / 2;
    vector<vector<long long>> dp(half + 1, vector<long long>(k));
    dp[1][1 % k] = 1;
    for (int len = 1; len < n; ++len) {
        vector<vector<long long>> next(half + 1, vector<long long>(k));
        for (int ones = 1; ones <= half; ++ones) {
            if (ones > len || len - ones > half)
                continue;
            for (int r = 0; r < k; ++r) {
                if (len - ones < half)
                    next[ones][2 * r % k] += dp[ones][r];
                if (ones < half)
                    next[ones + 1][(2 * r + 1) % k] += dp[ones][r];
            }
        }
        dp.swap(next);
    }
    return dp[half][0];
}
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n, k;
        cin >> n >> k;
        cout << "Case " << tc << ": " << solve(n, k) << '\n';
    }
}`,
    python: String.raw`import sys


def solve(n, k):
    if k == 0 or n % 2:
        return 0
    half = n // 2
    dp = [[0] * k for _ in range(half + 1)]
    dp[1][1 % k] = 1
    for length in range(1, n):
        nxt = [[0] * k for _ in range(half + 1)]
        for ones in range(max(1, length - half), min(half, length) + 1):
            for r, count in enumerate(dp[ones]):
                if length - ones < half:
                    nxt[ones][2 * r % k] += count
                if ones < half:
                    nxt[ones + 1][(2 * r + 1) % k] += count
        dp = nxt
    return dp[half][0]


data = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(data) + 1):
    print(f'Case {tc}: {solve(next(data), next(data))}')
`,
  }),
  defineCpeLesson("a479", {
    topic: "math",
    level: "medium",
    concept: "整除分塊",
    goal: "把相同商的連續索引合併計算。",
    explanation: [
      "當左端點為l，設q=floor(n/l)。所有取得相同商q的i會連續出現，最後一個是r=floor(n/q)。這整塊對總和的貢獻就是q×(r−l+1)，下一塊從r+1開始。每回合都完整跳過一段，不漏算也不重算。",
      "i≤√n時至多√n個索引，i>√n時商又只有至多√n種，所以總區塊數為O(√n)，可以處理32位元上界。n≤0依定義輸出0，不可沿用正數公式或當作停止符號。所有乘積和累加使用64位元，先讀測試筆數。",
    ],
    complexity: "每筆時間 O(√max(n,0))，空間 O(1)。",
    pitfall: "右端r用n/q，下一個左端是r+1；n=0或負數不能先計算商。",
    traceLabel: "示意：n=10的商區塊",
    trace: [
      {
        title: "前三塊",
        description: "i=1、2、3的商分別為10、5、3。",
        cells: ["1→10", "2→5", "3→3"],
        active: [0, 1, 2],
        variables: [
          ["累積", "18"],
          ["下一l", "4"],
        ],
      },
      {
        title: "商為2的區塊",
        description: "q=10/4取整為2，r=10/2=5，增加2×2=4。",
        cells: ["i=4", "i=5", "商2"],
        active: [0, 1],
        variables: [
          ["累積", "22"],
          ["下一l", "6"],
        ],
      },
      {
        title: "最後一塊",
        description: "i=6到10商均為1，增加5，答案27。",
        cells: ["6–10", "商1", "貢獻5"],
        active: [0, 2],
        variables: [
          ["累積", "27"],
          ["下一l", "11"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int T;
    cin >> T;
    while (T--) {
        long long n;
        cin >> n;
        long long answer = 0;
        for (long long l = 1; l <= n;) {
            long long q = n / l, r = n / q;
            answer += q * (r - l + 1);
            l = r + 1;
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
for n in data[1 : 1 + data[0]]:
    answer = 0
    left = 1
    while left <= n:
        q = n // left
        right = n // q
        answer += q * (right - left + 1)
        left = right + 1
    print(answer)
`,
  }),
  defineCpeLesson("a480", {
    topic: "combinatorics",
    level: "hard",
    concept: "指定固定點與容斥原理",
    goal: "只限制前M個位置，精確計算恰好K個固定點。",
    explanation: [
      "先從前M個位置選K個固定，方法數C(M,K)。刪除這些位置及相同值後，剩N−K個元素，其中還有M−K個位置禁止固定，其他位置完全不受限制。用容斥：再指定j個禁止位置卻固定的事件，剩餘排列為(N−K−j)!，故答案為C(M,K)×Σ[(-1)^j C(M−K,j)(N−K−j)!]。",
      "階乘與反階乘預處理到1000，用質數模數下的快速冪計算反元素，讓每個組合數O(1)。每筆只需M−K+1項，交替加減後將模數結果正規化為非負。M=0時答案是N!；K=M也不能強迫後N−M個位置錯排，因為題目沒有這個要求。輸出Case x: y。",
    ],
    complexity: "預處理 O(1000+log MOD)，每筆 O(M−K+1)，空間 O(1000)。",
    pitfall: "不是整體恰好K個固定點；第M+1到N的位置仍可固定。模乘需64位元。",
    traceLabel: "示意：N=5、M=3、K=2",
    trace: [
      {
        title: "選固定位置",
        description: "前3格選2格固定，有C(3,2)=3種。",
        cells: ["固定", "固定", "禁止固定", "自由", "自由"],
        active: [0, 1],
        variables: [
          ["選法", "3"],
          ["剩餘元素", "3"],
        ],
      },
      {
        title: "不限制第三格",
        description: "剩3個元素暫有3!=6種排列。",
        cells: ["剩3格", "3!=6"],
        active: [1],
        variables: [
          ["容斥j", "0"],
          ["暫和", "6"],
        ],
      },
      {
        title: "扣掉額外固定",
        description: "第三個受限位置也固定的有2!=2種，得到3×(6−2)=12。",
        cells: ["6−2=4", "×3", "12"],
        active: [0, 2],
        variables: [
          ["容斥j", "1"],
          ["答案", "12"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
const long long MOD = 1000000007;
long long power(long long a, long long b) {
    long long result = 1;
    for (; b; b /= 2, a = a * a % MOD)
        if (b % 2)
            result = result * a % MOD;
    return result;
}
int main() {
    vector<long long> fact(1001, 1), inv(1001, 1);
    for (int i = 1; i <= 1000; ++i)
        fact[i] = fact[i - 1] * i % MOD;
    inv[1000] = power(fact[1000], MOD - 2);
    for (int i = 1000; i > 0; --i)
        inv[i - 1] = inv[i] * i % MOD;
    auto choose = [&](int n, int k) { return fact[n] * inv[k] % MOD * inv[n - k] % MOD; };
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n, m, k;
        cin >> n >> m >> k;
        long long sum = 0;
        for (int j = 0; j <= m - k; ++j) {
            long long term = choose(m - k, j) * fact[n - k - j] % MOD;
            sum = (sum + (j % 2 ? -term : term) + MOD) % MOD;
        }
        cout << "Case " << tc << ": " << choose(m, k) * sum % MOD << '\n';
    }
}`,
    python: String.raw`import sys

MOD = 1000000007
fact = [1] * 1001
inv = [1] * 1001
for i in range(1, 1001):
    fact[i] = fact[i - 1] * i % MOD
inv[1000] = pow(fact[1000], MOD - 2, MOD)
for i in range(1000, 0, -1):
    inv[i - 1] = inv[i] * i % MOD


def choose(n, k):
    return fact[n] * inv[k] % MOD * inv[n - k] % MOD


data = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(data) + 1):
    n, m, k = next(data), next(data), next(data)
    value = (
        sum((-1 if j % 2 else 1) * choose(m - k, j) * fact[n - k - j] for j in range(m - k + 1))
        % MOD
    )
    print(f'Case {tc}: {choose(m, k) * value % MOD}')
`,
  }),
  defineCpeLesson("a481", {
    topic: "search",
    level: "easy",
    concept: "長方體因數枚舉",
    goal: "枚舉整數邊長且不重複考慮旋轉相同的長方體。",
    explanation: [
      "無縫使用全部單位積木，邊長a、b、c必為正整數且abc=N，紙張面積為2(ab+ac+bc)。長方體旋轉不改變面積，因此只搜尋a≤b≤c。最小邊a滿足a³≤N，固定a後，只要b²≤N/a，再由c=N/(ab)取得第三邊。",
      "僅在a整除N且b整除N/a時評估面積，這樣每個可能的形狀都被涵蓋。初值可用1×1×N的面積4N+2，N=1也成立。不要只把立方根四捨五入，因數限制可能迫使邊長偏離立方體很多，例如質數只能取1、1、N。",
    ],
    complexity: "簡單上界 O(N^(5/6)) 時間，額外空間 O(1)；N≤1000。",
    pitfall: "面積需乘2，且必須使用全部積木，不可取體積小於N的近似立方體。",
    traceLabel: "示意：N=12",
    trace: [
      {
        title: "細長形狀",
        description: "1×1×12面積為2(1+12+12)=50。",
        cells: ["1", "1", "12"],
        active: [0, 1, 2],
        variables: [
          ["面積", "50"],
          ["best", "50"],
        ],
      },
      {
        title: "固定最小邊1",
        description: "1×3×4面積為2(3+4+12)=38。",
        cells: ["1", "3", "4"],
        active: [1, 2],
        variables: [
          ["面積", "38"],
          ["best", "38"],
        ],
      },
      {
        title: "較均衡形狀",
        description: "2×2×3面積為2(4+6+6)=32，是最小值。",
        cells: ["2", "2", "3"],
        active: [0, 1, 2],
        variables: [
          ["面積", "32"],
          ["best", "32"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    int T;
    cin >> T;
    while (T--) {
        int n;
        cin >> n;
        int best = 4 * n + 2;
        for (int a = 1; a * a * a <= n; ++a)
            if (n % a == 0)
                for (int b = a; b * b <= n / a; ++b)
                    if ((n / a) % b == 0) {
                        int c = n / a / b;
                        best = min(best, 2 * (a * b + a * c + b * c));
                    }
        cout << best << '\n';
    }
}`,
    python: String.raw`import sys
from math import isqrt

data = list(map(int, sys.stdin.buffer.read().split()))
for n in data[1 : 1 + data[0]]:
    best = 4 * n + 2
    a = 1
    while a**3 <= n:
        if n % a == 0:
            for b in range(a, isqrt(n // a) + 1):
                if (n // a) % b == 0:
                    c = n // a // b
                    best = min(best, 2 * (a * b + a * c + b * c))
        a += 1
    print(best)
`,
  }),
  defineCpeLesson("a482", {
    topic: "strings",
    level: "medium",
    concept: "整行樹名計數與排序百分比",
    goal: "保留名稱空白，按資料區塊統計樹種比例。",
    explanation: [
      "每一行代表一棵樹，名稱中的空白屬於鍵的一部分，因此以整行字串作為映射鍵，計數加1並累加總棵數。資料區塊由空行分隔，第一行的測試筆數與緊接的空行不屬於樹名。",
      "讀完整組後按名稱字典序輸出，每種比例為100×count/total，固定四位小數且不印百分號。C++用map同時維護排序；Python用dict計數後排序鍵，避免保存最多一百萬行的原始清單。兩組輸出之間恰有一空行，最後一組可直接到EOF。",
    ],
    complexity:
      "T棵樹、U個樹種：C++ O(T log U)，Python O(T+U log U)，空間 O(U)，名稱長度≤30。",
    pitfall: "不能以split()讀樹名，也不能把不同組的樹木混在同一個總數中。",
    traceLabel: "示意：Oak、Red Elm、Oak",
    trace: [
      {
        title: "讀Oak",
        description: "Oak的計數變成1，總數1。",
        cells: ["Oak:1"],
        active: [0],
        variables: [["total", "1"]],
      },
      {
        title: "加入Red Elm",
        description: "完整保留中間空白，建立另一個鍵。",
        cells: ["Oak:1", "Red Elm:1"],
        active: [1],
        variables: [
          ["total", "2"],
          ["樹種數", "2"],
        ],
      },
      {
        title: "再次讀Oak",
        description: "Oak占2/3，Red Elm占1/3。",
        cells: ["Oak 66.6667", "Red Elm 33.3333"],
        active: [0, 1],
        variables: [
          ["total", "3"],
          ["Oak count", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <map>
#include <iomanip>
#include <limits>
using namespace std;
int main() {
    int T;
    cin >> T;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << fixed << setprecision(4);
    for (int tc = 0; tc < T; ++tc) {
        map<string, int> count;
        string s;
        int total = 0;
        while (getline(cin, s)) {
            if (!s.empty() && s.back() == '\r')
                s.pop_back();
            if (s.empty()) {
                if (total)
                    break;
                else
                    continue;
            }
            ++count[s];
            ++total;
        }
        if (tc)
            cout << '\n';
        for (const auto &entry : count)
            cout << entry.first << ' ' << 100.0 * entry.second / total << '\n';
    }
}`,
    python: String.raw`import sys

T = int(sys.stdin.readline())
for tc in range(T):
    count = {}
    total = 0
    for line in sys.stdin:
        name = line.rstrip('\r\n')
        if not name:
            if total:
                break
            continue
        count[name] = count.get(name, 0) + 1
        total += 1
    if tc:
        print()
    for name in sorted(count):
        print(f'{name} {100 * count[name] / total:.4f}')
`,
  }),
  defineCpeLesson("a483", {
    topic: "search",
    level: "medium",
    concept: "八方向直線搜尋與字典序起點",
    goal: "逐列逐欄找出單字的第一個合法起點。",
    explanation: [
      "先把格子與查詢字串都轉成小寫。對每個單字，以列號優先、欄號次之枚舉起點，再試八個非零方向(dr,dc)。第i個字元的位置是(r+i·dr,c+i·dc)，檢查是否仍在格內且字母相同，方向一旦選定便不能轉彎。",
      "依要求的優先順序枚舉起點，第一個成功起點就是答案；方向的先後順序不會影響起點。題目保證單字出現，結果轉成1起算。空行只是資料分隔，採用詞元輸入即可略過；每組輸出之間加一空行，不在每個單字之間加空行。",
    ],
    complexity: "每組 O(kmnL)，常數含8個方向；空間 O(mn)，L為最長單字長度。",
    pitfall: "不可把八方向搜尋寫成能轉彎的DFS；大小寫不能影響匹配。",
    traceLabel: "示意：2×3格 abc/def，找be",
    trace: [
      {
        title: "檢查(1,1)",
        description: "a不等於b，起點排除。",
        cells: ["a", "b", "c", "d", "e", "f"],
        active: [0],
        variables: [
          ["起點", "1 1"],
          ["首字匹配", "0"],
        ],
      },
      {
        title: "向右測試",
        description: "從(1,2)向右得到bc，第二個字母c不等於e。",
        cells: ["a", "b", "c", "d", "e", "f"],
        active: [1, 2],
        variables: [
          ["匹配長度", "1"],
          ["方向", "0,1"],
        ],
      },
      {
        title: "向下找到be",
        description: "(1,2)向下兩字完整匹配，輸出1 2。",
        cells: ["a", "b", "c", "d", "e", "f"],
        active: [1, 4],
        variables: [
          ["單字長度", "2"],
          ["輸出", "1 2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <cctype>
#include <utility>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 0; tc < T; ++tc) {
        int m, n;
        cin >> m >> n;
        vector<string> g(m);
        for (auto &row : g) {
            cin >> row;
            for (char &c : row)
                c = tolower((unsigned char)c);
        }
        int k;
        cin >> k;
        if (tc)
            cout << '\n';
        while (k--) {
            string word;
            cin >> word;
            for (char &c : word)
                c = tolower((unsigned char)c);
            pair<int, int> answer = {-1, -1};
            for (int r = 0; r < m && answer.first < 0; ++r)
                for (int c = 0; c < n && answer.first < 0; ++c)
                    for (int dr = -1; dr <= 1; ++dr)
                        for (int dc = -1; dc <= 1; ++dc) {
                            if (dr == 0 && dc == 0)
                                continue;
                            bool ok = true;
                            for (int i = 0; i < (int)word.size(); ++i) {
                                int rr = r + i * dr, cc = c + i * dc;
                                if (rr < 0 || rr >= m || cc < 0 || cc >= n ||
                                    g[rr][cc] != word[i]) {
                                    ok = false;
                                    break;
                                }
                            }
                            if (ok)
                                answer = {r, c};
                        }
            cout << answer.first + 1 << ' ' << answer.second + 1 << '\n';
        }
    }
}`,
    python: String.raw`import sys

data = iter(sys.stdin.read().split())


def find(grid, word, m, n):
    for r in range(m):
        for c in range(n):
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    if dr == dc == 0:
                        continue
                    if all(
                        0 <= r + i * dr < m
                        and 0 <= c + i * dc < n
                        and grid[r + i * dr][c + i * dc] == letter
                        for i, letter in enumerate(word)
                    ):
                        return r + 1, c + 1


for tc in range(int(next(data))):
    m, n = int(next(data)), int(next(data))
    grid = [next(data).lower() for _ in range(m)]
    k = int(next(data))
    if tc:
        print()
    for _ in range(k):
        print(*find(grid, next(data).lower(), m, n))
`,
  }),
  defineCpeLesson("a484", {
    topic: "sorting",
    level: "medium",
    concept: "按大小排序後的顏色區段貪心",
    goal: "每個連續同色區段選一層，得到最長交替樓層。",
    explanation: [
      "可重新排列，且大小互異，所以先按絕對值由小到大排列，這正是由頂至底的唯一大小順序。忽略大小後只剩紅藍序列；連續同色的一段最多只能選一層，因為同段之間不存在另一色可插入。",
      "每個同色區段選第一層就能與下一段銜接，且段與段的大小已嚴格增加，因此區段數就是最優層數。掃描排序結果，顏色改變就加1。N可達50萬，必須排序後一次掃描，不能做O(N²)最長子序列。",
    ],
    complexity: "每筆時間 O(n log n)，空間 O(n)。",
    pitfall: "排序鍵是絕對值，不是帶正負的數值；同色樓層不必全部使用。",
    traceLabel: "示意：7、−2、6、9、−3",
    trace: [
      {
        title: "按大小排序",
        description: "由小到大為−2、−3、6、7、9。",
        cells: ["−2紅", "−3紅", "6藍", "7藍", "9藍"],
        active: [0, 1, 2, 3, 4],
        variables: [["樓層數", "5"]],
      },
      {
        title: "選第一段",
        description: "紅色段只能取一層，先取−2。",
        cells: ["−2紅", "−3紅", "6藍", "7藍", "9藍"],
        active: [0],
        variables: [
          ["已選層數", "1"],
          ["顏色", "紅"],
        ],
      },
      {
        title: "轉為藍色",
        description: "選6後同段7與9不再增加層數，答案2。",
        cells: ["−2紅", "−3紅", "6藍", "7藍", "9藍"],
        active: [2],
        variables: [
          ["已選層數", "2"],
          ["顏色", "藍"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <cstdlib>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int n;
        cin >> n;
        vector<int> a(n);
        for (int &x : a)
            cin >> x;
        sort(a.begin(), a.end(), [](int x, int y) { return abs(x) < abs(y); });
        int answer = 0, previous = 0;
        for (int x : a) {
            int color = (x > 0 ? 1 : -1);
            if (color != previous) {
                ++answer;
                previous = color;
            }
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(data)):
    n = next(data)
    a = sorted((next(data) for _ in range(n)), key=abs)
    answer = 0
    previous = None
    for x in a:
        color = x > 0
        if color != previous:
            answer += 1
            previous = color
    print(answer)
`,
  }),
  defineCpeLesson("a485", {
    topic: "basics",
    level: "easy",
    concept: "編號集合補集",
    goal: "標記回來者，依序列出未出現編號。",
    explanation: [
      "以1到N為索引建立回來旗標，讀到每個編號便標記為真。接著從1掃到N，未被標記者就是仍未回來的志工；這個掃描順序自然符合遞增輸出，不需要額外排序。",
      "每筆資料由N、R開頭，讀取恰好R個編號後才能處理下一筆，直到EOF。若補集為空，輸出星號；否則依敘述讓每個編號後都有空白再換行。公開範例沒有顯示行末空白，但不影響編號與內部格式。",
    ],
    complexity: "時間 O(N+R)，空間 O(N)。",
    pitfall: "編號由1開始，陣列須配置N+1格；全員回來輸出*，不是空行。",
    traceLabel: "示意：N=5，回來3、1、5",
    trace: [
      {
        title: "初始",
        description: "五個編號皆未標記。",
        cells: ["1:0", "2:0", "3:0", "4:0", "5:0"],
        active: [],
        variables: [
          ["N", "5"],
          ["R", "3"],
        ],
      },
      {
        title: "標記回來者",
        description: "3、1、5設為1。",
        cells: ["1:1", "2:0", "3:1", "4:0", "5:1"],
        active: [0, 2, 4],
        variables: [["已回來", "3"]],
      },
      {
        title: "掃描補集",
        description: "只輸出旗標為0的2與4。",
        cells: ["1:1", "2:0", "3:1", "4:0", "5:1"],
        active: [1, 3],
        variables: [
          ["未回來", "2"],
          ["輸出編號", "2 4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n, r;
    while (cin >> n >> r) {
        vector<bool> returned(n + 1, false);
        for (int i = 0, x; i < r; ++i) {
            cin >> x;
            returned[x] = true;
        }
        bool missing = false;
        for (int i = 1; i <= n; ++i)
            if (!returned[i]) {
                cout << i << ' ';
                missing = true;
            }
        if (!missing)
            cout << '*';
        cout << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for n in data:
    r = next(data)
    returned = {next(data) for _ in range(r)}
    missing = [str(i) for i in range(1, n + 1) if i not in returned]
    print(' '.join(missing) + ' ' if missing else '*')
`,
  }),
  defineCpeLesson("a486", {
    topic: "math",
    level: "easy",
    concept: "按正方形邊長分類計數",
    goal: "把所有邊長的放置方式加總成平方和。",
    explanation: [
      "邊長k的正方形左上角有N−k+1種列位置與同樣多的欄位置，因此共有(N−k+1)²個。對k=1到N加總，改寫索引便是1²+2²+…+N²。",
      "利用平方和公式N(N+1)(2N+1)/6即可直接計算，或者預處理前綴平方和。這裡只數由水平與垂直格線圍出的正方形，不包含傾斜圖形。輸入0時結束，N=1應得到1，每筆不加案例標號。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "只算N²會漏掉較大正方形；公式的乘法先用64位元整數較穩妥。",
    traceLabel: "示意：N=3",
    trace: [
      {
        title: "邊長1",
        description: "3×3=9種位置。",
        cells: ["k=1:9", "k=2:待算", "k=3:待算"],
        active: [0],
        variables: [["累積", "9"]],
      },
      {
        title: "邊長2",
        description: "2×2=4種位置。",
        cells: ["k=1:9", "k=2:4", "k=3:待算"],
        active: [1],
        variables: [["累積", "13"]],
      },
      {
        title: "邊長3",
        description: "整個方格只有1個，總共14。",
        cells: ["k=1:9", "k=2:4", "k=3:1"],
        active: [2],
        variables: [["累積", "14"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n && n)
        cout << n * (n + 1) * (2 * n + 1) / 6 << '\n';
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    print(n * (n + 1) * (2 * n + 1) // 6)
`,
  }),
  defineCpeLesson("a487", {
    topic: "basics",
    level: "easy",
    concept: "最大值與並列答案保序",
    goal: "保存所有達到最高相關度的網址。",
    explanation: [
      "掃描十個網頁，維護目前最高分best與答案清單。遇到更高分就清空舊答案並放入新網址；遇到等於best的分數就附加網址；較低分直接忽略。每一步的清單都是目前前綴最高分的所有網址。",
      "附加順序就是輸入順序，所以不需要排序，也不可去除重複網址，因為每行是獨立紀錄。每組恰讀十行，輸出Case #k:後逐行印清單，不印分數或額外空行。",
    ],
    complexity: "每組時間 O(10)，空間 O(10)（不計網址字元）。",
    pitfall: "更高分出現時必須清掉舊的並列答案；標題含#與冒號。",
    traceLabel: "示意：十筆分數1、3、3、2、1、1、1、1、1、1",
    trace: [
      {
        title: "第一筆",
        description: "網址u1分數1，先成為最佳。",
        cells: ["u1:1"],
        active: [0],
        variables: [
          ["best", "1"],
          ["答案數", "1"],
        ],
      },
      {
        title: "第二筆更高",
        description: "u2分數3，清除u1。",
        cells: ["u2:3"],
        active: [0],
        variables: [
          ["best", "3"],
          ["答案數", "1"],
        ],
      },
      {
        title: "第三筆並列",
        description: "u3也得3分，後面分數都較低，保留u2、u3。",
        cells: ["u2:3", "u3:3"],
        active: [0, 1],
        variables: [
          ["best", "3"],
          ["答案數", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int best = -1;
        vector<string> answer;
        for (int i = 0; i < 10; ++i) {
            string url;
            int score;
            cin >> url >> score;
            if (score > best) {
                best = score;
                answer.clear();
            }
            if (score == best)
                answer.push_back(url);
        }
        cout << "Case #" << tc << ":\n";
        for (const auto &url : answer)
            cout << url << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(sys.stdin.read().split())
for tc in range(1, int(next(data)) + 1):
    best = -1
    answer = []
    for _ in range(10):
        url, score = next(data), int(next(data))
        if score > best:
            best = score
            answer = []
        if score == best:
            answer.append(url)
    print(f'Case #{tc}:')
    print('\n'.join(answer))
`,
  }),
  defineCpeLesson("a488", {
    topic: "basics",
    level: "easy",
    concept: "相鄰高度比較",
    goal: "只計算牆與牆之間實際發生的跳躍。",
    explanation: [
      "Mario一開始已在第一面牆，所以N面牆只有N−1次跳躍。依序比較a[i]與a[i−1]，變大就增加high、變小就增加low，相等時兩者都不動。",
      "維持兩個互不干擾的計數器即可，不需要累計高度差。每筆先讀牆數再讀完N個高度；只有一面牆時迴圈不執行，答案自然為0 0。輸出Case k: H L，H在前、L在後。",
    ],
    complexity: "每筆時間 O(N)，空間 O(N)。",
    pitfall: "從地面到第一面牆不算跳躍，等高也不算high或low。",
    traceLabel: "示意：1、4、4、2",
    trace: [
      {
        title: "1到4",
        description: "高度增加，high加1。",
        cells: ["1", "4", "4", "2"],
        active: [0, 1],
        variables: [
          ["H", "1"],
          ["L", "0"],
        ],
      },
      {
        title: "4到4",
        description: "等高，兩計數器不變。",
        cells: ["1", "4", "4", "2"],
        active: [1, 2],
        variables: [
          ["H", "1"],
          ["L", "0"],
        ],
      },
      {
        title: "4到2",
        description: "高度降低，low加1。",
        cells: ["1", "4", "4", "2"],
        active: [2, 3],
        variables: [
          ["H", "1"],
          ["L", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n;
        cin >> n;
        vector<int> a(n);
        for (int &x : a)
            cin >> x;
        int high = 0, low = 0;
        for (int i = 1; i < n; ++i) {
            high += (a[i] > a[i - 1]);
            low += (a[i] < a[i - 1]);
        }
        cout << "Case " << tc << ": " << high << ' ' << low << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(data) + 1):
    n = next(data)
    a = [next(data) for _ in range(n)]
    high = sum(y > x for x, y in zip(a, a[1:]))
    low = sum(y < x for x, y in zip(a, a[1:]))
    print(f'Case {tc}: {high} {low}')
`,
  }),
  defineCpeLesson("a489", {
    topic: "math",
    level: "easy",
    concept: "一天分鐘數的循環差",
    goal: "統一時間單位並處理跨午夜。",
    explanation: [
      "把時分轉成自午夜起的分鐘數now=60H1+M1、alarm=60H2+M2，先計算alarm−now。若差為負，表示鬧鐘在隔天，加上一天1440分鐘；否則直接使用差值。",
      "這等價於在模1440的時鐘上取非負差。時間完全相同且不是全零停止列時，題意只說早於才到隔天，因此差為0。每次先檢查四個整數是否全零，再進行輸出，不能把所有午夜時間都當作停止。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "要加1440分鐘而不是24；四數全為0才停止。",
    traceLabel: "示意：23:59到00:34",
    trace: [
      {
        title: "轉換現在時間",
        description: "23×60+59=1439。",
        cells: ["23:59", "1439分鐘"],
        active: [1],
        variables: [["now", "1439"]],
      },
      {
        title: "計算原始差",
        description: "00:34是34分鐘，34−1439=−1405。",
        cells: ["34", "−1439", "−1405"],
        active: [2],
        variables: [["差", "−1405"]],
      },
      {
        title: "跨到隔天",
        description: "加1440後得到35分鐘。",
        cells: ["−1405", "+1440", "35"],
        active: [2],
        variables: [["答案", "35"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int h1, m1, h2, m2;
    while (cin >> h1 >> m1 >> h2 >> m2) {
        if (h1 == 0 && m1 == 0 && h2 == 0 && m2 == 0)
            break;
        int diff = 60 * h2 + m2 - 60 * h1 - m1;
        if (diff < 0)
            diff += 1440;
        cout << diff << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for h1 in data:
    m1, h2, m2 = next(data), next(data), next(data)
    if h1 == m1 == h2 == m2 == 0:
        break
    print((60 * h2 + m2 - 60 * h1 - m1) % 1440)
`,
  }),
  defineCpeLesson("a490", {
    topic: "strings",
    level: "easy",
    concept: "字母與多位次數的游程解碼",
    goal: "完整讀取連續數字後才展開字元。",
    explanation: [
      "從目前位置讀取一個大寫字母，接著把後面所有連續數字累積成count：每讀一位d，更新count=10count+d。直到下一個字母或字串結束，才輸出count個該字母，並繼續讀下一組。",
      "指標每次都向右前進，分組邊界就是數字轉回字母的位置。次數可能超過9，也可能為0，均應用同一套流程。每筆解碼長度不超過200，直接建立結果字串即可；輸出Case k: 後接結果，保留指定空白。",
    ],
    complexity: "時間 O(編碼長度+解碼長度)，空間 O(解碼長度)。",
    pitfall:
      "A12不是A1再處理2，必須先讀完多位數字；不要把不同段同字母自動合併。",
    traceLabel: "示意：A12B2",
    trace: [
      {
        title: "讀第一位次數",
        description: "讀A後讀1，count暫為1。",
        cells: ["A", "1", "2", "B", "2"],
        active: [0, 1],
        variables: [
          ["count", "1"],
          ["輸出長度", "0"],
        ],
      },
      {
        title: "讀第二位次數",
        description: "count=1×10+2=12，展開12個A。",
        cells: ["A×12", "B", "2"],
        active: [0],
        variables: [
          ["count", "12"],
          ["輸出長度", "12"],
        ],
      },
      {
        title: "處理第二段",
        description: "B後的2展開兩個B，總長14。",
        cells: ["AAAAAAAAAAAA", "BB"],
        active: [1],
        variables: [
          ["count", "2"],
          ["輸出長度", "14"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        string s, result;
        cin >> s;
        size_t i = 0;
        while (i < s.size()) {
            char letter = s[i++];
            int count = 0;
            while (i < s.size() && '0' <= s[i] && s[i] <= '9')
                count = 10 * count + s[i++] - '0';
            result.append(count, letter);
        }
        cout << "Case " << tc << ": " << result << '\n';
    }
}`,
    python: String.raw`import sys

data = sys.stdin.read().split()
for tc, s in enumerate(data[1 : 1 + int(data[0])], 1):
    out = []
    i = 0
    while i < len(s):
        letter = s[i]
        i += 1
        count = 0
        while i < len(s) and '0' <= s[i] <= '9':
            count = count * 10 + int(s[i])
            i += 1
        out.append(letter * count)
    print(f'Case {tc}: ' + ''.join(out))
`,
  }),
  defineCpeLesson("a491", {
    topic: "geometry",
    level: "easy",
    concept: "平移座標後的象限判斷",
    goal: "先辨識分界線，再依座標差的正負決定區域。",
    explanation: [
      "把分界點(N,M)當作新原點，住宅的相對座標為dx=X−N、dy=Y−M。任一差值為0就位在分界線，必須先輸出divisa；其餘依dy正負選北或南，再依dx正負選東或西。",
      "題目使用葡萄牙文縮寫，北為N、南為S、東為E、西為O，因此西北是NO、西南是SO，不能套用英文W。每組先讀K與分界點，再處理恰好K個住宅，單獨的K=0才停止。",
    ],
    complexity: "每組時間 O(K)，額外空間 O(1)。",
    pitfall: "X相同或Y相同都算分界線，不只是與中心完全相同的住宅。",
    traceLabel: "示意：分界點(2,1)",
    trace: [
      {
        title: "住宅(10,10)",
        description: "dx=8、dy=9，東北NE。",
        cells: ["dx=8", "dy=9", "NE"],
        active: [2],
        variables: [["住宅序號", "1"]],
      },
      {
        title: "住宅(−10,1)",
        description: "dy=0，在分界線上。",
        cells: ["dx=−12", "dy=0", "divisa"],
        active: [1, 2],
        variables: [["住宅序號", "2"]],
      },
      {
        title: "住宅(0,33)",
        description: "dx=−2、dy=32，西北NO。",
        cells: ["dx=−2", "dy=32", "NO"],
        active: [2],
        variables: [["住宅序號", "3"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int k;
    while (cin >> k && k) {
        int n, m;
        cin >> n >> m;
        while (k--) {
            int x, y;
            cin >> x >> y;
            if (x == n || y == m)
                cout << "divisa\n";
            else
                cout << (y > m ? 'N' : 'S') << (x > n ? 'E' : 'O') << '\n';
        }
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for k in data:
    if k == 0:
        break
    n, m = next(data), next(data)
    for _ in range(k):
        x, y = next(data), next(data)
        if x == n or y == m:
            print('divisa')
        else:
            print(('N' if y > m else 'S') + ('E' if x > n else 'O'))
`,
  }),
];
