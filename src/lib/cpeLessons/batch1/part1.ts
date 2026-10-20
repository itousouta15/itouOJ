import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a460", {
    topic: "simulation", level: "easy", concept: "骰子六面置換", goal: "以同時更新六個面的方式精確模擬翻滾。",
    explanation: [
      "用 t、b、n、s、w、e 記錄目前上、下、北、南、西、東面的點數，初值為 1、6、2、5、3、4。向北翻時，新上面來自舊南面，新北面來自舊上面，新下面來自舊北面，新南面來自舊下面；東西面不變。其餘方向也只是四個面的循環置換。",
      "每個指令先保存舊狀態，再一次指派新狀態，才能避免前一個賦值覆蓋後續仍要用的點數。相對面總和始終為 7，是檢查模擬的好方法。每局重新初始化，讀到 n=0 就結束，最後只輸出頂面，不輸出指令過程。",
    ], complexity: "每局時間 O(n)，額外空間 O(1)。", pitfall: "north 之後上面是舊南面 5，不是舊北面 2；勿混淆翻滾方向與觀看方向。",
    traceLabel: "示意：north、east、south",
    trace: [
      { title: "初始", description: "以題目指定的三面及相對面建立六面。", cells: ["上1", "下6", "北2", "南5", "西3", "東4"], active: [0], variables: [["指令數", "0"], ["頂面", "1"]] },
      { title: "向北再向東", description: "向北後上5、北1；向東後上3、東5、西2。", cells: ["上3", "下4", "北1", "南6", "西2", "東5"], active: [0, 4, 5], variables: [["指令數", "2"], ["頂面", "3"]] },
      { title: "向南", description: "舊北面1翻到上方，因此答案為1。", cells: ["上1", "下6", "北4", "南3", "西2", "東5"], active: [0, 2, 3], variables: [["指令數", "3"], ["輸出", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int count;
    while (cin >> count && count) {
        int t=1, b=6, n=2, s=5, w=3, e=4;
        while (count--) {
            string command; cin >> command;
            int T=t, B=b, N=n, S=s, W=w, E=e;
            if (command=="north") { t=S; n=T; b=N; s=B; }
            if (command=="south") { t=N; s=T; b=S; n=B; }
            if (command=="east")  { t=W; e=T; b=E; w=B; }
            if (command=="west")  { t=E; w=T; b=W; e=B; }
        }
        cout << t << '\n';
    }
}`,
    python: String.raw`import sys
tokens = iter(sys.stdin.read().split())
for token in tokens:
    count = int(token)
    if count == 0:
        break
    t, b, n, s, w, e = 1, 6, 2, 5, 3, 4
    for _ in range(count):
        command = next(tokens)
        if command == 'north':
            t, n, b, s = s, t, n, b
        elif command == 'south':
            t, s, b, n = n, t, s, b
        elif command == 'east':
            t, e, b, w = w, t, e, b
        else:
            t, w, b, e = e, t, w, b
    print(t)
`,
  }),
  defineCpeLesson("a461", {
    topic: "search", level: "medium", concept: "等差累積天數與下界二分", goal: "找出累積住宿天數首次涵蓋 D 的團體。",
    explanation: [
      "若最後處理到人數 x，從 S 到 x 的團體總共住了 F(x)=(S+x)(x-S+1)/2 天。第 D 天的團體就是最小的 x≥S，使 F(x)≥D。F 隨 x 嚴格增加，因此可以用二分搜尋，不必模擬最多數千萬個團體。",
      "先從 S 開始倍增上界，直到累積天數足夠，再二分第一個可行值。公式的兩個乘數中必有一個偶數，先除以 2 再相乘，且全程用 64 位元整數；本題倍增取得的上界仍讓乘積安全。每對 S、D 讀到 EOF，各輸出一行，剛好落在退房當天仍屬於該團。",
    ], complexity: "每筆時間 O(log(S+√D))，額外空間 O(1)。", pitfall: "比較條件必須是累積天數 ≥D；浮點平方根直接取整可能在邊界偏一。",
    traceLabel: "示意：S=3，D=10",
    trace: [
      { title: "累積3人團", description: "3人團涵蓋第1到3天，還未涵蓋第10天。", cells: ["x=3", "F=3", "D=10"], active: [1], variables: [["可行", "否"], ["下界", "3"]] },
      { title: "檢查4人團", description: "3+4=7，仍不足10。", cells: ["x=4", "F=7", "D=10"], active: [1], variables: [["可行", "否"], ["新下界", "5"]] },
      { title: "找到第一個可行值", description: "3+4+5=12，且前一團只到7，故第10天是5人團。", cells: ["x=5", "F=12", "第8–12天"], active: [0, 2], variables: [["答案", "5"], ["F(4)", "7"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
long long days(long long s, long long x) {
    long long a=s+x, b=x-s+1;
    if (a%2==0) a/=2; else b/=2;
    return a*b;
}
int main() {
    long long s,d;
    while (cin >> s >> d) {
        long long lo=s, hi=s;
        while (days(s,hi)<d) hi*=2;
        while (lo<hi) {
            long long mid=lo+(hi-lo)/2;
            if (days(s,mid)>=d) hi=mid;
            else lo=mid+1;
        }
        cout << lo << '\n';
    }
}`,
    python: String.raw`import sys
data = list(map(int, sys.stdin.buffer.read().split()))
for s, d in zip(data[::2], data[1::2]):
    def days(x):
        return (s + x) * (x - s + 1) // 2
    lo = hi = s
    while days(hi) < d:
        hi *= 2
    while lo < hi:
        mid = (lo + hi) // 2
        if days(mid) >= d:
            hi = mid
        else:
            lo = mid + 1
    print(lo)
`,
  }),
  defineCpeLesson("a462", {
    topic: "basics", level: "easy", concept: "差值集合與完整性", goal: "檢查 n−1 個相鄰差是否恰好是1到n−1。",
    explanation: [
      "對每對相鄰數計算絕對差 d，使用長度 n 的布林陣列記錄是否看過。若 d 不在1到n−1，或同一差值重複出現，立即把合法旗標設為假，但仍須讀完這筆資料。",
      "總共只有 n−1 個差值；若它們都在指定範圍且互不重複，就必然把 n−1 個目標值全部用完，毋須排序。n=1 時沒有差值，因此自然通過。輸入沒有筆數或哨兵，讀到 EOF；C++ 先提升為 long long 再相減，避免較大正負數相減溢位。",
    ], complexity: "每筆時間 O(n)，空間 O(n)。", pitfall: "0 不屬於合法差值，重複值也不能當作補足缺少的差。輸出 Not jolly 的 j 為小寫。",
    traceLabel: "示意：1、4、2、3",
    trace: [
      { title: "第一個差", description: "|4−1|=3，標記3。", cells: ["差1:未見", "差2:未見", "差3:已見"], active: [2], variables: [["d", "3"], ["合法", "是"]] },
      { title: "第二個差", description: "|2−4|=2，標記2。", cells: ["差1:未見", "差2:已見", "差3:已見"], active: [1], variables: [["d", "2"], ["已見數", "2"]] },
      { title: "第三個差", description: "|3−2|=1，三個目標差均出現一次。", cells: ["差1:已見", "差2:已見", "差3:已見"], active: [0], variables: [["d", "1"], ["輸出", "Jolly"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <cstdlib>
using namespace std;
int main() {
    int n;
    while (cin >> n) {
        vector<bool> seen(n,false);
        long long prev; cin >> prev;
        bool ok=true;
        for (int i=1;i<n;++i) {
            long long x; cin >> x;
            long long d=llabs(x-prev);
            if (d<1 || d>=n || seen[d]) ok=false;
            else seen[d]=true;
            prev=x;
        }
        cout << (ok ? "Jolly" : "Not jolly") << '\n';
    }
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
for n in data:
    seen = set()
    prev = next(data)
    ok = True
    for _ in range(n - 1):
        x = next(data)
        d = abs(x - prev)
        if not 1 <= d < n or d in seen:
            ok = False
        seen.add(d)
        prev = x
    print('Jolly' if ok else 'Not jolly')
`,
  }),
  defineCpeLesson("a463", {
    topic: "basics", level: "easy", concept: "連續答對長度累積", goal: "以連續 O 長度計算每一題的得分。",
    explanation: [
      "設 run 是目前字元結尾的連續 O 數量。讀到 O 時 run 加1，這一題正好得到 run 分；讀到 X 時 run 歸零，該題不加分。total 累加每題得分，即可在一次掃描中算出答案。",
      "掃描完前 i 題後，run 只代表結尾那段連勝，total 則代表整個前綴總分，兩者不能混用。長度小於80，用一般整數足夠。先讀測試筆數 T，每筆重新把兩個累積器歸零，每筆只輸出分數。",
    ], complexity: "時間 O(L)，額外空間 O(1)。", pitfall: "遇到 X 要清除連續長度，而不是清除已得到的總分。",
    traceLabel: "示意：OOXO",
    trace: [
      { title: "第一個O", description: "連續長度1，得1分。", cells: ["O", "O", "X", "O"], active: [0], variables: [["run", "1"], ["total", "1"]] },
      { title: "第二個O", description: "連續長度2，再得2分。", cells: ["O", "O", "X", "O"], active: [1], variables: [["run", "2"], ["total", "3"]] },
      { title: "X後重新開始", description: "X把run設0，最後O又得1分。", cells: ["O", "O", "X", "O"], active: [2, 3], variables: [["run", "1"], ["total", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    int T; cin >> T;
    while (T--) {
        string s; cin >> s;
        int run=0, total=0;
        for (char c:s) {
            if (c=='O') total += ++run;
            else run=0;
        }
        cout << total << '\n';
    }
}`,
    python: String.raw`import sys
data = sys.stdin.read().split()
for s in data[1:1 + int(data[0])]:
    run = total = 0
    for c in s:
        if c == 'O':
            run += 1
            total += run
        else:
            run = 0
    print(total)
`,
  }),
  defineCpeLesson("a464", {
    topic: "math", level: "easy", concept: "奇數列的平方累計公式", goal: "從該行長度直接推導末三個奇數總和。",
    explanation: [
      "行長依次為1、3、5……N，因此這是第 r=(N+1)/2 行。前 r 行共放入1+3+…+(2r−1)=r²個奇數，而第 k 個正奇數是2k−1，所以該行最後一數 L=2r²−1。",
      "最後三個數就是 L−4、L−2、L，總和為3L−6。N 至少為3，所以一定有三個數。不需建立巨大序列；N 可接近10⁹，所有平方與乘法一開始就使用64位元整數，答案仍在題目保證的範圍內。逐筆讀到 EOF。",
    ], complexity: "每筆時間 O(1)，額外空間 O(1)。", pitfall: "N 是該行的數量而非行號；用32位元計算 r*r 會溢位。",
    traceLabel: "示意：N=5",
    trace: [
      { title: "轉成行號", description: "每行長度2r−1，故r=3。", cells: ["1", "3", "5"], active: [2], variables: [["N", "5"], ["r", "3"]] },
      { title: "定位最後奇數", description: "前三行共9個奇數，第9個為17。", cells: ["9", "11", "13", "15", "17"], active: [4], variables: [["r²", "9"], ["L", "17"]] },
      { title: "加末三項", description: "13+15+17=45，等於3×17−6。", cells: ["13", "15", "17"], active: [0, 1, 2], variables: [["總和", "45"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n) {
        long long r=(n+1)/2;
        long long last=2*r*r-1;
        cout << 3*last-6 << '\n';
    }
}`,
    python: String.raw`import sys
for n in map(int, sys.stdin.buffer.read().split()):
    r = (n + 1) // 2
    last = 2 * r * r - 1
    print(3 * last - 6)
`,
  }),
  defineCpeLesson("a465", {
    topic: "trees", level: "easy", concept: "堆疊與最近未配對括號", goal: "用後進先出順序判定不同種類的括號是否正確巢狀。",
    explanation: [
      "掃描字串，遇到左括號就壓入堆疊。右括號必須配對最近尚未配對的左括號，也就是堆疊頂端；空堆疊或種類不符都代表不合法。完成一次配對就彈出頂端，維持堆疊只包含未配對左括號的不變量。",
      "掃描結束後還必須檢查堆疊為空，避免把只有左括號的字串判成合法。題目允許空字串，所以讀完筆數後須用整行讀取，不能用跳過空白的字串輸入。空行會得到空堆疊，因此輸出 Yes。",
    ], complexity: "時間 O(L)，空間 O(L)。", pitfall: "只比較左右括號數量會把 ([)] 誤判為合法；空行是資料，不能略過。",
    traceLabel: "示意：([])",
    trace: [
      { title: "讀入兩個左括號", description: "先壓入(，再壓入[。", cells: ["(", "["], active: [1], variables: [["已讀字元", "2"], ["堆疊大小", "2"]] },
      { title: "配對方括號", description: "]與頂端[配對並彈出。", cells: ["("], active: [0], variables: [["已讀字元", "3"], ["堆疊大小", "1"]] },
      { title: "配對圓括號", description: ")配對後堆疊清空，字串合法。", cells: ["空堆疊"], active: [0], variables: [["已讀字元", "4"], ["輸出", "Yes"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <limits>
using namespace std;
int main() {
    int T; cin >> T;
    cin.ignore(numeric_limits<streamsize>::max(),'\n');
    while (T--) {
        string s, stack; getline(cin,s);
        if (!s.empty() && s.back()=='\r') s.pop_back();
        bool ok=true;
        for (char c:s) {
            if (c=='(' || c=='[') stack+=c;
            else {
                char want=(c==')' ? '(' : '[');
                if (stack.empty() || stack.back()!=want) { ok=false; break; }
                stack.pop_back();
            }
        }
        cout << (ok && stack.empty() ? "Yes" : "No") << '\n';
    }
}`,
    python: String.raw`import sys
T = int(sys.stdin.readline())
for _ in range(T):
    s = sys.stdin.readline().rstrip('\r\n')
    stack = []
    ok = True
    for c in s:
        if c in '([':
            stack.append(c)
        elif not stack or stack.pop() != {')': '(', ']': '['}[c]:
            ok = False
            break
    print('Yes' if ok and not stack else 'No')
`,
  }),
  defineCpeLesson("a466", {
    topic: "strings", level: "easy", concept: "英文字母區段起點", goal: "計算由非字母轉入字母的次數。",
    explanation: [
      "單字是最大的連續英文字母片段，不能只以空白切割，因為數字與標點也會分開單字。保存 inside 表示上一字元是否為英文字母；當目前是字母而 inside 為假時，正好開始一個新單字，答案加1。",
      "接著把 inside 更新成目前字元的分類，遇到任何非字母都能重新準備下一次計數。每行獨立初始化，使用整行讀取直到 EOF，明確檢查 A–Z、a–z，避免 Unicode 字母分類超出題意。即使遇到空行，這個方法也會合理輸出0。",
    ], complexity: "每行時間 O(L)，額外空間 O(1)。", pitfall: "abc123def 是兩個單字；split() 只按空白切割並不符合定義。",
    traceLabel: "示意：Hi,2Bob!",
    trace: [
      { title: "遇到H", description: "由非字母狀態進入字母，計數1。", cells: ["Hi", ",2", "Bob", "!"], active: [0], variables: [["inside", "1"], ["count", "1"]] },
      { title: "逗號與數字", description: "非字母讓inside歸零，數字不算單字。", cells: ["Hi", ",2", "Bob", "!"], active: [1], variables: [["inside", "0"], ["count", "1"]] },
      { title: "遇到B", description: "開始第二段字母，最後驚嘆號不增加計數。", cells: ["Hi", ",2", "Bob", "!"], active: [2, 3], variables: [["inside（行末）", "0"], ["count", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main() {
    string line;
    while (getline(cin,line)) {
        int count=0; bool inside=false;
        for (char c:line) {
            bool letter=('A'<=c && c<='Z') || ('a'<=c && c<='z');
            if (letter && !inside) ++count;
            inside=letter;
        }
        cout << count << '\n';
    }
}`,
    python: String.raw`import sys
for line in sys.stdin:
    inside = False
    count = 0
    for c in line:
        letter = 'A' <= c <= 'Z' or 'a' <= c <= 'z'
        if letter and not inside:
            count += 1
        inside = letter
    print(count)
`,
  }),
  defineCpeLesson("a467", {
    topic: "strings", level: "easy", concept: "跨行保留的引號狀態", goal: "交替替換雙引號，原樣保留其他字元。",
    explanation: [
      "設 opening 表示下一個雙引號是否為開引號，初值為真。逐字讀入時，若是雙引號就依狀態輸出兩個反引號或兩個單引號，然後反轉狀態；其他字元直接輸出。這相當於只記錄已遇到引號數量的奇偶性。",
      "狀態屬於整份文件而不是單行，因此換行不會重新設定 opening。使用逐字串流或一次讀取完整文字，能保留多個空白、空行，以及檔尾原本有沒有換行；輸出時不能自行額外補上換行。",
    ], complexity: "時間 O(L)；C++ 額外空間 O(1)，Python 收集輸出為 O(L)。", pitfall: "反引號與單引號不同；原本已存在的單引號或反引號都不應被改寫。",
    traceLabel: "示意：雙引號跨越兩行",
    trace: [
      { title: "第一個雙引號", description: "輸出兩個ASCII 96，切換為等待閉引號。", cells: ["輸入ASCII34", "輸出96,96"], active: [1], variables: [["引號序號", "1"], ["opening", "0"]] },
      { title: "文字與換行", description: "字母A與換行照抄，狀態維持等待閉引號。", cells: ["A", "換行ASCII10", "B"], active: [1], variables: [["引號序號", "1"], ["opening", "0"]] },
      { title: "第二個雙引號", description: "輸出兩個ASCII 39，回到等待開引號。", cells: ["輸入ASCII34", "輸出39,39"], active: [1], variables: [["引號序號", "2"], ["opening", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    bool opening=true;
    char c;
    while (cin.get(c)) {
        if (c=='"') {
            if (opening) cout << char(96) << char(96);
            else cout << "''";
            opening=!opening;
        } else cout << c;
    }
}`,
    python: String.raw`import sys
opening = True
out = []
for c in sys.stdin.read():
    if c == '"':
        out.append(chr(96) * 2 if opening else "''")
        opening = not opening
    else:
        out.append(c)
sys.stdout.write(''.join(out))
`,
  }),
  defineCpeLesson("a468", {
    topic: "math", level: "easy", concept: "空瓶資源守恆", goal: "用每次兌換淨消耗兩個空瓶推導最大飲用量。",
    explanation: [
      "最初N瓶喝完後有N個空瓶。每換一瓶，要交出3個空瓶，但喝完又拿回1個，所以每次額外喝到一瓶的淨成本是2個空瓶。即使先借B個，結束還要還B個，因此額外瓶數最多為 floor(N/2)。",
      "這個上界可以達成：持續正常兌換，剩2個空瓶時借1個，換到最後一瓶後用新空瓶還債；剩1個時就停止。故總數為N+floor(N/2)。逐筆讀到 EOF，不需另外模擬借瓶；N=1時不能憑空多喝一瓶。",
    ], complexity: "每筆時間 O(1)，空間 O(1)。", pitfall: "只模擬正常兌換會漏掉剩2瓶時可借1瓶的最後一次；借來的瓶子必須歸還。",
    traceLabel: "示意：N=8，先借1個空瓶",
    trace: [
      { title: "喝完初始可樂", description: "喝8瓶，加上借的1個，共9個空瓶。", cells: ["空瓶9", "欠瓶1"], active: [0], variables: [["已喝", "8"], ["淨空瓶", "8"]] },
      { title: "換三瓶", description: "9空瓶換3瓶，喝完留下3空瓶。", cells: ["空瓶3", "欠瓶1"], active: [0], variables: [["已喝", "11"], ["淨空瓶", "2"]] },
      { title: "最後兌換並還債", description: "3空瓶換1瓶，喝完留下1瓶歸還，共喝12瓶。", cells: ["空瓶0", "欠瓶0"], active: [0, 1], variables: [["已喝", "12"], ["額外瓶數", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int n;
    while (cin >> n) cout << n+n/2 << '\n';
}`,
    python: String.raw`import sys
for n in map(int, sys.stdin.buffer.read().split()):
    print(n + n // 2)
`,
  }),
  defineCpeLesson("a469", {
    topic: "basics", level: "easy", concept: "雙向單調性檢查", goal: "同時維護遞增與遞減兩種可能。",
    explanation: [
      "十個長度互異，因此有序只可能是嚴格遞增或嚴格遞減。建立 increasing、decreasing 兩個旗標；每對相鄰數若未上升就否定 increasing，若未下降就否定 decreasing。只要其中一個旗標存活，整列就是 Ordered。",
      "旗標一旦為假就不能因後面的比較改回真，因為前面的違規仍然存在。不需實際排序，排序反而會消除原始順序。先輸出一次 Lumberjacks:，再依測試組數每組輸出一個判斷。",
    ], complexity: "每組10個數，時間 O(10)，空間 O(10)。", pitfall: "標題只印一次；不能只看第一個與最後一個數字。",
    traceLabel: "示意：1、2、3、4、5、6、7、8、10、9",
    trace: [
      { title: "比較1到2", description: "上升排除遞減的可能。", cells: ["1", "2", "…", "8", "10", "9"], active: [0, 1], variables: [["increasing", "1"], ["decreasing", "0"]] },
      { title: "比較8到10", description: "目前仍維持遞增。", cells: ["1", "2", "…", "8", "10", "9"], active: [3, 4], variables: [["increasing", "1"], ["decreasing", "0"]] },
      { title: "比較10到9", description: "出現下降，兩種可能都被排除。", cells: ["1", "2", "…", "8", "10", "9"], active: [4, 5], variables: [["increasing", "0"], ["輸出", "Unordered"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int T; cin >> T;
    cout << "Lumberjacks:\n";
    while (T--) {
        int a[10]; for (int &x:a) cin >> x;
        bool up=true, down=true;
        for (int i=1;i<10;++i) {
            up = up && a[i]>a[i-1];
            down = down && a[i]<a[i-1];
        }
        cout << (up || down ? "Ordered" : "Unordered") << '\n';
    }
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
T = next(data)
print('Lumberjacks:')
for _ in range(T):
    a = [next(data) for _ in range(10)]
    up = all(a[i] > a[i - 1] for i in range(1, 10))
    down = all(a[i] < a[i - 1] for i in range(1, 10))
    print('Ordered' if up or down else 'Unordered')
`,
  }),
  defineCpeLesson("a470", {
    topic: "strings", level: "easy", concept: "逐位置母音等價", goal: "辨別只有母音替換的名字是否等價。",
    explanation: [
      "替換不會增加或刪除字元，所以先確認兩名字等長。每個位置若字元相同就通過；若不同，必須兩者都在aeiou中，才能用母音替換解釋這個差異。只要一個位置不符合，整個名字就不等價。",
      "這是逐位置的條件，不能只比較子音出現的順序或母音總數。掃描期間維持『已檢查的所有位置都可轉換』，全部完成後才能輸出 Yes。輸入先給筆數，名稱僅含小寫英文字母，因此直接讀字串即可。",
    ], complexity: "每筆時間 O(L)，額外空間 O(1)。", pitfall: "母音與子音不互通；長度不同時不可只用 zip 比較共同前綴。",
    traceLabel: "示意：pele與pola",
    trace: [
      { title: "確認長度", description: "兩者長度都為4，可逐位置比較。", cells: ["p/p", "e/o", "l/l", "e/a"], active: [0], variables: [["長度A", "4"], ["長度B", "4"]] },
      { title: "比較第二格", description: "e和o不同，但皆為母音。", cells: ["p/p", "e/o", "l/l", "e/a"], active: [1], variables: [["位置", "2"], ["可轉換", "1"]] },
      { title: "比較最後一格", description: "l相同，e與a也是母音，所有位置通過。", cells: ["p/p", "e/o", "l/l", "e/a"], active: [2, 3], variables: [["通過位置數", "4"], ["輸出", "Yes"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
bool vowel(char c) { return string("aeiou").find(c)!=string::npos; }
int main() {
    int T; cin >> T;
    while (T--) {
        string a,b; cin >> a >> b;
        bool ok=a.size()==b.size();
        if (ok) for (size_t i=0;i<a.size();++i)
            if (a[i]!=b[i] && !(vowel(a[i]) && vowel(b[i]))) ok=false;
        cout << (ok ? "Yes" : "No") << '\n';
    }
}`,
    python: String.raw`import sys
data = iter(sys.stdin.read().split())
T = int(next(data))
vowels = set('aeiou')
for _ in range(T):
    a, b = next(data), next(data)
    ok = len(a) == len(b) and all(
        x == y or (x in vowels and y in vowels) for x, y in zip(a, b))
    print('Yes' if ok else 'No')
`,
  }),
  defineCpeLesson("a471", {
    topic: "search", level: "easy", concept: "以數字和上界縮小生成數範圍", goal: "只枚舉可能生成目標的短區間，找最小答案。",
    explanation: [
      "生成數 x 滿足 x+digitSum(x)=N，所以 x≤N。若N有d位，x最多也有d位，各位和不超過9d，故x至少為N−9d。從max(1,N−9d)依序嘗試到N，已涵蓋所有候選。",
      "逐個計算十進位各位和，一旦等於N就停止，因為由小到大搜尋，第一個解必為最小生成數。沒有候選成功才輸出0。先讀T，不能把第一個數當作目標；N=1等小數也要保證起點不為負。",
    ], complexity: "每筆時間 O(d²)，空間 O(d)（數字轉字串）；d為目標位數。", pitfall: "216有198與207兩個生成數，找到任意一個不等於找到最小者。",
    traceLabel: "示意：N=216",
    trace: [
      { title: "設定搜尋區間", description: "d=3，候選至少216−27=189。", cells: ["189", "…", "197", "198", "…", "216"], active: [0], variables: [["d", "3"], ["起點", "189"]] },
      { title: "檢查197", description: "197+1+9+7=214，未命中。", cells: ["197", "+17", "214"], active: [0, 2], variables: [["x", "197"], ["生成結果", "214"]] },
      { title: "檢查198", description: "198+1+9+8=216，這是第一個命中。", cells: ["198", "+18", "216"], active: [0, 2], variables: [["x", "198"], ["答案", "198"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    int T; cin >> T;
    while (T--) {
        int n; cin >> n;
        int answer=0, d=(int)to_string(n).size();
        for (int x=max(1,n-9*d);x<=n;++x) {
            int sum=x;
            for (int v=x;v;v/=10) sum+=v%10;
            if (sum==n) { answer=x; break; }
        }
        cout << answer << '\n';
    }
}`,
    python: String.raw`import sys
data = list(map(int, sys.stdin.buffer.read().split()))
for n in data[1:1 + data[0]]:
    answer = 0
    for x in range(max(1, n - 9 * len(str(n))), n + 1):
        if x + sum(map(int, str(x))) == n:
            answer = x
            break
    print(answer)
`,
  }),
  defineCpeLesson("a472", {
    topic: "basics", level: "easy", concept: "十進位數字頻率桶", goal: "統計1到N所有整數的每個十進位數字。",
    explanation: [
      "準備10個計數器，對1到N逐一取出十進位數字，出現哪一位就增加對應計數。由於N小於10000，直接枚舉至多約四萬個字元，足夠有效率，也不必推導複雜的位數統計公式。",
      "每個數字各自正常表示，不能補前導零，因為那些零並未寫在題目的串接字串裡。每筆資料重設計數器，最後依0到9固定順序輸出十個值，以單一空白分隔。讀取測試筆數T後再處理N。",
    ], complexity: "時間 O(N log N)，額外空間 O(1)。", pitfall: "十進位10要同時計入1和0；輸出零次的數字仍須保留欄位。",
    traceLabel: "示意：N=12，觀察0、1、2",
    trace: [
      { title: "處理1到9", description: "每個非零數字各出現一次。", cells: ["0:0", "1:1", "2:1"], active: [1, 2], variables: [["已處理上界", "9"], ["總字元", "9"]] },
      { title: "加入10與11", description: "10貢獻一個0、一個1；11貢獻兩個1。", cells: ["0:1", "1:4", "2:1"], active: [0, 1], variables: [["已處理上界", "11"], ["總字元", "13"]] },
      { title: "加入12", description: "再增加一個1與一個2，得到最終桶值。", cells: ["0:1", "1:5", "2:2"], active: [1, 2], variables: [["已處理上界", "12"], ["總字元", "15"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    int T; cin >> T;
    while (T--) {
        int n; cin >> n;
        int count[10]={};
        for (int x=1;x<=n;++x)
            for (int v=x;v;v/=10) ++count[v%10];
        for (int d=0;d<10;++d) cout << (d ? " " : "") << count[d];
        cout << '\n';
    }
}`,
    python: String.raw`import sys
data = list(map(int, sys.stdin.buffer.read().split()))
for n in data[1:1 + data[0]]:
    count = [0] * 10
    for x in range(1, n + 1):
        for c in str(x):
            count[int(c)] += 1
    print(*count)
`,
  }),
  defineCpeLesson("a473", {
    topic: "sorting", level: "easy", concept: "逆序對與相鄰交換下界", goal: "以逆序對數得到最少相鄰交換次數。",
    explanation: [
      "若i<j卻a[i]>a[j]，這兩節車廂就是一個逆序對。排序完成時逆序對必為0，而交換相鄰的逆序車廂恰好減少一個逆序對，因此原始逆序對數是必要交換次數的下界。",
      "氣泡排序每次交換相鄰逆序，直到沒有逆序為止，確實能以這個次數完成，因此下界可達成。L≤50，直接枚舉所有i<j計數就足夠，不必真的交換。L=0時讀取零個車廂，答案0；輸出完整指定英文句子及句點。",
    ], complexity: "每筆時間 O(L²)，空間 O(L)。", pitfall: "任意交換與相鄰交換不同；即使答案是1，題目格式仍寫 swaps.。",
    traceLabel: "示意：3、1、2",
    trace: [
      { title: "初始逆序", description: "(3,1)、(3,2)共兩個逆序對。", cells: ["3", "1", "2"], active: [0, 1, 2], variables: [["逆序數", "2"], ["交換數", "0"]] },
      { title: "交換3與1", description: "消除其中一個逆序。", cells: ["1", "3", "2"], active: [0, 1], variables: [["逆序數", "1"], ["交換數", "1"]] },
      { title: "交換3與2", description: "序列有序，共交換2次。", cells: ["1", "2", "3"], active: [1, 2], variables: [["逆序數", "0"], ["最少交換", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main() {
    int T; cin >> T;
    while (T--) {
        int n; cin >> n;
        vector<int> a(n); for (int &x:a) cin >> x;
        int swaps=0;
        for (int i=0;i<n;++i)
            for (int j=i+1;j<n;++j) swaps+=(a[i]>a[j]);
        cout << "Optimal train swapping takes " << swaps << " swaps.\n";
    }
}`,
    python: String.raw`import sys
data = iter(map(int, sys.stdin.buffer.read().split()))
T = next(data)
for _ in range(T):
    n = next(data)
    a = [next(data) for _ in range(n)]
    swaps = sum(a[i] > a[j] for i in range(n) for j in range(i + 1, n))
    print(f'Optimal train swapping takes {swaps} swaps.')
`,
  }),
  defineCpeLesson("a474", {
    topic: "number-theory", level: "easy", concept: "因數配對與完全平方數", goal: "把燈泡切換次數的奇偶性轉成平方判定。",
    explanation: [
      "第n盞燈只在趟數整除n時被切換，所以總切換次數等於n的正因數個數。一般因數d都可以與n/d配成一對，兩次切換互相抵消；只有n為平方數時，平方根因數與自己配對，留下奇數次切換。",
      "所以答案只取決於是否完全平方。用整數二分找floor(√n)，再平方驗證；n≤2³²−1，平方根不超過65535，以64位元計算中點平方安全。0是結束符號，不輸出它的答案，輸出yes、no皆為小寫。",
    ], complexity: "每筆時間 O(log 65536)，空間 O(1)。", pitfall: "不能模擬n趟；65535²和2³²−1要避免有號32位元溢位。",
    traceLabel: "示意：n=9",
    trace: [
      { title: "第1趟", description: "1整除9，燈由關轉亮。", cells: ["因數1", "因數3", "因數9"], active: [0], variables: [["切換數", "1"], ["亮", "1"]] },
      { title: "第3趟", description: "平方根3是單獨配對的因數，燈轉暗。", cells: ["因數1", "因數3", "因數9"], active: [1], variables: [["切換數", "2"], ["亮", "0"]] },
      { title: "第9趟", description: "最後再切換，三個因數使燈保持亮。", cells: ["因數1", "因數3", "因數9"], active: [2], variables: [["切換數", "3"], ["輸出", "yes"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main() {
    long long n;
    while (cin >> n && n) {
        long long lo=0, hi=65536;
        while (lo<hi) {
            long long mid=(lo+hi+1)/2;
            if (mid*mid<=n) lo=mid; else hi=mid-1;
        }
        cout << (lo*lo==n ? "yes" : "no") << '\n';
    }
}`,
    python: String.raw`import sys
from math import isqrt
for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0:
        break
    print('yes' if isqrt(n) ** 2 == n else 'no')
`,
  }),
  defineCpeLesson("a475", {
    topic: "math", level: "easy", concept: "平方根前綴計數", goal: "用兩個前綴的差計算閉區間平方數量。",
    explanation: [
      "不超過x的正平方數是1²到floor(√x)²，恰有floor(√x)個。因此[a,b]中的數量等於floor(√b)−floor(√(a−1))，減掉a以前的平方數，便自然包含左右端點。",
      "為避免浮點開根的取整問題，C++用整數二分計算平方根，Python使用isqrt。由於上限100000，搜尋範圍到317即可。逐對讀入直到0 0，每筆只輸出數量，不輸出區間或案例標號。",
    ], complexity: "每筆時間 O(log b)，額外空間 O(1)。", pitfall: "應減掉a−1的前綴；若減掉a的前綴，a本身為平方時就少算一個。",
    traceLabel: "示意：[4,16]",
    trace: [
      { title: "右端前綴", description: "16以前有1、4、9、16共4個平方數。", cells: ["1", "4", "9", "16"], active: [0, 1, 2, 3], variables: [["floor√16", "4"]] },
      { title: "移除左端以前", description: "a−1=3，只有1須移除。", cells: ["移除1", "4", "9", "16"], active: [0], variables: [["floor√3", "1"]] },
      { title: "取前綴差", description: "4−1=3，留下4、9、16。", cells: ["4", "9", "16"], active: [0, 1, 2], variables: [["答案", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int root(int x) {
    int lo=0, hi=317;
    while (lo<hi) {
        int mid=(lo+hi+1)/2;
        if (mid*mid<=x) lo=mid; else hi=mid-1;
    }
    return lo;
}
int main() {
    int a,b;
    while (cin >> a >> b && (a || b)) cout << root(b)-root(a-1) << '\n';
}`,
    python: String.raw`import sys
from math import isqrt
data = list(map(int, sys.stdin.buffer.read().split()))
for a, b in zip(data[::2], data[1::2]):
    if a == b == 0:
        break
    print(isqrt(b) - isqrt(a - 1))
`,
  }),
];
