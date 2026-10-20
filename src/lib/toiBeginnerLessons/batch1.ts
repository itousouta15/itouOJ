import { defineToiBeginnerLesson } from "@/lib/toiBeginnerLessonBuilder";
import type {
  ToiBeginnerLesson,
  ToiBeginnerTopic,
} from "@/lib/toiBeginnerLessonTypes";

type Frame = [string, string, string[], [string, string][]];
function lesson(
  code: string,
  topic: ToiBeginnerTopic,
  concept: string,
  explanation: string[],
  complexity: string,
  pitfall: string,
  frames: Frame[],
  cpp: string,
  python: string,
): ToiBeginnerLesson {
  return defineToiBeginnerLesson(code, {
    topic,
    concept,
    goal: explanation[0],
    explanation,
    complexity,
    pitfall,
    traceLabel: concept,
    trace: frames.map(([title, description, cells, variables]) => ({
      title,
      description,
      cells,
      variables,
    })),
    cpp,
    python,
  });
}

export const lessons: ToiBeginnerLesson[] = [
  lesson(
    "a087",
    "grid",
    "四方向走訪連通黑格",
    [
      "從左上角出發，只走上下左右相鄰的黑格，計算被走訪的格數。",
      "以堆疊保存待處理座標，加入時就標記，避免沿原路回頭重複計數。題目保證起終點所在黑格連通塊是一條路徑，因此它的格數就是答案。",
      "其他地方可以有黑格，不能把整張圖的 1 全部相加；搜尋也不限制只能向右或向下。",
    ],
    "時間 O(RC) ・ 空間 O(RC)",
    "起點與終點都要計入；對角接觸不算相鄰。",
    [
      [
        "由角落出發",
        "(0,0) 是第一格，右方為白格，只能往下。",
        ["(0,0)=1", "(1,0)=1", "(0,4)=1（孤立）"],
        [["已訪格數", "1"]],
      ],
      [
        "沿黑格前進",
        "經過 (1,0)、(1,1)、(1,2)、(2,2)，共五格。",
        ["(0,0)", "(1,0)", "(1,1)", "(1,2)", "(2,2)"],
        [["已訪格數", "5"]],
      ],
      [
        "走到終點",
        "再經 (2,3)、(3,3)、(3,4)；孤立的 (0,4) 不加入。",
        ["(2,3)", "(3,3)", "(3,4)"],
        [["輸出", "8"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <utility>
using namespace std;
int main() {
    int r,c; cin>>r>>c;
    vector<vector<int>> a(r,vector<int>(c)), seen(r,vector<int>(c));
    for(auto &row:a) for(int &v:row) cin>>v;
    vector<pair<int,int>> st{{0,0}}; seen[0][0]=1;
    int ans=0, dr[]={-1,1,0,0}, dc[]={0,0,-1,1};
    while(!st.empty()) {
        auto [x,y]=st.back(); st.pop_back(); ++ans;
        for(int k=0;k<4;++k) {
            int u=x+dr[k],v=y+dc[k];
            if(u>=0&&u<r&&v>=0&&v<c&&a[u][v]&&!seen[u][v]) {
                seen[u][v]=1; st.push_back({u,v});
            }
        }
    }
    cout<<ans<<'\n';
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
r, c = next(it), next(it)
a = [[next(it) for _ in range(c)] for _ in range(r)]
seen = {(0, 0)}
stack = [(0, 0)]
while stack:
    x, y = stack.pop()
    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        u, v = x + dx, y + dy
        if 0 <= u < r and 0 <= v < c and a[u][v] and (u, v) not in seen:
            seen.add((u, v))
            stack.append((u, v))
print(len(seen))`,
  ),

  lesson(
    "a088",
    "count-frequency",
    "逐品項計算缺少與多送",
    [
      "分別統計實送與應送的每種串燒數量，再累加各品項的正負差。",
      "先讀 N 個實送編號；每位顧客前面的 P 是串數，接著才是 P 個品項。用 1 到 100 的計數陣列保存兩邊數量。",
      "應送較多就增加缺少數，實送較多就增加多送數。兩個方向分開累加，因此不同品項不能抵銷。",
    ],
    "時間 O(N + ΣP + 100) ・ 計數空間 O(100)，Python 輸入緩衝 O(N + ΣP)",
    "不可用應送總數減實送總數，否則會把送錯品項互相抵銷。",
    [
      [
        "實送清單",
        "2 與 5 各兩串，3 與 8 各一串。",
        ["2:2", "3:1", "5:2", "8:1"],
        [["實送", "6"]],
      ],
      [
        "合併訂單",
        "兩位顧客合計點了 2 一串、3 兩串、5 一串、7 一串。",
        ["2:1", "3:2", "5:1", "7:1"],
        [["應送", "5"]],
      ],
      [
        "分開結算",
        "3、7 各少一串；2、5、8 各多一串。",
        ["少 3,7", "多 2,5,8"],
        [["輸出", "2 3"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){
    int n,m,x,p,got[101]={},want[101]={}; cin>>n>>m;
    for(int i=0;i<n;++i){cin>>x; ++got[x];}
    for(int i=0;i<m;++i){cin>>p; while(p--){cin>>x; ++want[x];}}
    int less=0,more=0;
    for(int i=1;i<=100;++i) if(want[i]>got[i]) less+=want[i]-got[i]; else more+=got[i]-want[i];
    cout<<less<<' '<<more<<'\n';
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n, m = next(it), next(it)
got, want = [0] * 101, [0] * 101
for _ in range(n):
    got[next(it)] += 1
for _ in range(m):
    p = next(it)
    for _ in range(p):
        want[next(it)] += 1
print(sum(max(w - g, 0) for g, w in zip(got, want)),
      sum(max(g - w, 0) for g, w in zip(got, want)))`,
  ),

  lesson(
    "a089",
    "text",
    "整數序列的 KMP 首次匹配",
    [
      "為目標符文建立前綴表，再由左至右尋找第一次完整匹配。",
      "前綴表 pi[i] 記錄目標前 i+1 個符文中，最長且不等於整段的共同前綴與後綴長度。失配時將已匹配長度 j 改為 pi[j-1]，保留可重用部分。",
      "掃描原序列時只要 j 達 M，起點的一基編號就是 i-M+2，立即輸出；掃完仍未找到則輸出 not found。符文是整數，不能把多位數直接串成字元再搜尋。",
    ],
    "時間 O(N+M) ・ 空間 O(N+M)",
    "答案從 1 開始；必須取連續片段且保留最早出現的位置。",
    [
      [
        "建立前綴表",
        "目標為 6、9，沒有非空的共同前後綴。",
        ["6", "9"],
        [
          ["pi", "0,0"],
          ["j", "0"],
        ],
      ],
      [
        "第一次候選失配",
        "第 2 個符文 6 匹配，但第 3 個 8 不等於 9，j 退回 0。",
        ["8", "6", "8", "6", "9", "6", "9"],
        [
          ["已掃位置", "3"],
          ["j", "0"],
        ],
      ],
      [
        "首次完整匹配",
        "第 4、5 個符文是 6、9，先於第 6、7 個。",
        ["位置4:6", "位置5:9"],
        [
          ["j", "2"],
          ["輸出", "4"],
        ],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){
    int n,m; cin>>n>>m; vector<int>a(n),b(m),pi(m);
    for(int &x:a) cin>>x; for(int &x:b) cin>>x;
    for(int i=1,j=0;i<m;++i){
        while(j&&b[i]!=b[j]) j=pi[j-1];
        if(b[i]==b[j]) ++j; pi[i]=j;
    }
    for(int i=0,j=0;i<n;++i){
        while(j&&a[i]!=b[j]) j=pi[j-1];
        if(a[i]==b[j]) ++j;
        if(j==m){cout<<i-m+2<<'\n'; return 0;}
    }
    cout<<"not found\n";
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, m = d[:2]
a, b = d[2:2+n], d[2+n:2+n+m]
pi = [0] * m
j = 0
for i in range(1, m):
    while j and b[i] != b[j]:
        j = pi[j-1]
    if b[i] == b[j]:
        j += 1
    pi[i] = j
j = 0
for i, x in enumerate(a):
    while j and x != b[j]:
        j = pi[j-1]
    if x == b[j]:
        j += 1
    if j == m:
        print(i-m+2)
        break
else:
    print('not found')`,
  ),

  lesson(
    "a090",
    "conditions",
    "普通號與特別號的獎項表",
    [
      "先計算六個普通號命中幾個，再另外判斷特別號是否命中。",
      "以集合保存獎券號碼，不考慮開獎順序。特別號是開獎資料最後一個數，不能把它算進普通號的命中數。",
      "依 (普通命中數, 是否中特別號) 查獎項；六個普通號是 A，未列出的組合一律為 X。",
    ],
    "時間 O(1) ・ 空間 O(1)",
    "三個普通號加特別號是 F，三個普通號未中特別號是 H。",
    [
      [
        "獎券號碼",
        "保存六個待對獎號碼。",
        ["4", "8", "12", "16", "20", "24"],
        [["張數", "1"]],
      ],
      [
        "比對普通號",
        "31、8、35、4、12、33 中命中 8、4、12。",
        ["8 ✓", "4 ✓", "12 ✓"],
        [["普通命中", "3"]],
      ],
      [
        "查獎項",
        "特別號 24 也在獎券內，對應 F。",
        ["特別號24 ✓", "3 + 特別號"],
        [["輸出", "F"]],
      ],
    ],
    String.raw`#include <iostream>
#include <set>
using namespace std;
int main(){
    set<int> ticket; int x,k=0;
    for(int i=0;i<6;++i){cin>>x; ticket.insert(x);}
    for(int i=0;i<6;++i){cin>>x; k+=ticket.count(x);}
    cin>>x; bool s=ticket.count(x); char ans='X';
    if(k==6) ans='A';
    else if(k==5) ans=s?'B':'C';
    else if(k==4) ans=s?'D':'E';
    else if(k==3) ans=s?'F':'H';
    else if(k==2&&s) ans='G';
    cout<<ans<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
ticket = set(d[:6])
k = sum(x in ticket for x in d[6:12])
s = d[12] in ticket
prizes = {(6, False): 'A', (6, True): 'A', (5, True): 'B',
          (5, False): 'C', (4, True): 'D', (4, False): 'E',
          (3, True): 'F', (2, True): 'G', (3, False): 'H'}
print(prizes.get((k, s), 'X'))`,
  ),

  lesson(
    "a091",
    "count-frequency",
    "品項統計與最多套餐",
    [
      "統計代碼 0 到 5 的數量，將飲料和紅豆餅盡量配成套餐。",
      "飲料數為 count[0]，餅數為 N-count[0]，最多能組 min(飲料數, 餅數) 套。每套原價 70 元變成 59 元，省 11 元。",
      "用 50×飲料數+20×餅數-11×套餐數計算總價，並先輸出六種餐點各自的數量。",
    ],
    "時間 O(N) ・ 計數空間 O(1)，Python 輸入緩衝 O(N)",
    "套餐可搭任一口味，但同一餐點不能重複用在不同套餐。",
    [
      [
        "統計餐點",
        "0 出現三次；1 一次、2 兩次、5 一次。",
        ["0:3", "1:1", "2:2", "3:0", "4:0", "5:1"],
        [["餅數", "4"]],
      ],
      [
        "配三份套餐",
        "三杯飲料配三個餅，還有一個餅。",
        ["59", "59", "59", "20"],
        [["套餐", "3"]],
      ],
      [
        "輸出統計與價格",
        "總價 177+20=197。",
        ["3 1 2 0 0 1", "197"],
        [["輸出", "3 1 2 0 0 1 197"]],
      ],
    ],
    String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main(){int n,x,c[6]={}; cin>>n;
    for(int i=0;i<n;++i){cin>>x; ++c[x];}
    int drinks=c[0],cakes=n-drinks;
    for(int v:c) cout<<v<<' ';
    cout<<50*drinks+20*cakes-11*min(drinks,cakes)<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n = d[0]
c = [0] * 6
for x in d[1:1+n]:
    c[x] += 1
drinks, cakes = c[0], n-c[0]
print(*c, 50*drinks + 20*cakes - 11*min(drinks, cakes))`,
  ),

  lesson(
    "a092",
    "conditions",
    "溫度與時段優惠獨立累加",
    [
      "檢查溫度與飲品種類是否符合優惠，再獨立檢查購買時段。",
      "冷飲需 D≥30，熱飲需 D≤15，符合時減 5 元。這兩個溫度條件由 C 決定使用哪一個。",
      "時段是 7≤T<10 或 14≤T<16，再減 5 元；兩類優惠可同時成立，因此應使用兩次獨立判斷。",
    ],
    "時間 O(1) ・ 空間 O(1)",
    "10 時與 16 時都已超出優惠時段；15 度熱飲仍有優惠。",
    [
      [
        "原價與條件",
        "原價 60，14 度，15 時，C=1 為熱飲。",
        ["60", "14°C", "15時", "熱飲"],
        [["價格", "60"]],
      ],
      ["溫度優惠", "14≤15 且為熱飲，減 5 元。", ["60-5"], [["價格", "55"]]],
      ["時段優惠", "14≤15<16，再減 5 元。", ["55-5"], [["輸出", "50"]]],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){int p,d,t,c; cin>>p>>d>>t>>c;
    if((c==0&&d>=30)||(c==1&&d<=15)) p-=5;
    if((7<=t&&t<10)||(14<=t&&t<16)) p-=5;
    cout<<p<<'\n';
}`,
    String.raw`p, d, t, c = map(int, input().split())
if (c == 0 and d >= 30) or (c == 1 and d <= 15):
    p -= 5
if 7 <= t < 10 or 14 <= t < 16:
    p -= 5
print(p)`,
  ),

  lesson(
    "a093",
    "number-theory",
    "成對枚舉真因數",
    [
      "枚舉不超過平方根的因數，成對加入真因數總和。",
      "N≥2，因此先把真因數 1 加入。對 d 從 2 到 √N，若 d 整除 N，同時加入 d 與 N/d；兩者相等時只加一次。",
      "配對保證沒有漏掉較大的因數，而 N 自己從未加入。最後輸出總和，再依是否等於 N 輸出 perfect 或 not perfect。",
    ],
    "時間 O(√N) ・ 空間 O(1)",
    "平方根因數不能加兩次，也不能把 N 本身算進去。",
    [
      ["先加入 1", "28 的真因數含 1，但不含 28。", ["1"], [["sum", "1"]]],
      [
        "找到因數對",
        "d=2 得到 2 與 14；d=4 得到 4 與 7。",
        ["1", "2", "14", "4", "7"],
        [["sum", "28"]],
      ],
      [
        "判斷完美數",
        "總和等於輸入 28。",
        ["28", "perfect"],
        [["輸出", "28 / perfect"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){long long n; cin>>n; long long s=1;
    for(long long d=2;d*d<=n;++d) if(n%d==0){s+=d; if(d!=n/d) s+=n/d;}
    cout<<s<<'\n'<<(s==n?"perfect":"not perfect")<<'\n';
}`,
    String.raw`n = int(input())
s, d = 1, 2
while d*d <= n:
    if n % d == 0:
        s += d
        if d != n//d:
            s += n//d
    d += 1
print(s)
print('perfect' if s == n else 'not perfect')`,
  ),

  lesson(
    "a094",
    "number-theory",
    "逐次相乘列出整數冪",
    [
      "從 N 的一次方開始，每回合輸出目前值，再乘 N。",
      "因 N≥2，冪嚴格遞增，只要目前值超過 M 就不會再有答案。使用整數乘法即可，不需要浮點數的 pow。",
      "C++ 在乘法前檢查 value>M/N，表示下一次相乘將超過上限，直接結束，並用 long long 儲存數值。",
    ],
    "時間 O(logₙ M) ・ 空間 O(1)",
    "指數從 1 開始，不要輸出 N⁰=1；等於 M 仍要輸出。",
    [
      [
        "一次與二次方",
        "4 與 16 都不超過 300。",
        ["4", "16"],
        [["最後輸出", "16"]],
      ],
      [
        "繼續乘四",
        "再得到 64、256。",
        ["4", "16", "64", "256"],
        [["最後輸出", "256"]],
      ],
      [
        "停止",
        "下一個冪 1024 超過 300，不輸出。",
        ["1024 > 300"],
        [["輸出行數", "4"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){long long n,m; cin>>n>>m;
    for(long long v=n;v<=m;){cout<<v<<'\n'; if(v>m/n) break; v*=n;}
}`,
    String.raw`n, m = map(int, input().split())
value = n
while value <= m:
    print(value)
    value *= n`,
  ),

  lesson(
    "a095",
    "count-frequency",
    "每位學生先去重再計數",
    [
      "每位學生的三個志願先去掉重複社團，再為各社團的人數加一。",
      "用陣列保存原始社團順序，用字典或映射保存各社團的計數。每位學生使用自己的小集合，不能跨學生共用去重結果。",
      "最後依原清單輸出，從未被填選的社團仍須輸出 0。",
    ],
    "時間 O(M+N log M)（名稱長度≤20）・ 空間 O(M)，Python 輸入緩衝 O(M+N)",
    "同一學生重填三次仍只算一人，不可把三個志願直接加三次。",
    [
      [
        "第一位學生",
        "ROBOT ART ART 去重後只有 ROBOT、ART。",
        ["ART:1", "ROBOT:1", "CHESS:0", "CHOIR:0"],
        [["已處理學生", "1"]],
      ],
      [
        "後兩位學生",
        "第二位加 CHESS、ROBOT；第三位只加 ART。",
        ["ART:2", "ROBOT:2", "CHESS:1", "CHOIR:0"],
        [["已處理學生", "3"]],
      ],
      [
        "保持清單順序",
        "依 ART、ROBOT、CHESS、CHOIR 輸出。",
        ["ART 2", "ROBOT 2", "CHESS 1", "CHOIR 0"],
        [["輸出行數", "4"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <string>
using namespace std;
int main(){int n,m; cin>>n>>m; vector<string> names(m); map<string,int> cnt;
    for(string &s:names){cin>>s; cnt[s]=0;}
    for(int i=0;i<n;++i){set<string> chosen; string s;
        for(int j=0;j<3;++j){cin>>s; chosen.insert(s);}
        for(const string &v:chosen) ++cnt[v];
    }
    for(const string &s:names) cout<<s<<' '<<cnt[s]<<'\n';
}`,
    String.raw`import sys
it = iter(sys.stdin.read().split())
n, m = int(next(it)), int(next(it))
names = [next(it) for _ in range(m)]
cnt = dict.fromkeys(names, 0)
for _ in range(n):
    chosen = {next(it) for _ in range(3)}
    for name in chosen:
        cnt[name] += 1
for name in names:
    print(name, cnt[name])`,
  ),

  lesson(
    "a096",
    "search-optimization",
    "枚舉合法出發與返回日",
    [
      "枚舉所有 A≤B 的日期組合，計算兩段機票與 B-A 晚住宿。",
      "總費用為去程[A]+回程[B]+1000×(B-A)。共有 55 組合法日期，可以完整比較，不必分開挑最便宜的機票。",
      "更新最低費用時一併保存出發日與返回日。陣列使用零基索引，輸出日期時各加一；題目保證最佳組合唯一。",
    ],
    "D 天時時間 O(D²) ・ 空間 O(D)；本題 D=10 為固定大小",
    "同一天來回不住一晚；不能把返回日早於出發日的票價組合算進去。",
    [
      [
        "票價低點",
        "第 2 天去程 300，第 5 天回程 400。",
        ["A=2:300", "B=5:400"],
        [["日期條件", "2≤5"]],
      ],
      [
        "加入住宿",
        "第 2 天到第 5 天有三晚，住宿 3000。",
        ["300", "400", "3×1000"],
        [["總費用", "3700"]],
      ],
      [
        "比較所有合法組合",
        "其他組合至少有一張 10000 元機票，因此此組最低。",
        ["2 5 3700"],
        [["輸出", "2 5 3700"]],
      ],
    ],
    String.raw`#include <iostream>
#include <limits>
using namespace std;
int main(){int a[10],b[10]; for(int &x:a) cin>>x; for(int &x:b) cin>>x;
    int best=numeric_limits<int>::max(),aa=0,bb=0;
    for(int i=0;i<10;++i) for(int j=i;j<10;++j){int cost=a[i]+b[j]+1000*(j-i);
        if(cost<best){best=cost; aa=i+1; bb=j+1;}}
    cout<<aa<<' '<<bb<<' '<<best<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
outward, back = d[:10], d[10:20]
cost, a, b = min((outward[i]+back[j]+1000*(j-i), i+1, j+1)
                 for i in range(10) for j in range(i, 10))
print(a, b, cost)`,
  ),

  lesson(
    "a097",
    "number-theory",
    "嚴格較大的質數、平方與立方",
    [
      "質數從 N+1 起逐個檢查，平方與立方則枚舉底數到冪嚴格大於 N。",
      "判斷質數只需試除到平方根，若沒有整除它的 d≥2 就是質數。從 N+1 開始可避免把 N 自己輸出。",
      "平方、立方的底數各從 1 增加，以整數乘法檢查 k²≤N 與 k³≤N，結束後的冪即為各自最小答案。",
    ],
    "設質數候選數量為 K：時間 O(K√p+√N) ・ 空間 O(1)",
    "N 已是質數或完整冪時仍要找下一個；不使用浮點根號取整以避免邊界誤差。",
    [
      [
        "下一個質數",
        "從 13 開始試除，2、3 都不能整除 13。",
        ["N=12", "13"],
        [["質數答案", "13"]],
      ],
      ["下一個平方", "3²=9≤12，4²=16>12。", ["9", "16"], [["平方答案", "16"]]],
      [
        "下一個立方",
        "2³=8≤12，3³=27>12。",
        ["8", "27"],
        [["輸出", "13 16 27"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
bool prime(int x){if(x<2) return false; for(int d=2;d*d<=x;++d) if(x%d==0) return false; return true;}
int main(){int n; cin>>n; int p=n+1,s=1,c=1;
    while(!prime(p)) ++p; while(s*s<=n) ++s; while(c*c*c<=n) ++c;
    cout<<p<<' '<<s*s<<' '<<c*c*c<<'\n';
}`,
    String.raw`n = int(input())
def prime(x):
    d = 2
    while d*d <= x:
        if x % d == 0:
            return False
        d += 1
    return x >= 2
p, s, c = n+1, 1, 1
while not prime(p):
    p += 1
while s*s <= n:
    s += 1
while c*c*c <= n:
    c += 1
print(p, s*s, c*c*c)`,
  ),

  lesson(
    "a098",
    "arrays",
    "最小值定位與兩次間接索引",
    [
      "先找最小標記 X、它的出現次數與最右位置，再依唯一或重複決定移動方向。",
      "X 只出現一次時向右移 X 格；出現多次時從最右的 X 向左移 X 格。移動不包含起點，零基位置可直接加減 X。",
      "到達位置上的值是 Y，它代表從整排最左側數來的第 Y 箱，密碼為 a[Y-1]，並不是剛移到的 Y 本身。",
    ],
    "時間 O(N) ・ 空間 O(N)",
    "最後的 Y 是一基箱號，讀取陣列前要減一；重複最小值必須選最右箱。",
    [
      [
        "找最小標記",
        "十個箱子中最小值 3 只在第 2 箱。",
        ["8", "3", "9", "7", "10", "6", "4", "8", "9", "5"],
        [
          ["X", "3"],
          ["起點箱號", "2"],
        ],
      ],
      [
        "往右三格",
        "第 2 箱移到第 5 箱，讀到 Y=10。",
        ["第3箱:9", "第4箱:7", "第5箱:10"],
        [["Y", "10"]],
      ],
      [
        "用 Y 找密碼",
        "從整排左側數第 10 箱，標記為 5。",
        ["第10箱:5"],
        [["輸出", "5"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int n; cin>>n; vector<int>a(n); for(int &v:a) cin>>v;
    int x=*min_element(a.begin(),a.end()),cnt=0,pos=0;
    for(int i=0;i<n;++i) if(a[i]==x){++cnt; pos=i;}
    int y=a[pos+(cnt==1?x:-x)]; cout<<a[y-1]<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, a = d[0], d[1:]
x = min(a)
positions = [i for i, v in enumerate(a) if v == x]
pos = positions[-1] + (x if len(positions) == 1 else -x)
y = a[pos]
print(a[y-1])`,
  ),

  lesson(
    "a099",
    "conditions",
    "每科由最高門檻往下判斷",
    [
      "每科先檢查是否為 0 分，否則依 A 到 E 的門檻順序找第一個達標級別。",
      "0 代表缺考，必須優先輸出 X。非零成績只要大於或等於門檻就算達標，因此同分門檻要保留最先達到的最高標準。",
      "五個門檻都未達到時輸出 F。輸入先給六科成績，之後才逐科給五個門檻，不能交錯讀取。",
    ],
    "時間 O(6×5) ・ 空間 O(1)",
    "比較用 ≥；達到一個門檻後要停止，避免被後面的較低標覆蓋。",
    [
      [
        "讀六科成績",
        "依序為 14、12、8、4、1、0。",
        ["14", "12", "8", "4", "1", "0"],
        [["門檻", "13,11,9,7,3"]],
      ],
      [
        "前四科",
        "14 達 A，12 達 B，8 達 D，4 達 E。",
        ["A", "B", "D", "E"],
        [["已判定", "4科"]],
      ],
      [
        "低分與缺考",
        "1 低於底標為 F；0 優先判為 X。",
        ["A", "B", "D", "E", "F", "X"],
        [["輸出行數", "6"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){int scores[6]; for(int &s:scores) cin>>s;
    for(int s:scores){int t[5]; for(int &x:t) cin>>x; char ans=s==0?'X':'F';
        if(s) for(int j=0;j<5;++j) if(s>=t[j]){ans='A'+j; break;}
        cout<<ans<<'\n';}
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
scores = [next(it) for _ in range(6)]
for s in scores:
    thresholds = [next(it) for _ in range(5)]
    answer = 'X' if s == 0 else 'F'
    if s:
        for grade, threshold in zip('ABCDE', thresholds):
            if s >= threshold:
                answer = grade
                break
    print(answer)`,
  ),

  lesson(
    "a100",
    "read-calculate",
    "用整數完成比例換算與進位",
    [
      "每種食材的新用量是 X×B/A 無條件進位後的整數。",
      "對正整數分子，ceil(XB/A) 等於 (XB+A-1)//A，可避免浮點數誤差。B 位於所有 N 個用量之後，要先保存用量再計算。",
      "逐項依原順序輸出，僅以空格分隔，不附加食材名稱或單位。",
    ],
    "時間 O(N) ・ 空間 O(N)",
    "第二行最後的 B 是目標人數，不是第 N+1 種食材；整除時不能多加一。",
    [
      [
        "讀入份量",
        "四種用量為 50、75、125、1，原人數 6，目標 7。",
        ["50", "75", "125", "1"],
        [
          ["A", "6"],
          ["B", "7"],
        ],
      ],
      [
        "換算前兩項",
        "350/6 進位為 59；525/6 進位為 88。",
        ["59", "88"],
        [["已換算", "2"]],
      ],
      [
        "完成換算",
        "875/6 進位為 146；7/6 進位為 2。",
        ["59", "88", "146", "2"],
        [["輸出", "59 88 146 2"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,a,b; cin>>n>>a; vector<int>x(n); for(int &v:x) cin>>v; cin>>b;
    for(int i=0;i<n;++i) cout<<(i?" ":"")<<(x[i]*b+a-1)/a; cout<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, a = d[:2]
x, b = d[2:2+n], d[2+n]
print(*((v*b+a-1)//a for v in x))`,
  ),

  lesson(
    "a101",
    "count-frequency",
    "拆分花色與完整牌面",
    [
      "每張牌的第一個字元決定花色，剩下全部字元決定大牌點。",
      "以 S、H、D、C 的固定順序累計張數；牌面 A、K、Q、J 分別加 4、3、2、1 分，其餘都不加分。",
      "牌面可能是兩個字元的 10，因此使用子字串取得整個牌面，不假設每張牌碼都只有兩個字元。",
    ],
    "固定 13 張牌：時間 O(1) ・ 空間 O(1)",
    "花色 C 是梅花，牌面 Q 才是兩點；C10 應讀成梅花十而非兩張牌。",
    [
      [
        "前四張",
        "S10、HQ、D2、CA 各一種花色，HQ 得2點、CA 得4點。",
        ["S:1", "H:1", "D:1", "C:1"],
        [["點數", "6"]],
      ],
      [
        "其餘大牌",
        "DK 加3、SJ 加1、CQ 加2，其餘小牌不加分。",
        ["DK:3", "SJ:1", "CQ:2"],
        [["點數", "12"]],
      ],
      [
        "完成花色統計",
        "全手牌有 3 黑桃、3 紅心、3 方塊、4 梅花。",
        ["3 3 3 4", "12"],
        [["輸出行數", "2"]],
      ],
    ],
    String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){string suits="SHDC",s; int c[4]={},points=0;
    for(int i=0;i<13;++i){cin>>s; ++c[suits.find(s[0])]; string r=s.substr(1);
        if(r=="A") points+=4; else if(r=="K") points+=3; else if(r=="Q") points+=2; else if(r=="J") ++points;}
    cout<<c[0]<<' '<<c[1]<<' '<<c[2]<<' '<<c[3]<<'\n'<<points<<'\n';
}`,
    String.raw`import sys
cards = sys.stdin.read().split()
counts = [0] * 4
points = 0
for card in cards:
    counts['SHDC'.index(card[0])] += 1
    points += {'A': 4, 'K': 3, 'Q': 2, 'J': 1}.get(card[1:], 0)
print(*counts)
print(points)`,
  ),

  lesson(
    "a102",
    "grid",
    "先左右鏡像再上下鏡像",
    [
      "每列先接上自己的反轉，再把所有擴展列以相反順序接在下方。",
      "零基輸出位置 (r,c) 的來源列為 r<H?r:2H-1-r，來源行為 c<W?c:2W-1-c，兩次鏡射互相獨立。",
      "輸出恰為 2H×2W，摺線旁的兩格保留為兩格。可直接用索引輸出，不必另存四倍大小的整張圖。",
    ],
    "時間 O(HW) ・ 空間 O(HW)（含原圖與單列輸出）",
    "輸入先 W 再 H；下半部要倒轉列順序，不能只複製上半部。",
    [
      [
        "原始兩列",
        "寬4高2，第一列0110，第二列1000。",
        ["0 1 1 0", "1 0 0 0"],
        [["尺寸", "2×4"]],
      ],
      [
        "向右展開",
        "各列接上倒序，第二列變為10000001。",
        ["0 1 1 0 0 1 1 0", "1 0 0 0 0 0 0 1"],
        [["尺寸", "2×8"]],
      ],
      [
        "向下展開",
        "下半部依第二列、第一列的順序鏡射。",
        ["01100110", "10000001", "10000001", "01100110"],
        [["輸出尺寸", "4×8（數字間加空格）"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int w,h; cin>>w>>h; vector<vector<int>>a(h,vector<int>(w));
    for(auto &row:a) for(int &v:row) cin>>v;
    for(int r=0;r<2*h;++r){int x=r<h?r:2*h-1-r;
        for(int c=0;c<2*w;++c){int y=c<w?c:2*w-1-c; cout<<(c?" ":"")<<a[x][y];} cout<<'\n';}
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
w, h = next(it), next(it)
a = [[next(it) for _ in range(w)] for _ in range(h)]
for r in range(2*h):
    row = a[r if r < h else 2*h-1-r]
    print(*(row + row[::-1]))`,
  ),

  lesson(
    "a103",
    "grid",
    "逐列查詢完全相同的餐點",
    [
      "保存餐點表格，讀到查詢後按列、行順序找出完全相同的字串。",
      "用巢狀迴圈先掃上方列，再由左往右掃行，自然符合題目所需排序。列、行輸出時均由零基索引加一。",
      "字串比較保留大小寫；若完全沒有匹配才輸出 0 0。NA 也是表格值，依查詢字串作完全比對。",
    ],
    "時間 O(RC L) ・ 空間 O(RC L)，L≤20 為字串長度",
    "Soup 與 soup 不相同；不能把列號與行號顛倒。",
    [
      [
        "查詢字串",
        "q 為小寫 soup。",
        ["soup NA rice soup", "rice soup Soup NA"],
        [["q", "soup"]],
      ],
      [
        "第一列匹配",
        "第一列第1及第4行都是 soup。",
        ["1 1", "1 4"],
        [["匹配數", "2"]],
      ],
      [
        "第二列匹配",
        "第二列第2行符合；第3行的 Soup 不符。",
        ["1 1", "1 4", "2 2"],
        [["匹配數", "3"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main(){int r,c; cin>>r>>c; vector<vector<string>>a(r,vector<string>(c));
    for(auto &row:a) for(string &s:row) cin>>s; string q; cin>>q; bool found=false;
    for(int i=0;i<r;++i) for(int j=0;j<c;++j) if(a[i][j]==q){cout<<i+1<<' '<<j+1<<'\n'; found=true;}
    if(!found) cout<<"0 0\n";
}`,
    String.raw`import sys
it = iter(sys.stdin.read().split())
r, c = int(next(it)), int(next(it))
a = [[next(it) for _ in range(c)] for _ in range(r)]
q = next(it)
found = False
for i in range(r):
    for j in range(c):
        if a[i][j] == q:
            print(i+1, j+1)
            found = True
if not found:
    print(0, 0)`,
  ),

  lesson(
    "a104",
    "conditions",
    "整月折扣與整數四捨五入",
    [
      "依整月搭乘次數決定折扣率，套用在所有原始票價的總和上。",
      "N≤10 支付100%，N≤20 支付95%，N≤40 支付90%，其餘支付85%。不是每一段次數分別套不同折扣。",
      "若支付百分比為 p，四捨五入金額是 (總和×p+50)//100；再與1200元比較取小。用整數可確保半元向上。",
    ],
    "時間 O(N) ・ Python 輸入緩衝 O(N)，C++ 額外空間 O(1)",
    "Python round 對半元不一定向上，不能直接使用；折扣門檻是11、21、41次。",
    [
      [
        "合計車資",
        "11 次各30元，原始總和330元。",
        ["11×30=330"],
        [["N", "11"]],
      ],
      [
        "套用回饋",
        "11 次屬5%回饋，應付330×95%=313.5。",
        ["330×95", "÷100"],
        [["精確費用", "313.5"]],
      ],
      [
        "四捨五入並比較",
        "半元向上為314，比1200小。",
        ["314", "1200"],
        [["輸出", "314"]],
      ],
    ],
    String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main(){int n,x,sum=0; cin>>n; for(int i=0;i<n;++i){cin>>x; sum+=x;}
    int p=n<=10?100:n<=20?95:n<=40?90:85;
    cout<<min(1200,(sum*p+50)/100)<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n = d[0]
p = 100 if n <= 10 else 95 if n <= 20 else 90 if n <= 40 else 85
print(min(1200, (sum(d[1:1+n])*p+50)//100))`,
  ),

  lesson(
    "a105",
    "read-calculate",
    "引力公式的整數運算",
    [
      "依題目公式先算 6×M1×M2，再除以 r×r。",
      "題目保證分子能被距離平方整除，因此可以直接使用整數除法，不需近似或四捨五入。",
      "C++ 使用 long long 保存乘積，並明寫 r*r；程式中的 ^ 代表位元 XOR，不是次方。",
    ],
    "時間 O(1) ・ 空間 O(1)",
    "除數是整個 r²；不能先除 r 再乘 r，運算括號要清楚。",
    [
      [
        "計算分子",
        "質量12與18，分子為6×12×18。",
        ["6", "12", "18"],
        [["分子", "1296"]],
      ],
      ["計算距離平方", "r=6，r²=36。", ["6×6"], [["分母", "36"]]],
      ["整除得引力", "1296÷36=36。", ["1296 / 36"], [["輸出", "36"]]],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){long long m1,m2,r; cin>>m1>>m2>>r; cout<<6*m1*m2/(r*r)<<'\n';}
`,
    String.raw`m1, m2, r = map(int, input().split())
print(6*m1*m2//(r*r))`,
  ),

  lesson(
    "a106",
    "text",
    "依逗號拆分並保留名稱空白",
    [
      "整行讀取每筆資料，以第一個逗號分成機場代碼與完整名稱。",
      "先讀 Q 與 N，再讀 N 行。C++ 切換 getline 前須吃掉上一行換行；Python 只移除行尾換行，不能將名稱 split 成多個字。",
      "代碼與 Q 相同時保存逗號後的原字串，最後原樣輸出。題目保證代碼唯一且查詢一定存在。",
    ],
    "時間 O(NL) ・ 額外空間 O(L)，L≤24 為資料列長度",
    "名稱中的空格也是資料，不能用讀取單一單字的方式只取得 Morning。",
    [
      ["查詢代碼", "Q=MOR，清單共有4筆。", ["MOR", "N=4"], [["已比對", "0"]]],
      [
        "讀到相符資料",
        "FEN 不符；MOR,Morning Bay 的逗號前符合查詢。",
        ["MOR", "Morning Bay"],
        [["答案", "Morning Bay"]],
      ],
      [
        "原樣輸出",
        "後續 RUV、WEX 不影響答案，保留名稱中間的空格。",
        ["Morning Bay"],
        [["輸出", "Morning Bay"]],
      ],
    ],
    String.raw`#include <iostream>
#include <string>
#include <limits>
using namespace std;
int main(){string q,line,answer; int n; cin>>q>>n;
    cin.ignore(numeric_limits<streamsize>::max(),'\n');
    for(int i=0;i<n;++i){getline(cin,line); if(!line.empty()&&line.back()=='\r') line.pop_back();
        auto p=line.find(','); if(line.substr(0,p)==q) answer=line.substr(p+1);}
    cout<<answer<<'\n';
}`,
    String.raw`import sys
q = sys.stdin.readline().rstrip('\r\n')
n = int(sys.stdin.readline())
answer = ''
for _ in range(n):
    code, name = sys.stdin.readline().rstrip('\r\n').split(',', 1)
    if code == q:
        answer = name
print(answer)`,
  ),

  lesson(
    "a107",
    "grid",
    "八方向搜尋與座標字典序",
    [
      "將表格與單字統一大小寫，從每格沿八個直線方向比對。",
      "對一個方向先計算終點，終點在圖內才逐字比較。矩形內的直線兩端都在圖內時，中間各格也在圖內。",
      "每次匹配記錄 (起點列,起點行,終點列,終點行)，取四元組字典序最小者，不能單憑方向迴圈順序決定答案。單字長一時起終點相同。",
    ],
    "時間 O(RC×8L) ・ 空間 O(RC+L)",
    "可斜向但不可轉彎；多解時終點也參與排序，找不到須輸出大寫 NO。",
    [
      [
        "統一大小寫",
        "查詢 bCd 轉成 bcd。",
        ["abcd", "xbxy", "xxcz", "xxxd"],
        [["word", "bcd"]],
      ],
      [
        "兩組候選",
        "由(1,2)向右到(1,4)，以及(2,2)斜下到(4,4)都符合。",
        ["(1,2)→(1,4)", "(2,2)→(4,4)"],
        [["候選數", "2"]],
      ],
      [
        "取最小座標組",
        "第一組起點列1較小，輸出起終點各一行。",
        ["1 2", "1 4"],
        [["最佳四元組", "1,2,1,4"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <string>
#include <array>
#include <cctype>
using namespace std;
int main(){int r,c; cin>>r>>c; vector<string>a(r); string w;
    for(string &s:a){cin>>s; for(char &ch:s) ch=tolower((unsigned char)ch);}
    cin>>w; for(char &ch:w) ch=tolower((unsigned char)ch);
    array<int,4> best{}; bool found=false; int len=w.size();
    for(int i=0;i<r;++i) for(int j=0;j<c;++j)
      for(int dx=-1;dx<=1;++dx) for(int dy=-1;dy<=1;++dy) if(dx||dy){
        int x=i+dx*(len-1),y=j+dy*(len-1);
        if(x<0||x>=r||y<0||y>=c) continue;
        bool ok=true; for(int k=0;k<len;++k) if(a[i+dx*k][j+dy*k]!=w[k]){ok=false; break;}
        array<int,4> now{i+1,j+1,x+1,y+1};
        if(ok&&(!found||now<best)){found=true; best=now;}
      }
    if(!found) cout<<"NO\n"; else cout<<best[0]<<' '<<best[1]<<'\n'<<best[2]<<' '<<best[3]<<'\n';
}`,
    String.raw`import sys
it = iter(sys.stdin.read().split())
r, c = int(next(it)), int(next(it))
a = [next(it).lower() for _ in range(r)]
w = next(it).lower()
best = None
for i in range(r):
    for j in range(c):
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                if dx == dy == 0:
                    continue
                x, y = i+dx*(len(w)-1), j+dy*(len(w)-1)
                if 0 <= x < r and 0 <= y < c:
                    if all(a[i+dx*k][j+dy*k] == ch for k, ch in enumerate(w)):
                        now = (i+1, j+1, x+1, y+1)
                        if best is None or now < best:
                            best = now
if best is None:
    print('NO')
else:
    print(*best[:2])
    print(*best[2:])`,
  ),
  lesson(
    "a156",
    "grid",
    "列最大值與行最小值的交點",
    [
      "先求每列最高值與每行最低值，再尋找同時等於兩者的格子。",
      "rowMax[r] 對應左右方向整列的最大值；colMin[c] 對應上下方向整行的最小值。格值等於這兩個值就符合條件，相同高度仍可成立。",
      "掃描所有格子，找到就輸出零基座標。題目保證最多一個答案，沒有答案則輸出 NO。",
    ],
    "時間 O(N²) ・ 空間 O(N²)",
    "這題座標從0開始；條件是列最高、行最低，方向不能互換。",
    [
      [
        "計算極值",
        "三列最大為9、5、9，三行最小為1、5、2。",
        ["rowMax:9,5,9", "colMin:1,5,2"],
        [["N", "3"]],
      ],
      [
        "檢查中心",
        "(1,1) 的5同時等於該列最大與該行最小。",
        ["1 5 2", "9 / 5 / 6"],
        [["候選", "1 1"]],
      ],
      [
        "輸出座標",
        "其餘格均不符合，輸出唯一位置。",
        ["1 1"],
        [["輸出", "1 1"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int n; cin>>n; vector<vector<int>>a(n,vector<int>(n)); vector<int>hi(n,-1),lo(n,1001);
    for(int i=0;i<n;++i) for(int j=0;j<n;++j){cin>>a[i][j]; hi[i]=max(hi[i],a[i][j]); lo[j]=min(lo[j],a[i][j]);}
    for(int i=0;i<n;++i) for(int j=0;j<n;++j) if(a[i][j]==hi[i]&&a[i][j]==lo[j]){cout<<i<<' '<<j<<'\n'; return 0;}
    cout<<"NO\n";
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
a = [[next(it) for _ in range(n)] for _ in range(n)]
hi = [max(row) for row in a]
lo = [min(a[i][j] for i in range(n)) for j in range(n)]
answer = next(((i, j) for i in range(n) for j in range(n)
               if a[i][j] == hi[i] == lo[j]), None)
print('NO' if answer is None else f'{answer[0]} {answer[1]}')`,
  ),

  lesson(
    "a157",
    "read-calculate",
    "里程、延滯與夜間區間加總",
    [
      "將里程費、延滯費及涵蓋的夜間時段費分別計算後相加。",
      "里程費是20+5×max(K-2,0)，延滯費是5×(W//2)。整點搭乘涵蓋的時段起點為 S、S+1、…、E-1，終點 E 不參與。",
      "對每個時段 h，若18≤h≤22，就加10h+5元，剛好對應185、195、205、215、225。",
    ],
    "時間 O(E-S) ・ 空間 O(1)",
    "18時下車沒有18–19時加價；延滯7分鐘只計三個完整兩分鐘。",
    [
      [
        "基本費用",
        "8公里是20+6×5=50；延滯7分鐘加15。",
        ["里程50", "延滯15"],
        [["小計", "65"]],
      ],
      [
        "夜間時段",
        "17到20涵蓋17、18、19三段，後兩段加185與195。",
        ["17–18:0", "18–19:185", "19–20:195"],
        [["夜間合計", "380"]],
      ],
      ["費用相加", "65+380=445。", ["65", "380"], [["輸出", "445"]]],
    ],
    String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main(){int k,w,s,e; cin>>k>>w>>s>>e; int ans=20+5*max(k-2,0)+5*(w/2);
    for(int h=s;h<e;++h) if(h>=18&&h<=22) ans+=10*h+5;
    cout<<ans<<'\n';
}`,
    String.raw`k, w, s, e = map(int, input().split())
answer = 20 + 5*max(k-2, 0) + 5*(w//2)
answer += sum(10*h+5 for h in range(s, e) if 18 <= h <= 22)
print(answer)`,
  ),

  lesson(
    "a158",
    "search-optimization",
    "用兩倍軸高檢查水平反射",
    [
      "以所有點的最低與最高 y 座標之和，作為對稱軸高度的兩倍。",
      "若存在水平對稱軸 y=h，最低點必映到最高高度，因此 2h=minY+maxY。每個 (x,y) 的鏡像必須是 (x,minY+maxY-y)。",
      "將座標存入集合，逐點檢查鏡像是否存在。使用兩倍軸高可直接處理半整數軸，不需浮點數。",
    ],
    "C++ 時間 O(T log T)，Python 集合平均 O(T) ・ 空間 O(T)",
    "雖題名為垂直對稱，題意明定的是水平直線：x不變、y反射。",
    [
      [
        "求軸高",
        "最小y=-1，最大y=4，因此兩倍軸高為3。",
        ["minY=-1", "maxY=4"],
        [["對稱軸", "y=1.5"]],
      ],
      [
        "檢查外側點",
        "(2,-1)對(2,4)，(8,-1)對(8,4)。",
        ["(2,-1)↔(2,4)", "(8,-1)↔(8,4)"],
        [["已驗證點", "4"]],
      ],
      [
        "檢查中間點",
        "(5,1)對(5,2)，全部點都有鏡像。",
        ["(5,1)↔(5,2)"],
        [["輸出", "success"]],
      ],
    ],
    String.raw`#include <iostream>
#include <set>
#include <algorithm>
using namespace std;
int main(){int t,x,y,lo=1001,hi=-1001; cin>>t; set<pair<int,int>>p;
    while(t--){cin>>x>>y; p.insert({x,y}); lo=min(lo,y); hi=max(hi,y);}
    for(auto [a,b]:p) if(!p.count({a,lo+hi-b})){cout<<"failure\n"; return 0;}
    cout<<"success\n";
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
t = next(it)
points = {(next(it), next(it)) for _ in range(t)}
axis2 = min(y for x, y in points) + max(y for x, y in points)
print('success' if all((x, axis2-y) in points for x, y in points) else 'failure')`,
  ),

  lesson(
    "a159",
    "arrays",
    "先固定原極值再搬運一次",
    [
      "先由原始資料計算整數平均與最多、最少盒的位置，再只搬運一次。",
      "搬運量是原最大值減 floor(總和/N)，從最多盒扣除同樣數量，加入原最少盒。兩個位置必須在修改陣列之前決定。",
      "本頁題目未指定極值並列時選哪盒，以下程式選首次出現者；唯一極值時答案無此歧義，全相等時搬運量為0。若評測會包含非全相等的極值並列，仍需出題方補充選擇規則。",
    ],
    "時間 O(N) ・ 空間 O(N)",
    "不要反覆搬到所有盒平均；題目只搬一次。極值並列的選擇規格尚未明定。",
    [
      [
        "計算原始資料",
        "2+8+5+12=27，平均捨去小數為6。",
        ["2", "8", "5", "12"],
        [["A", "6"]],
      ],
      [
        "決定搬運",
        "第4盒最多12，第1盒最少2，搬12-6=6顆。",
        ["第4盒 -6", "第1盒 +6"],
        [["搬運量", "6"]],
      ],
      [
        "輸出結果",
        "只改這兩盒，保持順序與總數27。",
        ["8", "8", "5", "6"],
        [["輸出", "8 8 5 6"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main(){int n; cin>>n; vector<int>a(n); for(int &v:a) cin>>v;
    int lo=min_element(a.begin(),a.end())-a.begin(),hi=max_element(a.begin(),a.end())-a.begin();
    int avg=accumulate(a.begin(),a.end(),0)/n, moved=a[hi]-avg;
    a[hi]-=moved; a[lo]+=moved;
    for(int i=0;i<n;++i) cout<<(i?" ":"")<<a[i]; cout<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, a = d[0], d[1:]
lo, hi = a.index(min(a)), a.index(max(a))
average = sum(a)//n
moved = a[hi]-average
a[hi] -= moved
a[lo] += moved
print(*a)`,
  ),

  lesson(
    "a160",
    "arrays",
    "吸收區間與邊界補足",
    [
      "找到唯一最高能量礦石，先取左右各 A/2 顆，再把不足側的數量補到另一側。",
      "以包含中心的半開區間 [left,right) 表示被合併的礦石。先截到地圖範圍；需要的總長度為 min(N,A+1)，若不足先向左擴，再向右補足。",
      "區間和是吸收後中心能量；原總和減去區間和是其餘礦石剩餘能量。當 A≥N-1 時區間就是全陣列。",
    ],
    "時間 O(N) ・ 空間 O(N)",
    "A 是被吸收的其他礦石顆數，不包含中心自己；某側不足不能直接丟掉缺額。",
    [
      [
        "找到中心",
        "第3顆能量30最大，A=4，每側先取2顆。",
        ["3", "8", "30", "5", "9", "2"],
        [["中心箱號", "3"]],
      ],
      [
        "吸收區間",
        "吸收第1、2、4、5顆，中心連同它們的和為55。",
        ["3+8+30+5+9"],
        [["中心能量", "55"]],
      ],
      [
        "計算剩餘",
        "只有第6顆2未被吸收，原總和57。",
        ["55", "2"],
        [["輸出", "55 2"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;
int main(){int n,a; cin>>n>>a; vector<int>t(n); for(int &x:t) cin>>x;
    int p=max_element(t.begin(),t.end())-t.begin(),left=max(0,p-a/2),right=min(n,p+a/2+1);
    int need=min(n,a+1)-(right-left),take=min(left,need); left-=take; need-=take; right+=need;
    int gain=accumulate(t.begin()+left,t.begin()+right,0),total=accumulate(t.begin(),t.end(),0);
    cout<<gain<<' '<<total-gain<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, a = d[:2]
t = d[2:2+n]
p = t.index(max(t))
left, right = max(0, p-a//2), min(n, p+a//2+1)
need = min(n, a+1)-(right-left)
take = min(left, need)
left -= take
right += need-take
gain = sum(t[left:right])
print(gain, sum(t)-gain)`,
  ),

  lesson(
    "a161",
    "simulation",
    "復位時間與終身得分分開維護",
    [
      "每秒先讓到期板子升起，再處理命中，最後檢查是否全倒。",
      "每塊板用 ready[k] 保存重新升起的時刻；在第 t 秒若 ready[k]≤t 就是立著。命中立著的板才把 ready[k] 設為 t+12，命中已倒板不改時間。",
      "另以 scored[k] 記錄這塊板是否曾得分，避免復位後重複計分。任何時刻九塊 ready 都大於 t 就記下 perfect，之後即使升起仍維持曾全清的結果。",
    ],
    "時間 O(9N) ・ 空間 O(9)，Python 輸入緩衝 O(N)",
    "第1秒打倒的板在第13秒投球前已升起；板子復位不會重置可得分資格。",
    [
      [
        "前兩球",
        "第1秒倒2號、第2秒倒4號，得分2+4=6。",
        ["2→13秒升", "4→14秒升"],
        [["分數", "6"]],
      ],
      [
        "重複命中與落空",
        "第3秒再中2號不重計分也不改13秒的復位；第4秒落空。",
        ["2仍倒", "-1落空"],
        [["分數", "6"]],
      ],
      [
        "最後兩球",
        "第5、6秒倒6號與8號，未全清，總分20。",
        ["2", "4", "6", "8"],
        [["輸出", "20"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){int n; cin>>n; int ready[10]={},score=0; bool scored[10]={},perfect=false;
    for(int t=1;t<=n;++t){int k; cin>>k;
        if(k!=-1&&ready[k]<=t){ready[k]=t+12; if(!scored[k]){scored[k]=true; score+=k;}}
        bool all=true; for(int j=1;j<=9;++j) if(ready[j]<=t) all=false;
        perfect=perfect||all;
    }
    if(perfect) cout<<"perfect\n"; else cout<<score<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
ready = [0] * 10
scored = set()
perfect = False
for t, k in enumerate(d[1:1+d[0]], 1):
    if k != -1 and ready[k] <= t:
        ready[k] = t+12
        scored.add(k)
    if all(ready[j] > t for j in range(1, 10)):
        perfect = True
print('perfect' if perfect else sum(scored))`,
  ),

  lesson(
    "a162",
    "count-frequency",
    "分組平均與從右分配餘數",
    [
      "先將商品字母統一大小寫，統計每種商品的總量與區域數。",
      "同一商品總量除以區域數得商 q、餘數 r，所有區域先分 q。由右向左掃描原區域，只要該商品還有餘數就多放1並將餘數減1。",
      "每區最多仍為9，因為原數量都在0到9。把各區答案直接連成字串輸出，不加空格。",
    ],
    "時間 O(|S|+26) ・ 空間 O(|S|+26)",
    "大小寫算同種商品；餘數先給最右區，不是最左區。",
    [
      [
        "分組加總",
        "a/A的9+2=11，b/B的1+7=8，c/C的8+3=11，各兩區。",
        ["A:11/2", "B:8/2", "C:11/2"],
        [["商", "A5 B4 C5"]],
      ],
      [
        "從右給餘數",
        "A、C各餘1，給位置4的A與位置6的C。",
        ["第4區:6", "第6區:6"],
        [["剩餘餘數", "0,0,0"]],
      ],
      [
        "依原區域輸出",
        "六區依序為5、4、5、6、4、6。",
        ["5", "4", "5", "6", "4", "6"],
        [["輸出", "545646"]],
      ],
    ],
    String.raw`#include <iostream>
#include <string>
#include <cctype>
using namespace std;
int main(){string s,t; cin>>s>>t; int total[26]={},cnt[26]={},q[26]={},rem[26]={};
    for(int i=0;i<(int)s.size();++i){s[i]=toupper((unsigned char)s[i]); int k=s[i]-'A'; total[k]+=t[i]-'0'; ++cnt[k];}
    for(int k=0;k<26;++k) if(cnt[k]){q[k]=total[k]/cnt[k]; rem[k]=total[k]%cnt[k];}
    string ans(s.size(),'0');
    for(int i=(int)s.size()-1;i>=0;--i){int k=s[i]-'A'; ans[i]='0'+q[k]+(rem[k]>0); if(rem[k]) --rem[k];}
    cout<<ans<<'\n';
}`,
    String.raw`s = input().strip().upper()
t = input().strip()
total, count = {}, {}
for ch, digit in zip(s, t):
    total[ch] = total.get(ch, 0)+int(digit)
    count[ch] = count.get(ch, 0)+1
qr = {ch: list(divmod(total[ch], count[ch])) for ch in count}
answer = [''] * len(s)
for i in range(len(s)-1, -1, -1):
    q, r = qr[s[i]]
    answer[i] = str(q+(r > 0))
    if r:
        qr[s[i]][1] -= 1
print(''.join(answer))`,
  ),

  lesson(
    "a163",
    "arrays",
    "兩側各自維持遮擋高度",
    [
      "從家往左右各掃一次，只把嚴格超過目前遮擋高度的建築算進去。",
      "每側起始遮擋高度都是家高。走到高度 h，若 h>目前最高才看得見，並將最高更新為 h；否則它不能被看見也不會提高最高值。",
      "左右互不遮擋，所以開始掃另一側時要把最高值重設為家高。M 是一基編號，取陣列時先減一。",
    ],
    "時間 O(N) ・ 空間 O(N)",
    "相同高度會遮住後面的建築，因此比較必須嚴格大於；家本身不計入。",
    [
      [
        "左側近到遠",
        "家為第4棟高2；左側6可見、4被遮、9可見。",
        ["6 ✓", "4 ×", "9 ✓"],
        [["左側可見", "2"]],
      ],
      [
        "右側近到遠",
        "重新從家高2開始；5可見、8可見、下一個8被遮。",
        ["5 ✓", "8 ✓", "8 ×"],
        [["右側可見", "2"]],
      ],
      ["合計", "左右共2+2棟。", ["左2", "右2"], [["輸出", "4"]]],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,m; cin>>n>>m; --m; vector<int>a(n); for(int &x:a) cin>>x; int ans=0;
    for(int direction:{-1,1}){int highest=a[m]; for(int i=m+direction;i>=0&&i<n;i+=direction)
        if(a[i]>highest){++ans; highest=a[i];}}
    cout<<ans<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n, m = d[:2]
m -= 1
a, answer = d[2:2+n], 0
for positions in (range(m-1, -1, -1), range(m+1, n)):
    highest = a[m]
    for i in positions:
        if a[i] > highest:
            answer += 1
            highest = a[i]
print(answer)`,
  ),

  lesson(
    "a164",
    "search-optimization",
    "以距離平方找最近魚群",
    [
      "逐群計算與漁船的座標差平方和，保存最小者的原座標。",
      "直線距離的平方是 (A-X)²+(B-Y)²。平方根是遞增函數，直接比較平方和即可得到相同排序，且全程整數。",
      "第一筆魚群即可作為初始最佳，之後遇到更小距離才更新。題目保證最近一群唯一，輸出的是座標而非距離或編號。",
    ],
    "時間 O(N) ・ C++ 額外空間 O(1)，Python 輸入緩衝 O(N)",
    "不能比較曼哈頓距離 |dx|+|dy|；本題要直線距離。",
    [
      [
        "第一群",
        "漁船(10,10)，魚群(11,15)，平方距離1+25=26。",
        ["11 15", "d²=26"],
        [["最佳座標", "11 15"]],
      ],
      [
        "第二群更新",
        "(14,11)的平方距離16+1=17，小於26。",
        ["14 11", "d²=17"],
        [["最佳座標", "14 11"]],
      ],
      [
        "第三群較遠",
        "(20,10)平方距離100，最佳維持第二群。",
        ["20 10", "d²=100"],
        [["輸出", "14 11"]],
      ],
    ],
    String.raw`#include <iostream>
#include <limits>
using namespace std;
int main(){int x,y,n,a,b,aa=0,bb=0,best=numeric_limits<int>::max(); cin>>x>>y>>n;
    while(n--){cin>>a>>b; int d=(a-x)*(a-x)+(b-y)*(b-y); if(d<best){best=d; aa=a; bb=b;}}
    cout<<aa<<' '<<bb<<'\n';
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
x, y, n = next(it), next(it), next(it)
best = None
answer = None
for _ in range(n):
    a, b = next(it), next(it)
    dist = (a-x)**2+(b-y)**2
    if best is None or dist < best:
        best, answer = dist, (a, b)
print(*answer)`,
  ),

  lesson(
    "a165",
    "simulation",
    "依營收排序再依序派人",
    [
      "將工廠按預估營收由高到低排序，依序派滿或用完剩餘員工。",
      "處理某工廠前若 H=0 就停止；否則此工廠至少獲得一人，計數加一，再從 H 扣除 min(H,需求)。",
      "部分滿足仍要計入工廠數；若全部工廠滿額後還有人，答案也只到 N。營收皆不同，不需處理排序平手。",
    ],
    "時間 O(N log N) ・ 空間 O(N)",
    "H=0 時一間都不算；不能只計算完全滿額的工廠。",
    [
      [
        "按營收排序",
        "營收20需4人、15需5人、8需3人，總共7人。",
        ["20:4", "15:5", "8:3"],
        [["H", "7"]],
      ],
      [
        "派滿第一間",
        "先派4人到營收20的工廠，剩3人。",
        ["20→4人"],
        [
          ["H", "3"],
          ["有人工廠", "1"],
        ],
      ],
      [
        "部分派遣",
        "剩3人派到營收15的工廠，雖未滿5人仍算一間。",
        ["15→3人", "8→0人"],
        [["輸出", "2"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>
using namespace std;
int main(){int n,h; cin>>n; vector<pair<int,int>>a(n); for(auto &p:a) cin>>p.first>>p.second; cin>>h;
    sort(a.begin(),a.end(),greater<pair<int,int>>()); int ans=0;
    for(auto [revenue,need]:a){if(h==0) break; ++ans; h-=min(h,need);}
    cout<<ans<<'\n';
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
factories = [(next(it), next(it)) for _ in range(n)]
h = next(it)
answer = 0
for revenue, need in sorted(factories, reverse=True):
    if h == 0:
        break
    answer += 1
    h -= min(h, need)
print(answer)`,
  ),

  lesson(
    "a166",
    "simulation",
    "用最新位置決定接球與閃避",
    [
      "每一球先判斷是否在目前位置左右 R 的範圍內，再依球速更新位置。",
      "若 |P-X|>R 則不動；否則 S≤V 時移到P。超速時若 P≥X 就往左15，否則往右15。P=X 的超速球依規定往左。",
      "所有後續判斷使用更新過的位置，最後位置可以是負數，也可能超出1000。",
    ],
    "時間 O(N) ・ C++ 額外空間 O(1)，Python 輸入緩衝 O(N)",
    "範圍端點與最高球速都可接；不能每次都用最初的位置計算。",
    [
      [
        "第一球接住",
        "起點50，P=60在範圍端點，S=7等於V，移到60。",
        ["50→60"],
        [["X", "60"]],
      ],
      [
        "第二球閃避",
        "P=55在左側且速度8過快，往右移15到75。",
        ["60→75"],
        [["X", "75"]],
      ],
      [
        "後兩球接住",
        "P=80速度1，接後到80；P=70速度5，在端點也接住。",
        ["75→80", "80→70"],
        [["輸出", "70"]],
      ],
    ],
    String.raw`#include <iostream>
#include <cstdlib>
using namespace std;
int main(){int x,r,v,n; cin>>x>>r>>v>>n;
    while(n--){int p,s; cin>>p>>s; if(abs(p-x)>r) continue;
        if(s<=v) x=p; else x+=(p>=x?-15:15);}
    cout<<x<<'\n';
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
x, r, v, n = next(it), next(it), next(it), next(it)
for _ in range(n):
    p, s = next(it), next(it)
    if abs(p-x) <= r:
        if s <= v:
            x = p
        else:
            x += -15 if p >= x else 15
print(x)`,
  ),

  lesson(
    "a167",
    "search-optimization",
    "展開積木輪廓並枚舉位移",
    [
      "把每段寬度展開成單位長度高度，再枚舉短積木的所有合法起點。",
      "長積木從高度1開始交替1、2，短積木從高度2開始交替2、1。起點 offset 需滿足 offset+短寬≤長寬；逐格檢查兩高度和≤3。",
      "所有段端點皆為整數，兩輪廓的重疊組合只在整數位移處改變。若非整數位移可行，其相鄰整數邊界也可行，因此枚舉整數位移足夠；高度和小於3留下空隙也符合。",
    ],
    "設展開長短寬為 L、S：時間 O(L+S+max(0,L-S+1)S) ・ 空間 O(L+S)",
    "不能翻轉短積木，也不能只比較卡榫總寬；每個重疊位置都不能2+2。",
    [
      [
        "展開輪廓",
        "長積木1111221111，短積木22211222。",
        ["1111221111", "22211222"],
        [["L,S", "10,8"]],
      ],
      [
        "測試位移0",
        "短的第6格高度2碰到長的第6格高度2，失敗。",
        ["第6格:2+2=4"],
        [["offset", "0"]],
      ],
      [
        "測試位移1",
        "短凹槽對準長卡榫，所有重疊和都≤3。",
        ["長:1111221111", "短: 22211222"],
        [
          ["offset", "1"],
          ["輸出", "YES"],
        ],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,m,w; cin>>n; vector<int>a,b;
    for(int i=0;i<2*n+1;++i){cin>>w; a.insert(a.end(),w,1+i%2);}
    cin>>m; for(int i=0;i<2*m-1;++i){cin>>w; b.insert(b.end(),w,2-i%2);}
    for(int s=0;s+(int)b.size()<=(int)a.size();++s){bool ok=true;
        for(int j=0;j<(int)b.size();++j) if(a[s+j]+b[j]>3){ok=false; break;}
        if(ok){cout<<"YES\n"; return 0;}}
    cout<<"NO\n";
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
a = []
for i in range(2*n+1):
    a.extend([1+i%2] * next(it))
m = next(it)
b = []
for i in range(2*m-1):
    b.extend([2-i%2] * next(it))
print('YES' if any(all(a[s+j]+h <= 3 for j, h in enumerate(b))
                   for s in range(len(a)-len(b)+1)) else 'NO')`,
  ),

  lesson(
    "a168",
    "simulation",
    "按菜單位置輪流上菜",
    [
      "先處理每家菜單的第一道，再處理每家的第二道，直到所有菜單結束。",
      "外層為菜單位置 k，內層按餐廳輸入順序，若該店仍有第k道才處理。英文字母加入答案，數字只跳過輸出，仍消耗那一輪的上菜機會。",
      "菜單長度不同時，已結束的餐廳直接略過，不能先刪掉素食後再輪流，否則實際順序會改變。",
    ],
    "時間 O(NL) ・ 空間 O(NL)，L 為最長菜單長度≤100",
    "素食也占一輪；先濾掉數字會讓該店後面的葷食提早出現。",
    [
      [
        "第一輪",
        "三家依序上A、2、E，只留下AE。",
        ["A", "2", "E"],
        [["答案", "AE"]],
      ],
      ["第二輪", "上1、3、F，追加F。", ["1", "3", "F"], [["答案", "AEF"]]],
      [
        "完成後續",
        "第三輪B、D，第四輪只有C，得到AEFBDC。",
        ["B", "D", "C"],
        [["輸出", "AEFBDC"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main(){int n,len=0; cin>>n; vector<string>a(n); for(string &s:a){cin>>s; len=max(len,(int)s.size());}
    for(int k=0;k<len;++k) for(const string &s:a) if(k<(int)s.size()&&s[k]>='A'&&s[k]<='Z') cout<<s[k];
    cout<<'\n';
}`,
    String.raw`import sys
lines = sys.stdin.read().split()
n = int(lines[0])
menus = lines[1:1+n]
answer = []
for k in range(max(map(len, menus))):
    for menu in menus:
        if k < len(menu) and 'A' <= menu[k] <= 'Z':
            answer.append(menu[k])
print(''.join(answer))`,
  ),

  lesson(
    "a169",
    "read-calculate",
    "36小時制的秒數回繞",
    [
      "將時間換成總秒數，加上每個時區5400秒的偏移，再對36小時取模。",
      "一天有129600秒，偏移為 T×90×60。向西可能使總秒數為負，C++ 用 (value%day+day)%day，Python 的正除數取模可直接回到合法範圍。",
      "再以3600與60整除、取餘數拆回時分秒，小時不補零，分鐘與秒各輸出兩位。",
    ],
    "時間 O(1) ・ 空間 O(1)",
    "一天是36小時而非24；T=24恰好繞一整天。",
    [
      [
        "原時間秒數",
        "10:45:07 等於38707秒。",
        ["10×3600", "45×60", "7"],
        [["總秒數", "38707"]],
      ],
      [
        "向東三時區",
        "加3×5400=16200秒，得到54907秒，未超出一天。",
        ["38707+16200"],
        [["新秒數", "54907"]],
      ],
      [
        "格式化",
        "拆成15小時15分鐘7秒，秒補0。",
        ["15", "15", "07"],
        [["輸出", "15:15:07"]],
      ],
    ],
    String.raw`#include <iostream>
#include <iomanip>
using namespace std;
int main(){int h,m,s,t; cin>>h>>m>>s>>t; int day=36*3600;
    int v=((h*3600+m*60+s+t*5400)%day+day)%day;
    cout<<v/3600<<':'<<setfill('0')<<setw(2)<<v/60%60<<':'<<setw(2)<<v%60<<'\n';
}`,
    String.raw`h, m, s, t = map(int, input().split())
value = (h*3600+m*60+s+t*5400) % (36*3600)
print(f'{value//3600}:{value//60%60:02d}:{value%60:02d}')`,
  ),

  lesson(
    "a170",
    "arrays",
    "保持身高體重配對再比較乘積",
    [
      "先保存兩列資料，再以相同索引的身高乘體重，找出最小乘積。",
      "輸入的第二列全是身高、第三列全是體重，不能把相鄰兩個輸入數當成同一隻獅子的身高體重。",
      "用第一隻作初始最佳，逐隻比較，更新時保存索引；最後用最佳索引取回原身高與體重。最小乘積保證唯一。",
    ],
    "時間 O(N) ・ 空間 O(N)",
    "不能分別取最小身高和最小體重，它們可能屬於不同小獅子。",
    [
      [
        "建立配對",
        "四隻為(12,8)、(4,21)、(9,10)、(20,3)。",
        ["12×8=96", "4×21=84", "9×10=90", "20×3=60"],
        [["初始最佳", "第1隻"]],
      ],
      [
        "比較前3隻",
        "第2隻84小於96，第3隻90不更新。",
        ["96", "84", "90"],
        [["最佳乘積", "84"]],
      ],
      [
        "第4隻更小",
        "60最小，輸出其身高20與體重3。",
        ["20", "3"],
        [["輸出", "20 3"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n; cin>>n; vector<int>h(n),w(n); for(int &x:h) cin>>x; for(int &x:w) cin>>x;
    int best=0; for(int i=1;i<n;++i) if(h[i]*w[i]<h[best]*w[best]) best=i;
    cout<<h[best]<<' '<<w[best]<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n = d[0]
h, w = d[1:1+n], d[1+n:1+2*n]
best = min(range(n), key=lambda i: h[i]*w[i])
print(h[best], w[best])`,
  ),

  lesson(
    "a171",
    "simulation",
    "沿不升坡走到底再比較落差",
    [
      "從著陸點分別向左、右走，只要下一格不高於目前格就繼續。",
      "每次用目前格與下一格比較，相同高度平台也能通過。分別取得左右最終停點後，因起點高度相同，落差較大就是終點高度較低的一側。",
      "若 T 是地圖端點，直接選朝內側的停點；其餘情況由兩終點高度比較決定，最後將零基位置轉回一基。",
    ],
    "時間 O(N) ・ 空間 O(N)",
    "要比較相鄰坡度，而不是只要求每格比原山峰低；平台盡頭也要繼續檢查。",
    [
      [
        "往左滑",
        "第4格高9，往左到第3、2格高3，再遇第1格高8停止。",
        ["位置4:9", "位置3:3", "位置2:3"],
        [
          ["左停點", "2"],
          ["左落差", "6"],
        ],
      ],
      [
        "往右滑",
        "從9經6、1、1到第7格，再遇第8格4停止。",
        ["位置5:6", "位置6:1", "位置7:1"],
        [
          ["右停點", "7"],
          ["右落差", "8"],
        ],
      ],
      ["選較大落差", "右落差8大於左落差6。", ["左6", "右8"], [["輸出", "7"]]],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int n,t; cin>>n; vector<int>a(n); for(int &x:a) cin>>x; cin>>t; --t;
    int l=t,r=t; while(l>0&&a[l-1]<=a[l]) --l; while(r+1<n&&a[r+1]<=a[r]) ++r;
    int ans=t==0?r:t==n-1?l:a[l]<a[r]?l:r; cout<<ans+1<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
n = d[0]
a, t = d[1:1+n], d[1+n]-1
left = right = t
while left > 0 and a[left-1] <= a[left]:
    left -= 1
while right+1 < n and a[right+1] <= a[right]:
    right += 1
answer = right if t == 0 else left if t == n-1 else left if a[left] < a[right] else right
print(answer+1)`,
  ),

  lesson(
    "a172",
    "number-theory",
    "枚舉一種跳數檢查非負整數解",
    [
      "枚舉跳 N 的次數 a，再檢查剩餘距離是否能整除 M。",
      "a 從0到 D//N，因此剩餘 D-aN 始終非負。若它是 M 的倍數，就能用 (D-aN)//M 次另一種跳躍完成。",
      "這涵蓋所有非負次數組合，包括只用一種距離。僅檢查 gcd(N,M) 是否整除 D 不足夠，因為不能使用負次數回跳。",
    ],
    "時間 O(D/N+1) ・ 空間 O(1)",
    "兩種跳躍都允許0次；不能用帶負係數的整數解當成可行路線。",
    [
      [
        "不跳6",
        "41不是11的倍數，a=0失敗。",
        ["41=3×11+8"],
        [
          ["a", "0"],
          ["餘數", "8"],
        ],
      ],
      [
        "跳一次6",
        "41-6=35，仍不是11倍數。",
        ["35=3×11+2"],
        [
          ["a", "1"],
          ["餘數", "2"],
        ],
      ],
      [
        "跳五次6",
        "a=2、3、4也不符；a=5剩11，可再跳一次11。",
        ["5×6+1×11=41"],
        [["輸出", "YES"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){int n,m,d; cin>>n>>m>>d;
    for(int a=0;a*n<=d;++a) if((d-a*n)%m==0){cout<<"YES\n"; return 0;}
    cout<<"NO\n";
}`,
    String.raw`n, m, d = map(int, input().split())
print('YES' if any((d-a*n) % m == 0 for a in range(d//n+1)) else 'NO')`,
  ),

  lesson(
    "a173",
    "grid",
    "同步以原始非零鄰格估值",
    [
      "每個原本為0的格子，只平均上下左右原本非零的鄰居。",
      "用獨立的結果陣列保存答案，原圖完全不修改。對0格累加合法且非零的鄰格，再除以數量取整；沒有合格鄰居時維持0。",
      "原本非零格直接複製，不需重新估值。分開讀寫可避免同一輪的新值傳播到後面的0格。",
    ],
    "時間 O(RC) ・ 空間 O(RC)",
    "0不加入總和也不加入分母；新算的9不能拿來幫中心格算平均。",
    [
      [
        "上方0格",
        "(1,2)鄰居原值7、11、0，忽略0後平均為9。",
        ["7", "0→9", "11"],
        [["有效鄰格數", "2"]],
      ],
      [
        "左中與中心",
        "(2,1)用7、3得5；中心只用4、9得6，不能用剛算的9或5。",
        ["(2,1):5", "(2,2):6"],
        [["讀取來源", "原圖"]],
      ],
      [
        "右下0格",
        "(3,3)用4、9得6，其餘原值保持。",
        ["7 9 11", "5 6 4", "3 9 6"],
        [["輸出列數", "3"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){int r,c; cin>>r>>c; vector<vector<int>>a(r,vector<int>(c)); for(auto &row:a) for(int &v:row) cin>>v;
    auto b=a; int dr[]={-1,1,0,0},dc[]={0,0,-1,1};
    for(int i=0;i<r;++i) for(int j=0;j<c;++j) if(a[i][j]==0){int sum=0,count=0;
        for(int k=0;k<4;++k){int x=i+dr[k],y=j+dc[k]; if(x>=0&&x<r&&y>=0&&y<c&&a[x][y]){sum+=a[x][y]; ++count;}}
        b[i][j]=count?sum/count:0;
    }
    for(auto &row:b){for(int j=0;j<c;++j) cout<<(j?" ":"")<<row[j]; cout<<'\n';}
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
r, c = next(it), next(it)
a = [[next(it) for _ in range(c)] for _ in range(r)]
b = [row[:] for row in a]
for i in range(r):
    for j in range(c):
        if a[i][j] == 0:
            values = [a[x][y] for x, y in ((i-1,j),(i+1,j),(i,j-1),(i,j+1))
                      if 0 <= x < r and 0 <= y < c and a[x][y] != 0]
            b[i][j] = sum(values)//len(values) if values else 0
for row in b:
    print(*row)`,
  ),

  lesson(
    "a174",
    "count-frequency",
    "以次數降序與字母升序排序",
    [
      "統計每種字母的出現次數，再將有出現的字母排序並各輸出一次。",
      "排序第一條件為負的次數，第二條件為字母，等價於次數多的先、同次數字母較小的先。C++ 比較器也可直接明寫這兩條規則。",
      "只收集次數非零的字母，不要把全部26字母輸出，也不要依原字串重複輸出多次。",
    ],
    "時間 O(L+26 log 26) ・ 計數空間 O(26)，輸入字串 O(L)",
    "同次數按A到Z，不是依首次出現順序。",
    [
      [
        "統計字母",
        "BANANABREAD 中A有4次，B、N各2次，D、E、R各1次。",
        ["A:4", "B:2", "N:2", "D:1", "E:1", "R:1"],
        [["總字數", "11"]],
      ],
      [
        "排序各組",
        "先A，再同為2次的B、N，再同為1次的D、E、R。",
        ["A", "BN", "DER"],
        [["種類數", "6"]],
      ],
      ["每種只輸出一次", "連成密碼ABNDER。", ["ABNDER"], [["輸出", "ABNDER"]]],
    ],
    String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
int main(){string s; cin>>s; int c[26]={}; for(char x:s) ++c[x-'A']; vector<int>letters;
    for(int i=0;i<26;++i) if(c[i]) letters.push_back(i);
    sort(letters.begin(),letters.end(),[&](int a,int b){return c[a]!=c[b]?c[a]>c[b]:a<b;});
    for(int i:letters) cout<<char('A'+i); cout<<'\n';
}`,
    String.raw`from collections import Counter
counts = Counter(input().strip())
print(''.join(sorted(counts, key=lambda ch: (-counts[ch], ch))))`,
  ),

  lesson(
    "a175",
    "conditions",
    "自訂排序鍵與保留最早並列",
    [
      "為每個數建立比較鍵，僅在鍵嚴格較大時更新答案。",
      "7的倍數使用鍵 (1,x%70)，非倍數使用鍵 (0,-(x%77))。先比較是否整除7，再比較第二欄，即完整表達題目的三條規則。",
      "0只作輸入終止標記，不參與比較。遇到同鍵不更新，便能保留最早出現的原始數字。",
    ],
    "時間 O(K) ・ Python 輸入緩衝 O(K)，C++ 額外空間 O(1)，K≤10",
    "並列比較的是指定餘數，不是數值本身；133與63在本題視為一樣大。",
    [
      [
        "22與91",
        "22非7倍數，91是7倍數，91立刻勝出，91%70=21。",
        ["22:(0,-22)", "91:(1,21)"],
        [["best", "91"]],
      ],
      [
        "63更新",
        "63是7倍數且63%70=63，大於21。",
        ["63:(1,63)"],
        [["best", "63"]],
      ],
      [
        "並列與結束",
        "133%70也是63，保留較早63；8非倍數，0結束。",
        ["133並列", "8較小", "0結束"],
        [["輸出", "63"]],
      ],
    ],
    String.raw`#include <iostream>
#include <utility>
using namespace std;
pair<int,int> key(int x){return x%7==0?make_pair(1,x%70):make_pair(0,-(x%77));}
int main(){int x,best=0; while(cin>>x&&x!=0) if(best==0||key(x)>key(best)) best=x; cout<<best<<'\n';}
`,
    String.raw`import sys
def key(x):
    return (1, x % 70) if x % 7 == 0 else (0, -(x % 77))
best = None
for x in map(int, sys.stdin.buffer.read().split()):
    if x == 0:
        break
    if best is None or key(x) > key(best):
        best = x
print(best)`,
  ),

  lesson(
    "a176",
    "arrays",
    "篩選逾期書再按編號排序",
    [
      "只保留借閱天數大於100的書，累加每本的逾期天數乘5。",
      "編號輸入順序不一定遞增，收集逾期書號後排序，第一行輸出書號，第二行輸出所有罰款總和。",
      "若逾期清單為空，只輸出單獨一行0，不能再印一行罰款0；借滿100天也不算逾期。",
    ],
    "時間 O(N log N) ・ 空間 O(N)",
    "應依書號而非天數排序；(D-100)×5才是罰款，不是D×5。",
    [
      [
        "前兩本",
        "8號借103天罰15；2號100天不用罰。",
        ["8:15", "2:0"],
        [["罰款", "15"]],
      ],
      [
        "後兩本",
        "17號121天罰105；5號99天不用罰。",
        ["17:105", "5:0"],
        [["罰款", "120"]],
      ],
      [
        "排序輸出",
        "逾期編號8、17已遞增，第二行印120。",
        ["8 17", "120"],
        [["輸出行數", "2"]],
      ],
    ],
    String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main(){int n,s,d,total=0; cin>>n; vector<int>ids;
    while(n--){cin>>s>>d; if(d>100){ids.push_back(s); total+=(d-100)*5;}}
    if(ids.empty()){cout<<"0\n"; return 0;} sort(ids.begin(),ids.end());
    for(int i=0;i<(int)ids.size();++i) cout<<(i?" ":"")<<ids[i]; cout<<'\n'<<total<<'\n';
}`,
    String.raw`import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
n = next(it)
ids, total = [], 0
for _ in range(n):
    s, d = next(it), next(it)
    if d > 100:
        ids.append(s)
        total += (d-100)*5
if ids:
    print(*sorted(ids))
    print(total)
else:
    print(0)`,
  ),

  lesson(
    "a177",
    "text",
    "逐段處理正向與反向模式",
    [
      "用緩衝區保存目前非符號段，遇到正負號時依舊模式輸出該段，再切換模式。",
      "初始為正向；+指定正向、-指定反向，並非遇到符號就翻轉。正向段維持原順序，反向段將整段倒過來。",
      "符號不進入明文，連續符號造成的空段可直接處理；結尾也要沖出最後一段。結果依段落原順序接起。",
    ],
    "時間 O(L) ・ 空間 O(L)",
    "反向只作用於兩符號之間的整段，不是把已輸出的全文倒轉；最後一段不能遺漏。",
    [
      [
        "初始正向",
        "讀ab後遇-，先輸出ab，再改為反向。",
        ["ab", "-"],
        [["明文", "ab"]],
      ],
      [
        "反向後回正向",
        "CD12倒成21DC；+後的xy原樣輸出。",
        ["CD12→21DC", "xy→xy"],
        [["明文", "ab21DCxy"]],
      ],
      [
        "沖出末段",
        "最後-789採反向，追加987。",
        ["789→987"],
        [["輸出", "ab21DCxy987"]],
      ],
    ],
    String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main(){string s,part,ans; cin>>s; bool reverseMode=false;
    auto flush=[&](){if(reverseMode) reverse(part.begin(),part.end()); ans+=part; part.clear();};
    for(char ch:s){if(ch=='+'||ch=='-'){flush(); reverseMode=ch=='-';} else part+=ch;}
    flush(); cout<<ans<<'\n';
}`,
    String.raw`s = input().strip()
parts, buffer = [], []
reverse_mode = False
for ch in s:
    if ch in '+-':
        parts.append(''.join(reversed(buffer) if reverse_mode else buffer))
        buffer = []
        reverse_mode = ch == '-'
    else:
        buffer.append(ch)
parts.append(''.join(reversed(buffer) if reverse_mode else buffer))
print(''.join(parts))`,
  ),

  lesson(
    "a178",
    "conditions",
    "數量與身高總和都要嚴格較大",
    [
      "分別求螞蟻與蚱蜢的身高總和，並同時檢查兩項嚴格比較。",
      "先讀 M 個螞蟻身高，再讀 N 個蚱蜢身高；條件為 M>N 且 antSum>grassSum，兩項都成立才出發。",
      "不能比較平均身高，也不能只滿足其中一項。輸出使用首字大寫的 Yes 或 No。",
    ],
    "時間 O(M+N) ・ Python 輸入緩衝 O(M+N)，C++ 額外空間 O(1)",
    "數量相同或總身高相同都不成立，不能使用≥或or。",
    [
      [
        "比較數量",
        "螞蟻3隻，蚱蜢2隻，3>2成立。",
        ["M=3", "N=2"],
        [["數量條件", "true"]],
      ],
      [
        "加總身高",
        "螞蟻14+21+30=65；蚱蜢20+40=60。",
        ["65", "60"],
        [["高度條件", "65>60"]],
      ],
      [
        "同時成立",
        "兩項嚴格比較都通過，輸出Yes。",
        ["true AND true"],
        [["輸出", "Yes"]],
      ],
    ],
    String.raw`#include <iostream>
using namespace std;
int main(){int m,n,x,a=0,g=0; cin>>m>>n;
    for(int i=0;i<m;++i){cin>>x; a+=x;} for(int i=0;i<n;++i){cin>>x; g+=x;}
    cout<<(m>n&&a>g?"Yes":"No")<<'\n';
}`,
    String.raw`import sys
d = list(map(int, sys.stdin.buffer.read().split()))
m, n = d[:2]
a, g = d[2:2+m], d[2+m:2+m+n]
print('Yes' if m > n and sum(a) > sum(g) else 'No')`,
  ),

  lesson(
    "a179",
    "count-frequency",
    "擷取末三位再按十分類",
    [
      "每個六位檔案編號取最後三位，轉成整數後除以10得到資料夾號。",
      "例如405與409都屬40號，010屬1號，999屬99號。使用100個桶累計各資料夾的檔案數。",
      "最後從0到99掃描，只輸出非零桶。原編號以字串讀取，可保留前導零並明確定位最後三位。",
    ],
    "時間 O(N+100) ・ 計數空間 O(100)，Python 輸入緩衝 O(N)",
    "資料夾看末三位的前兩位，不是整個六位編號除以10；000到009都屬0號。",
    [
      [
        "前兩份檔案",
        "123405與987409的類別405、409，兩者放40號。",
        ["405→40", "409→40"],
        [["40號數量", "2"]],
      ],
      [
        "其餘分類",
        "102010放1號，888999放99號，333000放0號。",
        ["010→1", "999→99", "000→0"],
        [["非空資料夾", "4"]],
      ],
      [
        "遞增輸出",
        "依0、1、40、99順序列印，總計5份。",
        ["0 1", "1 1", "40 2", "99 1"],
        [["檔案總數", "5"]],
      ],
    ],
    String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){int n,c[100]={}; string s; cin>>n; while(n--){cin>>s; ++c[stoi(s.substr(3))/10];}
    for(int i=0;i<100;++i) if(c[i]) cout<<i<<' '<<c[i]<<'\n';
}`,
    String.raw`import sys
d = sys.stdin.read().split()
n = int(d[0])
count = [0] * 100
for code in d[1:1+n]:
    count[int(code[-3:])//10] += 1
for folder, amount in enumerate(count):
    if amount:
        print(folder, amount)`,
  ),
];
