import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a492", {
    topic: "number-theory",
    level: "easy",
    concept: "依最大元素建立GCD總和前綴",
    goal: "預處理所有N的配對總和，避免重複計算。",
    explanation: [
      "把配對依較大的元素j分類，新增j時只多出(1,j)到(j−1,j)，故G(j)=G(j−1)+Σgcd(i,j)。以歐幾里得演算法計算每個最大公因數，累加在前一個答案上即可。",
      "N最多500且有多筆詢問，先預處理G(1)到G(500)，每筆查表即可。只枚舉i<j，不包含(i,i)，也不重複計算(j,i)。讀到0結束，累加器使用long long，輸出不加案例標號。",
    ],
    complexity: "預處理 O(500² log 500)，查詢 O(1)，空間 O(500)。",
    pitfall: "把整個N×N矩陣加總會把對稱配對重複算，也會多出對角線。",
    traceLabel: "示意：N由2增加到4",
    trace: [
      {
        title: "加入j=2",
        description: "gcd(1,2)=1，G(2)=1。",
        cells: ["(1,2):1"],
        active: [0],
        variables: [
          ["j", "2"],
          ["G", "1"],
        ],
      },
      {
        title: "加入j=3",
        description: "新增gcd(1,3)+gcd(2,3)=2。",
        cells: ["(1,3):1", "(2,3):1"],
        active: [0, 1],
        variables: [
          ["新增", "2"],
          ["G", "3"],
        ],
      },
      {
        title: "加入j=4",
        description: "新增1+2+1=4，所以G(4)=7。",
        cells: ["(1,4):1", "(2,4):2", "(3,4):1"],
        active: [0, 1, 2],
        variables: [
          ["新增", "4"],
          ["G", "7"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <numeric>
using namespace std;
int main() {
    long long g[501] = {};
    for (int j = 2; j <= 500; ++j) {
        g[j] = g[j - 1];
        for (int i = 1; i < j; ++i)
            g[j] += gcd(i, j);
    }
    int n;
    while (cin >> n && n)
        cout << g[n] << '\n';
}`,
    python: String.raw`import sys
from math import gcd

g = [0] * 501
for j in range(2, 501):
    g[j] = g[j - 1] + sum(gcd(i, j) for i in range(1, j))
for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    print(g[n])
`,
  }),
  defineCpeLesson("a493", {
    topic: "number-theory",
    level: "easy",
    concept: "數字根與模9同餘",
    goal: "以十進位位值的同餘性直接求最後一位數。",
    explanation: [
      "因10≡1 (mod 9)，一個整數與其各位數字和模9相同。反覆取數字和不改變這個餘數，正整數最終又必落在1到9，所以餘數1到8就對應自己，餘數0則必須對應9。",
      "因此g(n)=1+(n−1)%9，省去反覆拆位的迴圈。公式只對正整數使用，輸入0先停止。雖然本題n可用32位元正整數儲存，C++仍用long long讀取，逐筆輸出一位答案。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "直接輸出n%9會把9、18等數的數字根錯寫成0。",
    traceLabel: "示意：n=9875",
    trace: [
      {
        title: "第一輪數字和",
        description: "9+8+7+5=29。",
        cells: ["9", "8", "7", "5"],
        active: [0, 1, 2, 3],
        variables: [
          ["新值", "29"],
          ["模9", "2"],
        ],
      },
      {
        title: "第二輪",
        description: "2+9=11，同餘類仍是2。",
        cells: ["2", "9", "11"],
        active: [2],
        variables: [
          ["新值", "11"],
          ["模9", "2"],
        ],
      },
      {
        title: "第三輪",
        description: "1+1=2，與公式1+9874%9一致。",
        cells: ["1", "1", "2"],
        active: [2],
        variables: [["數字根", "2"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n && n)
        cout << 1 + (n - 1) % 9 << '\n';
}`,
    python: String.raw`import sys

for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    print(1 + (n - 1) % 9)
`,
  }),
  defineCpeLesson("a494", {
    topic: "number-theory",
    level: "medium",
    concept: "長整數字串與9-degree",
    goal: "不解析千位整數，判斷9的倍數並追蹤數字和層數。",
    explanation: [
      "N最多1000位，因此保留原始字串並先把各字元數字加總，總和最多9000。因N與數字和模9相同，若此和不被9整除，直接輸出不是倍數；否則反覆計算這個小整數的數字和直到9。",
      "第一輪由原字串算數字和就計為degree=1，之後每替換一次再加1。特別N=9時第一輪仍得到9，degree維持1，符合題目的特殊定義。輸出必須用原字串而不是其數字和，保留完整英文及句點；單獨的0結束。",
    ],
    complexity: "時間 O(L)，空間 O(L)保存原字串，L≤1000。",
    pitfall:
      "degree不是迴圈停在一位數後再任意加1；直接轉成固定寬度整數會溢位。",
    traceLabel: "示意：N=999999999",
    trace: [
      {
        title: "第一層",
        description: "九個9的數字和為81。",
        cells: ["9×9", "81"],
        active: [1],
        variables: [
          ["degree", "1"],
          ["sum", "81"],
        ],
      },
      {
        title: "檢查整除",
        description: "81%9=0，確定原數為9的倍數。",
        cells: ["81", "%9=0"],
        active: [1],
        variables: [
          ["degree", "1"],
          ["倍數", "1"],
        ],
      },
      {
        title: "第二層",
        description: "8+1=9，停止，9-degree為2。",
        cells: ["8", "1", "9"],
        active: [2],
        variables: [
          ["degree", "2"],
          ["sum", "9"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    string s;
    while (cin >> s && s != "0") {
        int sum = 0;
        for (char c : s)
            sum += c - '0';
        if (sum % 9)
            cout << s << " is not a multiple of 9.\n";
        else {
            int degree = 1;
            while (sum > 9) {
                int next = 0;
                while (sum) {
                    next += sum % 10;
                    sum /= 10;
                }
                sum = next;
                ++degree;
            }
            cout << s << " is a multiple of 9 and has 9-degree " << degree << ".\n";
        }
    }
}`,
    python: String.raw`import sys

for s in sys.stdin.read().split():
    if s == '0':
        break
    total = sum(map(int, s))
    if total % 9:
        print(f'{s} is not a multiple of 9.')
    else:
        degree = 1
        while total > 9:
            total = sum(map(int, str(total)))
            degree += 1
        print(f'{s} is a multiple of 9 and has 9-degree {degree}.')
`,
  }),
  defineCpeLesson("a495", {
    topic: "simulation",
    level: "easy",
    concept: "循環刻度的定向距離",
    goal: "分別累加三段有方向的旋轉與固定整圈。",
    explanation: [
      "刻度模40循環，順時針刻度遞減，所以從s到a的格數為(s−a+40)%40；逆時針由a到b則為(b−a+40)%40；最後順時針由b到c為(b−c+40)%40。這三段都是非負移動距離，不能互相抵消。",
      "額外要求的順時針兩圈與逆時針一圈共120格，因此總角度為[120+三段格數]×9。起點與第一密碼相同時，附加段為0，但固定整圈仍存在。四數全為0才結束，每筆輸出整數角度。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall: "順時針不是刻度增加；也不能把最後結果當成淨旋轉角度取模360。",
    traceLabel: "示意：0、30、0、30",
    trace: [
      {
        title: "固定整圈",
        description: "三整圈共1080度。",
        cells: ["2圈720°", "1圈360°"],
        active: [0, 1],
        variables: [
          ["格數", "120"],
          ["角度", "1080"],
        ],
      },
      {
        title: "前兩段",
        description: "0順時針到30走10格，30逆時針到0也走10格。",
        cells: ["0→30:10", "30→0:10"],
        active: [0, 1],
        variables: [["累積格數", "140"]],
      },
      {
        title: "最後一段",
        description: "0順時針到30再10格，150×9=1350。",
        cells: ["再10格", "總150格", "1350°"],
        active: [2],
        variables: [["答案", "1350"]],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int s, a, b, c;
    while (cin >> s >> a >> b >> c) {
        if (s == 0 && a == 0 && b == 0 && c == 0)
            break;
        cout << 9 * (120 + (s - a + 40) % 40 + (b - a + 40) % 40 + (b - c + 40) % 40) << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for s in data:
    a, b, c = next(data), next(data), next(data)
    if s == a == b == c == 0:
        break
    print(9 * (120 + (s - a) % 40 + (b - a) % 40 + (b - c) % 40))
`,
  }),
  defineCpeLesson("a496", {
    topic: "search",
    level: "easy",
    concept: "猜數字的可行整數區間",
    goal: "將所有大小提示交集後驗證最後答案。",
    explanation: [
      "用閉區間[lo,hi]表示仍可能的數字，初始為[1,10]。猜g並回答too high，就把hi縮為min(hi,g−1)；too low則把lo提高為max(lo,g+1)。區間只會縮小，完整保存目前所有提示的交集。",
      "遇到right on時，最後猜測必須落在區間中才可能誠實。即使中途區間已空，也要讀到right on才能開始新局；判斷後重新設為[1,10]。回答含空白，C++讀兩個詞合併，Python整行讀取，單獨猜測0結束。",
    ],
    complexity: "每次提示 O(1)，空間 O(1)。",
    pitfall: "too high是嚴格小於猜測，不能把猜測本身留下；不同局的區間要重設。",
    traceLabel: "示意：10太高、3太低、4太高、2猜中",
    trace: [
      {
        title: "排除10以上",
        description: "10太高後只可能1到9。",
        cells: ["lo=1", "hi=9"],
        active: [1],
        variables: [
          ["猜測", "10"],
          ["候選數", "9"],
        ],
      },
      {
        title: "交集變空",
        description: "3太低使lo=4；4太高使hi=3，前後矛盾。",
        cells: ["lo=4", "hi=3"],
        active: [0, 1],
        variables: [["候選數", "0"]],
      },
      {
        title: "最後猜2",
        description: "2不在空區間內，輸出不誠實並重設。",
        cells: ["猜中2", "新lo=1", "新hi=10"],
        active: [0],
        variables: [
          ["誠實", "0"],
          ["下一局候選數", "10"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    int g, lo = 1, hi = 10;
    while (cin >> g && g) {
        string a, b;
        cin >> a >> b;
        if (a == "right") {
            cout << (lo <= g && g <= hi ? "Stan may be honest" : "Stan is dishonest") << '\n';
            lo = 1;
            hi = 10;
        } else if (b == "high")
            hi = min(hi, g - 1);
        else
            lo = max(lo, g + 1);
    }
}`,
    python: String.raw`import sys

lo, hi = 1, 10
for line in sys.stdin:
    g = int(line)
    if g == 0:
        break
    response = sys.stdin.readline().strip()
    if response == 'right on':
        print('Stan may be honest' if lo <= g <= hi else 'Stan is dishonest')
        lo, hi = 1, 10
    elif response == 'too high':
        hi = min(hi, g - 1)
    else:
        lo = max(lo, g + 1)
`,
  }),
  defineCpeLesson("a497", {
    topic: "simulation",
    level: "medium",
    concept: "確定轉移與重複狀態偵測",
    goal: "以已見集合判定數字平方和過程能否抵達1。",
    explanation: [
      "目前數字x的下一狀態是各位數字平方和，是唯一確定的。若抵達1就是快樂數；若再遇到已看過的x，之後也必重複相同路徑，不可能突然出現1。因此每次先檢查1與已見集合，再加入x並轉移。",
      "原數小於10⁹，第一步最多9×81=729，之後一直留在小範圍，所以這個迴圈一定很快終止。另存原始N供輸出，不能用最後停住的x替代。格式包含Case #p:、Happy或Unhappy、以及句尾句點。",
    ],
    complexity:
      "每筆 O(log N+C) 時間、O(C) 空間；首步後狀態值≤729，C為小常數狀態數。",
    pitfall: "不能只設定固定迭代次數猜答案，也不能把數字和誤寫成數字平方和。",
    traceLabel: "示意：N=13",
    trace: [
      {
        title: "處理13",
        description: "1²+3²=10，記下13。",
        cells: ["13", "10"],
        active: [0],
        variables: [
          ["seen大小", "1"],
          ["下一值", "10"],
        ],
      },
      {
        title: "處理10",
        description: "1²+0²=1，記下10。",
        cells: ["13", "10", "1"],
        active: [1],
        variables: [
          ["seen大小", "2"],
          ["下一值", "1"],
        ],
      },
      {
        title: "抵達1",
        description: "無須繼續轉移，13是快樂數。",
        cells: ["13", "10", "1"],
        active: [2],
        variables: [
          ["原N", "13"],
          ["Happy", "1"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <set>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n;
        cin >> n;
        int x = n;
        set<int> seen;
        while (x != 1 && !seen.count(x)) {
            seen.insert(x);
            int next = 0;
            for (int v = x; v; v /= 10)
                next += (v % 10) * (v % 10);
            x = next;
        }
        cout << "Case #" << tc << ": " << n
             << (x == 1 ? " is a Happy number.\n" : " is an Unhappy number.\n");
    }
}`,
    python: String.raw`import sys

data = list(map(int, sys.stdin.buffer.read().split()))
for tc, n in enumerate(data[1 : 1 + data[0]], 1):
    x = n
    seen = set()
    while x != 1 and x not in seen:
        seen.add(x)
        x = sum(int(c) ** 2 for c in str(x))
    kind = 'a Happy' if x == 1 else 'an Unhappy'
    print(f'Case #{tc}: {n} is {kind} number.')
`,
  }),
  defineCpeLesson("a498", {
    topic: "trees",
    level: "medium",
    concept: "前序四分樹解碼與像素聯集",
    goal: "遞迴定位每個區域，將兩張圖的黑色像素合併。",
    explanation: [
      "用一個32×32布林畫布表示合併影像。解析函式接收區域左上角與邊長，每次消耗一個編碼字元：e不改畫布，f把整塊設黑，p則依右上、左上、左下、右下四區遞迴，邊長減半。指標隨前序順序前進，每個節點只消耗一次。",
      "兩張影像依次畫到同一塊畫布，第二張的白色不能清除第一張黑色，因此得到的是聯集。最後計算真值個數，不需構造新的壓縮四分樹。最小像素1×1，遞迴深度最多5，安全且容易驗證。每組重新清空畫布，輸出指定句子。",
    ],
    complexity: "每組 O(L1+L2+32²) 時間，O(32²+深度) 空間。",
    pitfall: "p後面是四棵完整子樹，不能只讀四個字元；白色區域不可把畫布改白。",
    traceLabel: "示意：pfeee與pefee，每黑區256像素",
    trace: [
      {
        title: "第一張右上為黑",
        description: "pfeee的右上16×16設黑。",
        cells: ["右上256", "左上0", "左下0", "右下0"],
        active: [0],
        variables: [["黑像素", "256"]],
      },
      {
        title: "第二張左上為黑",
        description: "pefee的左上16×16設黑，其餘白色不清除舊畫布。",
        cells: ["右上256", "左上256", "左下0", "右下0"],
        active: [1],
        variables: [
          ["新增", "256"],
          ["黑像素", "512"],
        ],
      },
      {
        title: "計算聯集",
        description: "兩區互不重疊，共512黑像素。",
        cells: ["256", "+256", "512"],
        active: [2],
        variables: [["輸出X", "512"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
bool black[32][32];
void paint(const string &s, int &i, int r, int c, int size) {
    char ch = s[i++];
    if (ch == 'f') {
        for (int y = r; y < r + size; ++y)
            for (int x = c; x < c + size; ++x)
                black[y][x] = true;
    } else if (ch == 'p') {
        int h = size / 2;
        paint(s, i, r, c + h, h);
        paint(s, i, r, c, h);
        paint(s, i, r + h, c, h);
        paint(s, i, r + h, c + h, h);
    }
}
int main() {
    int T;
    cin >> T;
    while (T--) {
        for (auto &row : black)
            for (bool &cell : row)
                cell = false;
        for (int tree = 0; tree < 2; ++tree) {
            string s;
            cin >> s;
            int i = 0;
            paint(s, i, 0, 0, 32);
        }
        int count = 0;
        for (auto &row : black)
            for (bool cell : row)
                count += cell;
        cout << "There are " << count << " black pixels.\n";
    }
}`,
    python: String.raw`import sys

data = iter(sys.stdin.read().split())
for _ in range(int(next(data))):
    black = [[False] * 32 for _ in range(32)]

    def paint(tokens, r, c, size):
        ch = next(tokens)
        if ch == 'f':
            for y in range(r, r + size):
                for x in range(c, c + size):
                    black[y][x] = True
        elif ch == 'p':
            h = size // 2
            for y, x in ((r, c + h), (r, c), (r + h, c), (r + h, c + h)):
                paint(tokens, y, x, h)

    paint(iter(next(data)), 0, 0, 32)
    paint(iter(next(data)), 0, 0, 32)
    count = sum(map(sum, black))
    print(f'There are {count} black pixels.')
`,
  }),
  defineCpeLesson("a499", {
    topic: "search",
    level: "medium",
    concept: "假幣編號與輕重假設的逐次篩選",
    goal: "保留所有符合秤重結果的假幣假設，再按編號去重。",
    explanation: [
      "每枚硬幣有較重與較輕兩種假設。一次秤重給每枚硬幣係數side：左盤+1、右盤−1、不在盤上0。若假幣重量差的符號為sign，預測左減右的符號就是side×sign，必須與<、>、=對應的−1、+1、0完全相同。真幣重量因兩盤枚數相同而抵消。",
      "對每筆紀錄刪除所有預測不符的假設，最後只看仍至少有一種輕重可能的編號數。恰好一個編號就輸出它，否則輸出0；即使同一枚同時有兩種輕重可能，也仍是唯一編號。用詞元讀取略過輸入空白行，輸出各組之間一空行。",
    ],
    complexity: "每組時間 O(NK)，空間 O(N)。",
    pitfall: "不平衡時，未上秤的硬幣不可能是假幣；唯一的是編號，不是輕重假設。",
    traceLabel: "示意：N=3，1對2平衡，再1對3較輕",
    trace: [
      {
        title: "建立假設",
        description: "3枚各有重、輕兩種，共6種。",
        cells: ["1±", "2±", "3±"],
        active: [0, 1, 2],
        variables: [["假設數", "6"]],
      },
      {
        title: "1與2平衡",
        description: "1與2均為真幣，僅3的兩種假設存活。",
        cells: ["1真", "2真", "3±"],
        active: [2],
        variables: [
          ["假設數", "2"],
          ["候選編號數", "1"],
        ],
      },
      {
        title: "1比3輕",
        description: "左輕右重，3必為重假幣，輸出3。",
        cells: ["1真", "2真", "3重"],
        active: [2],
        variables: [
          ["假設數", "1"],
          ["答案", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 0; tc < T; ++tc) {
        int n, k;
        cin >> n >> k;
        vector<array<bool, 2>> valid(n + 1, array<bool, 2>{true, true});
        while (k--) {
            int p;
            cin >> p;
            vector<int> side(n + 1);
            for (int i = 0, x; i < p; ++i) {
                cin >> x;
                side[x] = 1;
            }
            for (int i = 0, x; i < p; ++i) {
                cin >> x;
                side[x] = -1;
            }
            char ch;
            cin >> ch;
            int result = (ch == '<' ? -1 : ch == '>' ? 1 : 0);
            for (int coin = 1; coin <= n; ++coin)
                for (int h = 0; h < 2; ++h)
                    if (side[coin] * (h == 0 ? -1 : 1) != result)
                        valid[coin][h] = false;
        }
        int count = 0, answer = 0;
        for (int coin = 1; coin <= n; ++coin)
            if (valid[coin][0] || valid[coin][1]) {
                ++count;
                answer = coin;
            }
        if (tc)
            cout << '\n';
        cout << (count == 1 ? answer : 0) << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(sys.stdin.read().split())
for tc in range(int(next(data))):
    n, k = int(next(data)), int(next(data))
    valid = {(coin, sign) for coin in range(1, n + 1) for sign in (-1, 1)}
    for _ in range(k):
        p = int(next(data))
        side = [0] * (n + 1)
        for _ in range(p):
            side[int(next(data))] = 1
        for _ in range(p):
            side[int(next(data))] = -1
        result = {'<': -1, '>': 1, '=': 0}[next(data)]
        valid = {(coin, sign) for coin, sign in valid if side[coin] * sign == result}
    coins = {coin for coin, sign in valid}
    if tc:
        print()
    print(next(iter(coins)) if len(coins) == 1 else 0)
`,
  }),
  defineCpeLesson("a500", {
    topic: "sorting",
    level: "medium",
    concept: "最小可放頂端與耐心排序",
    goal: "每次選不小於新字母的最小堆頂，減少堆數。",
    explanation: [
      "新貨櫃x只能放在頂端字母≥x的堆，因為到貨由下往上放，最後由上往下必須非遞減。把各堆頂保持排序，用lower_bound找第一個≥x的位置並替換成x；若不存在，才新增一堆。相等字母能疊在一起。",
      "選最小可行頂端會保留更大的頂端，讓未來較大的字母還有位置可放。更形式化地，這些頂端也是各長度嚴格遞增子序列的最小尾值；長度k的嚴格遞增到貨序列不能共用一個非遞增堆，給出k堆下界，而貪心恰使用這麼多堆。因此堆數最少。讀到end停止，輸出Case x: y。",
    ],
    complexity: "時間 O(L log S)，空間 O(S)，S≤26。",
    pitfall: "使用第一個大於等於，不是嚴格大於；CCCC應只需1堆。",
    traceLabel: "示意：ABCA",
    trace: [
      {
        title: "處理A、B",
        description: "A堆頂不能接B，因此建立第二堆。",
        cells: ["A", "B"],
        active: [1],
        variables: [
          ["已處理", "2"],
          ["堆數", "2"],
        ],
      },
      {
        title: "處理C",
        description: "所有堆頂都比C小，需第三堆。",
        cells: ["A", "B", "C"],
        active: [2],
        variables: [
          ["已處理", "3"],
          ["堆數", "3"],
        ],
      },
      {
        title: "再處理A",
        description: "第一個≥A的頂端是A，直接放上去。",
        cells: ["A（兩層）", "B", "C"],
        active: [0],
        variables: [
          ["已處理", "4"],
          ["堆數", "3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    string s;
    int tc = 0;
    while (cin >> s && s != "end") {
        vector<char> tops;
        for (char c : s) {
            auto it = lower_bound(tops.begin(), tops.end(), c);
            if (it == tops.end())
                tops.push_back(c);
            else
                *it = c;
        }
        cout << "Case " << ++tc << ": " << tops.size() << '\n';
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left

tc = 0
for s in sys.stdin.read().split():
    if s == 'end':
        break
    tops = []
    for c in s:
        i = bisect_left(tops, c)
        if i == len(tops):
            tops.append(c)
        else:
            tops[i] = c
    tc += 1
    print(f'Case {tc}: {len(tops)}')
`,
  }),
  defineCpeLesson("a501", {
    topic: "graphs",
    level: "easy",
    concept: "網格八鄰格計數",
    goal: "對每個非地雷格計算合法範圍內的相鄰地雷數。",
    explanation: [
      "固定八種偏移(dr,dc)，其中dr、dc各為−1、0、1但排除(0,0)。對非地雷格逐一檢查偏移後的位置，只有列欄都在邊界內，且原地圖為*時才加1。地雷格則直接保留*。",
      "提示地圖與原始地圖分開，避免已改成數字的內容干擾後續判斷。每格最多檢查八個位置，所以整張圖仍是線性時間。0 0不是地圖；每組印Field #k:，兩組之間空一行，第一組之前不加空行。",
    ],
    complexity: "每張時間 O(nm)，空間 O(nm)。",
    pitfall: "對角線也算相鄰，超界位置不能存取；提示0也必須輸出。",
    traceLabel: "示意：2×2地圖 *./..",
    trace: [
      {
        title: "保留地雷",
        description: "(1,1)為地雷，原樣輸出。",
        cells: ["*", ".", ".", "."],
        active: [0],
        variables: [["已處理格數", "1"]],
      },
      {
        title: "右側與下側",
        description: "(1,2)、(2,1)各鄰接一顆地雷。",
        cells: ["*", "1", "1", "."],
        active: [1, 2],
        variables: [["相鄰數", "1"]],
      },
      {
        title: "右下角",
        description: "(2,2)也斜向鄰接地雷，答案為1。",
        cells: ["*", "1", "1", "1"],
        active: [3],
        variables: [["已處理格數", "4"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    int n, m, tc = 0;
    while (cin >> n >> m && (n || m)) {
        vector<string> g(n);
        for (auto &row : g)
            cin >> row;
        if (tc)
            cout << '\n';
        cout << "Field #" << ++tc << ":\n";
        for (int r = 0; r < n; ++r) {
            for (int c = 0; c < m; ++c) {
                if (g[r][c] == '*') {
                    cout << '*';
                    continue;
                }
                int count = 0;
                for (int dr = -1; dr <= 1; ++dr)
                    for (int dc = -1; dc <= 1; ++dc) {
                        if (!dr && !dc)
                            continue;
                        int y = r + dr, x = c + dc;
                        if (0 <= y && y < n && 0 <= x && x < m && g[y][x] == '*')
                            ++count;
                    }
                cout << count;
            }
            cout << '\n';
        }
    }
}`,
    python: String.raw`import sys

data = iter(sys.stdin.read().split())
tc = 0
for token in data:
    n, m = int(token), int(next(data))
    if n == m == 0:
        break
    grid = [next(data) for _ in range(n)]
    if tc:
        print()
    tc += 1
    print(f'Field #{tc}:')
    for r in range(n):
        out = []
        for c in range(m):
            if grid[r][c] == '*':
                out.append('*')
            else:
                count = sum(
                    0 <= r + dr < n and 0 <= c + dc < m and grid[r + dr][c + dc] == '*'
                    for dr in (-1, 0, 1)
                    for dc in (-1, 0, 1)
                    if dr or dc
                )
                out.append(str(count))
        print(''.join(out))
`,
  }),
  defineCpeLesson("a502", {
    topic: "simulation",
    level: "easy",
    concept: "雙重循環邊界與位元組狀態",
    goal: "模擬100格環狀記憶體與0到255的環狀數值。",
    explanation: [
      "保存100個整數與指標p，初始都為0。>與<只改p，分別加1或加99後對100取模；+與−只改目前格，分別加1或加255後對256取模。這樣處理回繞時不會遇到C++負餘數。",
      "點號對最終記憶體沒有影響，所以直接忽略，不印中間輸出。每個案例重新初始化，程式可能是空行，因此讀完T後以整行方式取得指令。最後依序印100個兩位大寫十六進位數，C++在下一個案例標號前切回十進位，避免標號也被印成十六進位。",
    ],
    complexity: "每筆時間 O(L+100)，空間 O(100)。",
    pitfall: "指標以100循環、內容以256循環；輸出FF而非−1，每值不足兩位補0。",
    traceLabel: "示意：-<+>",
    trace: [
      {
        title: "執行減號",
        description: "第0格由0減1回繞為255。",
        cells: ["格0=255", "格99=0"],
        active: [0],
        variables: [
          ["p", "0"],
          ["指令序號", "1"],
        ],
      },
      {
        title: "左移並加1",
        description: "p從0回繞到99，該格變成1。",
        cells: ["格0=255", "格99=1"],
        active: [1],
        variables: [
          ["p", "99"],
          ["指令序號", "3"],
        ],
      },
      {
        title: "右移",
        description: "p回到0，內容不變，輸出首格FF、末格01。",
        cells: ["FF", "中間98格00", "01"],
        active: [0],
        variables: [
          ["p", "0"],
          ["指令序號", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <iomanip>
#include <limits>
using namespace std;
int main() {
    int T;
    cin >> T;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    for (int tc = 1; tc <= T; ++tc) {
        string s;
        getline(cin, s);
        int memory[100] = {}, p = 0;
        for (char c : s) {
            if (c == '>')
                p = (p + 1) % 100;
            if (c == '<')
                p = (p + 99) % 100;
            if (c == '+')
                memory[p] = (memory[p] + 1) % 256;
            if (c == '-')
                memory[p] = (memory[p] + 255) % 256;
        }
        cout << dec << "Case " << tc << ':';
        for (int value : memory)
            cout << ' ' << uppercase << hex << setw(2) << setfill('0') << value;
        cout << '\n';
    }
}`,
    python: String.raw`import sys

T = int(sys.stdin.readline())
for tc in range(1, T + 1):
    memory = [0] * 100
    p = 0
    for c in sys.stdin.readline().rstrip('\r\n'):
        if c == '>':
            p = (p + 1) % 100
        elif c == '<':
            p = (p - 1) % 100
        elif c == '+':
            memory[p] = (memory[p] + 1) % 256
        elif c == '-':
            memory[p] = (memory[p] - 1) % 256
    print(f'Case {tc}: ' + ' '.join(f'{value:02X}' for value in memory))
`,
  }),
  defineCpeLesson("a503", {
    topic: "geometry",
    level: "easy",
    concept: "矩形交集與容斥面積",
    goal: "由重疊面積推導恰好一人及無人看守面積。",
    explanation: [
      "兩矩形交集的水平長度是max(0,min(x2a,x2b)−max(x1a,x1b))，垂直長度同理，相乘即共同面積S。各自面積為A、B，相加時共同區域被算兩次，所以恰好一人看守為W=A+B−2S。",
      "聯集面積是A+B−S，整片土地固定10000，因此無人看守U=10000−(A+B−S)。S+W+U應等於10000，可作驗算。只在邊或頂點接觸時，至少一軸長度為0，公式自然給出0。輸出Night k: S W U。",
    ],
    complexity: "每筆時間 O(1)，空間 O(1)。",
    pitfall:
      "不相交時兩軸都可能是負差，若直接相乘會變成假的正面積；各軸要先截為0。",
    traceLabel: "示意：(10,10)-(20,20)與(15,15)-(25,25)",
    trace: [
      {
        title: "求交集",
        description: "x與y皆重疊15到20，長5。",
        cells: ["寬5", "高5", "S=25"],
        active: [2],
        variables: [
          ["A", "100"],
          ["B", "100"],
        ],
      },
      {
        title: "恰好一人",
        description: "100+100−2×25=150。",
        cells: ["A+B=200", "扣50", "W=150"],
        active: [2],
        variables: [["W", "150"]],
      },
      {
        title: "無人區域",
        description: "聯集175，無人面積10000−175=9825。",
        cells: ["S=25", "W=150", "U=9825"],
        active: [2],
        variables: [["總和", "10000"]],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main() {
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int a, b, c, d, e, f, g, h;
        cin >> a >> b >> c >> d >> e >> f >> g >> h;
        int A = (c - a) * (d - b), B = (g - e) * (h - f);
        int S = max(0, min(c, g) - max(a, e)) * max(0, min(d, h) - max(b, f));
        cout << "Night " << tc << ": " << S << ' ' << A + B - 2 * S << ' ' << 10000 - A - B + S
             << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(data) + 1):
    a, b, c, d, e, f, g, h = (next(data) for _ in range(8))
    A, B = (c - a) * (d - b), (g - e) * (h - f)
    S = max(0, min(c, g) - max(a, e)) * max(0, min(d, h) - max(b, f))
    print(f'Night {tc}: {S} {A + B - 2 * S} {10000 - A - B + S}')
`,
  }),
  defineCpeLesson("a504", {
    topic: "combinatorics",
    level: "hard",
    concept: "最大位移排列與中位數分類",
    goal: "證明達最大距離的排列結構並用階乘計數。",
    explanation: [
      "把相鄰位置間的每條切線分開看，Σ|ai−i|等於跨越所有切線的元素次數總和。第t條切線左右各至多min(t,n−t)個元素能互換，所以此線貢獻至多2min(t,n−t)，總上界就是floor(n²/2)。n=2k時要每條線同時達上界，恰好是小值1到k全部放右半、大值k+1到2k全部放左半，兩半各自任排，共(k!)²。",
      "n=2k+1時以中位值k+1分類：它放中間有(k!)²種；若放左半，有k個位置可選，剩餘小值必放右半，大值占左半剩格及中央，合計k·(k!)²種；放右半同樣多。因此奇數答案為(2k+1)(k!)²。預讀所有n，階乘只算到max(n)/2，逐筆取模輸出，無案例數或哨兵。",
    ],
    complexity: "Q筆總時間 O(max n+Q)，空間 O(max n+Q)。",
    pitfall: "只算反向排列會漏掉大量同樣達最大距離的排列；奇數要乘n而非k+1。",
    traceLabel: "示意：n=3，最大距離4",
    trace: [
      {
        title: "中位值在中央",
        description: "排列321的距離2+0+2=4。",
        cells: ["3", "2", "1"],
        active: [1],
        variables: [
          ["中位位置", "2"],
          ["方案數", "1"],
        ],
      },
      {
        title: "中位值在左",
        description: "排列231的距離1+1+2=4。",
        cells: ["2", "3", "1"],
        active: [0],
        variables: [
          ["中位位置", "1"],
          ["累計方案", "2"],
        ],
      },
      {
        title: "中位值在右",
        description: "排列312的距離2+1+1=4，總數3。",
        cells: ["3", "1", "2"],
        active: [2],
        variables: [
          ["中位位置", "3"],
          ["答案", "3×(1!)²=3"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    const long long MOD = 1000000007;
    vector<int> queries;
    int n, limit = 0;
    while (cin >> n) {
        queries.push_back(n);
        limit = max(limit, n / 2);
    }
    vector<long long> fact(limit + 1, 1);
    for (int i = 1; i <= limit; ++i)
        fact[i] = fact[i - 1] * i % MOD;
    for (int x : queries) {
        long long answer = fact[x / 2] * fact[x / 2] % MOD;
        if (x % 2)
            answer = answer * x % MOD;
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys

MOD = 1000000007
queries = list(map(int, sys.stdin.buffer.read().split()))
limit = max(queries, default=0) // 2
fact = [1] * (limit + 1)
for i in range(1, limit + 1):
    fact[i] = fact[i - 1] * i % MOD
for n in queries:
    answer = fact[n // 2] ** 2 % MOD
    if n % 2:
        answer = answer * n % MOD
    print(answer)
`,
  }),
  defineCpeLesson("a505", {
    topic: "search",
    level: "hard",
    concept: "折半枚舉與重複子集合和計數",
    goal: "將2⁴⁰的搜尋拆成兩個約2²⁰的和表。",
    explanation: [
      "把元素按索引分成兩半，各自枚舉所有子集合和，包含空集合和0。生成和表時先放0，每加入x，就把所有舊和加x後接到表尾，因此每個索引選或不選恰出現一次。完整子集合唯一分解成左右各一個子集合，所需條件變成left+right=T。",
      "右半排序後，對每個左和用lower_bound、upper_bound計算T−left出現次數，不能只問是否存在，因為相同和可能代表不同子集合。最後若T=0扣掉左右皆空的唯一組合。負數使一般剪枝無效，和與計數都用64位元；答案最多2⁴⁰−1。逐筆讀到EOF。",
    ],
    complexity: "時間 O(N·2^(N/2))，空間 O(2^(N/2))。",
    pitfall:
      "相同數值的不同位置仍是不同選擇；去重和表會少算，空集合只能在T=0時扣一次。",
    traceLabel: "示意：元素1、−1、2，T=2",
    trace: [
      {
        title: "左右和表",
        description: "左半[1]得0、1；右半[−1,2]得0、−1、2、1。",
        cells: ["左:0,1", "右排序:−1,0,1,2"],
        active: [0, 1],
        variables: [
          ["T", "2"],
          ["組合對數", "8"],
        ],
      },
      {
        title: "左和0",
        description: "需右和2，對應只選元素2。",
        cells: ["左0", "右2", "總2"],
        active: [0, 1],
        variables: [
          ["新增", "1"],
          ["累積", "1"],
        ],
      },
      {
        title: "左和1",
        description: "需右和1，對應1−1+2，共兩個非空子集合。",
        cells: ["左1", "右1", "總2"],
        active: [0, 1],
        variables: [
          ["新增", "1"],
          ["答案", "2"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
vector<long long> sums(const vector<long long> &a, int l, int r) {
    vector<long long> result{0};
    result.reserve(size_t(1) << (r - l));
    for (int i = l; i < r; ++i) {
        size_t size = result.size();
        for (size_t j = 0; j < size; ++j)
            result.push_back(result[j] + a[i]);
    }
    return result;
}
int main() {
    int n;
    long long target;
    while (cin >> n >> target) {
        vector<long long> a(n);
        for (auto &x : a)
            cin >> x;
        auto left = sums(a, 0, n / 2), right = sums(a, n / 2, n);
        sort(right.begin(), right.end());
        long long answer = 0;
        for (long long x : left) {
            auto range = equal_range(right.begin(), right.end(), target - x);
            answer += range.second - range.first;
        }
        if (target == 0)
            --answer;
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys
from bisect import bisect_left, bisect_right


def sums(a):
    result = [0]
    for x in a:
        result += [s + x for s in result]
    return result


data = iter(map(int, sys.stdin.buffer.read().split()))
for n in data:
    target = next(data)
    a = [next(data) for _ in range(n)]
    left = sums(a[: n // 2])
    right = sorted(sums(a[n // 2 :]))
    answer = sum(bisect_right(right, target - x) - bisect_left(right, target - x) for x in left)
    print(answer - (target == 0))
`,
  }),
  defineCpeLesson("a506", {
    topic: "number-theory",
    level: "hard",
    concept: "LCM指數條件與乘法分離",
    goal: "由質因數分解直接求配對和，不重建巨大整數n。",
    explanation: [
      "先考慮有序配對(p,q)，設A是所有合法有序配對的第一項p之和。對質因數P^a，p的指數i<a時，q的指數只能為a，貢獻P^i一次；i=a時，q有0到a共a+1種，貢獻(a+1)P^a。因此每個質因數的局部和為1+P+…+P^(a−1)+(a+1)P^a，各質因數獨立，A等於局部和的乘積。",
      "有序配對的(p+q)總和為2A；非對角配對在有序表中重複兩次，唯一對角配對(n,n)則只一次、貢獻2n。所以無序總和f(n)=A+n。逐個質因數模乘，同時計算n mod MOD，不需除以2或建立n。指數最多50，直接累積冪和即可，輸出Case k: V。",
    ],
    complexity: "每筆時間 O(Σai)，額外空間 O(1)。",
    pitfall: "a+1是q可選的指數數量；對角配對不能漏算，最後要加n而不是2n。",
    traceLabel: "示意：n=6=2¹×3¹",
    trace: [
      {
        title: "處理質數2",
        description: "局部和1+2×2=5。",
        cells: ["P=2", "a=1", "局部5"],
        active: [2],
        variables: [
          ["A", "5"],
          ["n mod MOD", "2"],
        ],
      },
      {
        title: "處理質數3",
        description: "局部和1+2×3=7，乘起來A=35。",
        cells: ["局部5", "局部7", "A=35"],
        active: [2],
        variables: [
          ["A", "35"],
          ["n mod MOD", "6"],
        ],
      },
      {
        title: "補回對角修正",
        description: "f(6)=35+6=41，與五對p+q相加一致。",
        cells: ["7", "8", "5", "9", "12"],
        active: [0, 1, 2, 3, 4],
        variables: [
          ["配對數", "5"],
          ["總和", "41"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    const long long MOD = 1000000007;
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int count;
        cin >> count;
        long long A = 1, n = 1;
        while (count--) {
            long long p;
            int a;
            cin >> p >> a;
            long long power = 1, sum = 0;
            for (int i = 0; i < a; ++i) {
                sum = (sum + power) % MOD;
                power = power * p % MOD;
            }
            long long local = (sum + (a + 1) * power) % MOD;
            A = A * local % MOD;
            n = n * power % MOD;
        }
        cout << "Case " << tc << ": " << (A + n) % MOD << '\n';
    }
}`,
    python: String.raw`import sys

MOD = 1000000007
data = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(data) + 1):
    A = n = 1
    for _ in range(next(data)):
        p, a = next(data), next(data)
        power, total = 1, 0
        for _ in range(a):
            total = (total + power) % MOD
            power = power * p % MOD
        A = A * (total + (a + 1) * power) % MOD
        n = n * power % MOD
    print(f'Case {tc}: {(A + n) % MOD}')
`,
  }),
  defineCpeLesson("a507", {
    topic: "graphs",
    level: "hard",
    concept: "功能圖路徑與環的可達點數",
    goal: "在線性時間算出每個起點可到達的不同人數。",
    explanation: [
      "每個點恰有一條出邊，所以沿轉寄方向一直走，最終會碰到已解過的路徑或本次路徑中的環。用state=0、1、2區分未見、本輪路徑、已完成，另記每點進入路徑的位置。若碰到本輪state=1的點，它到路徑尾端正好是一個環，所有環點的可達數都是環長。",
      "環前方的點倒序計算reach[u]=1+reach[next[u]]；若終點原本已完成，也直接倒序套用同式。每輪把整條路徑標為完成，故每點只加入路徑一次，且不用遞迴避免5萬層堆疊。最後依編號遞增掃描，只有嚴格較大才更新，保留並列時最小編號。",
    ],
    complexity: "每筆時間 O(N)，空間 O(N)。",
    pitfall:
      "環內不是reach[u]=1+reach[next[u]]，否則會無限依賴；先統一設為環長。",
    traceLabel: "示意：1→2、2→1、3→2、4→3",
    trace: [
      {
        title: "辨認環",
        description: "從1走到2又回1，環長2。",
        cells: ["1→2", "2→1", "3→2", "4→3"],
        active: [0, 1],
        variables: [
          ["reach[1]", "2"],
          ["reach[2]", "2"],
        ],
      },
      {
        title: "處理3",
        description: "3接到已完成的2，reach[3]=1+2=3。",
        cells: ["1:2", "2:2", "3:3", "4:待算"],
        active: [2],
        variables: [["reach[3]", "3"]],
      },
      {
        title: "處理4",
        description: "4接3，reach[4]=4，最佳起點是4。",
        cells: ["1:2", "2:2", "3:3", "4:4"],
        active: [3],
        variables: [
          ["最大可達數", "4"],
          ["答案", "4"],
        ],
      },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    for (int tc = 1; tc <= T; ++tc) {
        int n;
        cin >> n;
        vector<int> next(n + 1), state(n + 1), pos(n + 1), reach(n + 1);
        for (int i = 0, u, v; i < n; ++i) {
            cin >> u >> v;
            next[u] = v;
        }
        for (int start = 1; start <= n; ++start)
            if (!state[start]) {
                vector<int> path;
                int u = start;
                while (!state[u]) {
                    state[u] = 1;
                    pos[u] = (int)path.size();
                    path.push_back(u);
                    u = next[u];
                }
                int end = (int)path.size();
                if (state[u] == 1) {
                    int begin = pos[u], length = end - begin;
                    for (int i = begin; i < end; ++i)
                        reach[path[i]] = length;
                    end = begin;
                }
                for (int i = end - 1; i >= 0; --i)
                    reach[path[i]] = 1 + reach[next[path[i]]];
                for (int v : path)
                    state[v] = 2;
            }
        int answer = 1;
        for (int i = 2; i <= n; ++i)
            if (reach[i] > reach[answer])
                answer = i;
        cout << "Case " << tc << ": " << answer << '\n';
    }
}`,
    python: String.raw`import sys

data = iter(map(int, sys.stdin.buffer.read().split()))
for tc in range(1, next(data) + 1):
    n = next(data)
    nxt = [0] * (n + 1)
    for _ in range(n):
        u, v = next(data), next(data)
        nxt[u] = v
    state, pos, reach = [0] * (n + 1), [0] * (n + 1), [0] * (n + 1)
    for start in range(1, n + 1):
        if state[start]:
            continue
        path = []
        u = start
        while state[u] == 0:
            state[u] = 1
            pos[u] = len(path)
            path.append(u)
            u = nxt[u]
        end = len(path)
        if state[u] == 1:
            begin = pos[u]
            length = end - begin
            for v in path[begin:]:
                reach[v] = length
            end = begin
        for v in reversed(path[:end]):
            reach[v] = 1 + reach[nxt[v]]
        for v in path:
            state[v] = 2
    answer = max(range(1, n + 1), key=lambda u: reach[u])
    print(f'Case {tc}: {answer}')
`,
  }),
];
