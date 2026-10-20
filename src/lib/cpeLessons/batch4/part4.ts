import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a700", {
    topic: "search", level: "hard", concept: "木棒子集合與正方形邊長回溯", goal: "以已使用木棒遮罩記憶化，逐邊湊出相同長度。",
    explanation: [
      "總長必須被4整除，且最長木棒不得超過side=總長/4。將木棒由長到短排列，逐根選進目前正在組的邊，累積fill不得超過side；恰滿時將fill歸0，開始下一邊。所有棒都用完即成功，因總長固定，此時一定完成四邊。",
      "以mask表示已使用棒，fill其實由已選棒長總和模side唯一決定，記憶化可避免不同選取順序重算同一子集合。每層相同長度的未用棒只嘗試一根；開始空邊時，可固定放入最長未用棒，因四條邊沒有區別，必可把含該棒的邊排為下一邊。這些剪枝不漏解，M≤20使遮罩搜尋可行。輸出小寫yes或no。",
    ],
    complexity: "最多 O(M·2^M) 時間、O(2^M) 記憶化空間，遞迴深度 O(M)。",
    pitfall: "必須使用全部木棒，不是找到任意四組等長就能忽略剩餘木棒。",
    traceLabel: "示意：木棒 2,2,1,1,1,1，side=2",
    trace: [
      { title: "前兩邊", description: "兩根2各自完成一邊。", cells: ["邊1:2", "邊2:2", "邊3:0", "邊4:0"], active: [0, 1], variables: [["已用棒", "2"], ["fill", "0"]] },
      { title: "第三邊", description: "兩根1湊成2。", cells: ["2", "2", "1+1", "0"], active: [2], variables: [["已用棒", "4"], ["fill", "0"]] },
      { title: "第四邊", description: "最後兩根1用完，四邊皆長2。", cells: ["2", "2", "1+1", "1+1"], active: [3], variables: [["已用棒", "6"], ["答案", "yes"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
#include <functional>
using namespace std;
int main(){
    int tests;cin>>tests;
    while(tests--){
        int n;cin>>n;vector<int>a(n);for(int &x:a)cin>>x;
        sort(a.rbegin(),a.rend());int total=accumulate(a.begin(),a.end(),0),side=total/4;
        if(total%4 || a[0]>side){cout<<"no\n";continue;}
        int full=(1<<n)-1;vector<signed char> memo(1<<n,-1);
        function<bool(int,int)> dfs=[&](int mask,int fill){
            if(mask==full)return true;
            if(memo[mask]!=-1)return memo[mask]==1;
            int previous=-1;
            for(int i=0;i<n;i++)if(!(mask>>i&1) && a[i]!=previous){
                previous=a[i];if(fill+a[i]>side)continue;
                if(dfs(mask|(1<<i),(fill+a[i])%side)){memo[mask]=1;return true;}
                if(fill==0)break;
            }
            memo[mask]=0;return false;
        };
        cout<<(dfs(0,0)?"yes":"no")<<'\n';
    }
}`,
    python: `import sys
from functools import lru_cache
it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it); a = sorted((next(it) for _ in range(n)), reverse=True)
    total = sum(a); side = total//4
    if total % 4 or a[0] > side:
        print('no'); continue
    full = (1 << n)-1
    @lru_cache(None)
    def dfs(mask, fill):
        if mask == full: return True
        previous = -1
        for i, length in enumerate(a):
            if mask >> i & 1 or length == previous: continue
            previous = length
            if fill+length > side: continue
            if dfs(mask | (1 << i), (fill+length) % side): return True
            if fill == 0: break
        return False
    print('yes' if dfs(0, 0) else 'no')
    dfs.cache_clear()
`,
  }),
  defineCpeLesson("a701", {
    topic: "simulation", level: "easy", concept: "不可變狀態快照與循環偵測", goal: "每步同時更新相鄰差，辨認全零或重複數組。",
    explanation: [
      "新狀態第i格是abs(old[i]−old[(i+1)%n])，最後一格也要接回第一格。所有新值都必須從同一份舊數組計算，因此建立另一個陣列，算完後整體替換；原地逐格修改會把新舊狀態混用。",
      "每輪先檢查是否全零，是就輸出ZERO；否則查完整狀態是否已出現，若重複表示確定性轉換進入週期，輸出LOOP。把狀態加入集合再轉換。各值保持在有限範圍，且本地保證1000步內停止，保存狀態即可，不需要猜固定迭代次數。每組重建集合，依開頭T處理。",
    ],
    complexity: "S≤1000步，Python雜湊平均 O(Sn) 時間與 O(Sn) 空間；C++有序集合上界 O(Sn log S)。",
    pitfall: "全零本身也是循環，但題目要求優先輸出ZERO。",
    traceLabel: "示意：n=3，初始 1,2,3",
    trace: [
      { title: "第一步", description: "|1−2|、|2−3|、|3−1|得到1,1,2。", cells: ["1", "1", "2"], active: [0, 1, 2], variables: [["步", "1"]] },
      { title: "第二步", description: "1,1,2轉成0,1,1。", cells: ["0", "1", "1"], active: [0, 1, 2], variables: [["步", "2"]] },
      { title: "進入循環", description: "之後1,0,1→1,1,0→0,1,1，重見第二步。", cells: ["1,0,1", "1,1,0", "0,1,1"], active: [2], variables: [["重複步", "5"], ["結果", "LOOP"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <set>
#include <algorithm>
#include <cstdlib>
using namespace std;
int main(){
    int tests;cin>>tests;
    while(tests--){
        int n;cin>>n;vector<int>a(n);for(int &x:a)cin>>x;set<vector<int>> seen;
        while(true){
            if(all_of(a.begin(),a.end(),[](int x){return x==0;})){cout<<"ZERO\n";break;}
            if(!seen.insert(a).second){cout<<"LOOP\n";break;}
            vector<int>b(n);for(int i=0;i<n;i++)b[i]=abs(a[i]-a[(i+1)%n]);a.swap(b);
        }
    }
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it); a = tuple(next(it) for _ in range(n)); seen = set()
    while True:
        if not any(a): print('ZERO'); break
        if a in seen: print('LOOP'); break
        seen.add(a)
        a = tuple(abs(a[i]-a[(i+1) % n]) for i in range(n))
`,
  }),
  defineCpeLesson("a702", {
    topic: "sorting", level: "easy", concept: "逆序評分與穩定排序", goal: "依字串無序程度排序，同分維持原順序。",
    explanation: [
      "對每條長度n≤50的DNA，直接枚舉i<j，比較s[i]>s[j]時將逆序數加1。字元A<C<G<T的編碼順序符合題意，重複相等字元不構成逆序。這個分數只描述字串，不需要真的排序其內部字元。",
      "以逆序數為唯一排序鍵做穩定排序，就能讓同分字串保持原輸入先後。C++使用stable_sort，Python的sort本身穩定；避免把字串字典序當成第二個鍵。輸入有組數與空白行，分詞讀取會自然忽略空白；兩組輸出之間空一行，組內每條字串一行。",
    ],
    complexity: "m條長n字串，時間 O(mn²+m log m)，空間 O(mn)。",
    pitfall: "同分時必須保留輸入順序，不是再按DNA字典序排列。",
    traceLabel: "示意：輸入 TAAA、ACGT、CAAA",
    trace: [
      { title: "TAAA", description: "T與後面三個A各成逆序，分數3。", cells: ["T", "A", "A", "A"], active: [0], variables: [["逆序", "3"], ["輸入序", "0"]] },
      { title: "另外兩串", description: "ACGT逆序0；CAAA逆序3。", cells: ["TAAA:3", "ACGT:0", "CAAA:3"], active: [1, 2], variables: [["同分", "TAAA與CAAA"]] },
      { title: "穩定排序", description: "ACGT最前，同分的TAAA仍在CAAA前。", cells: ["ACGT", "TAAA", "CAAA"], active: [0, 1, 2], variables: [["分數", "0,3,3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main(){
    int tests;cin>>tests;
    for(int tc=0;tc<tests;tc++){
        int n,m;cin>>n>>m;vector<pair<int,string>> a;
        for(int k=0;k<m;k++){
            string s;cin>>s;int score=0;
            for(int i=0;i<n;i++)for(int j=i+1;j<n;j++)score+=s[i]>s[j];
            a.push_back({score,s});
        }
        stable_sort(a.begin(),a.end(),[](const auto &x,const auto &y){return x.first<y.first;});
        if(tc)cout<<'\n';for(auto &row:a)cout<<row.second<<'\n';
    }
}`,
    python: `import sys
it = iter(sys.stdin.buffer.read().split()); groups = []
for _ in range(int(next(it))):
    n, m = int(next(it)), int(next(it))
    rows = [next(it).decode() for _ in range(m)]
    def inversions(s): return sum(s[i] > s[j] for i in range(n) for j in range(i+1, n))
    rows.sort(key=inversions)
    groups.append('\\n'.join(rows))
print('\\n\\n'.join(groups))
`,
  }),
  defineCpeLesson("a703", {
    topic: "sorting", level: "medium", concept: "帶負數餘數的多層排序鍵", goal: "精確轉譯四層排序規則並保持C語言餘數定義。",
    explanation: [
      "排序鍵第一層是x對M的C式餘數；第二層讓奇數在前；第三層在奇數群用−x作遞增鍵，等價數值遞減，在偶數群用x作遞增鍵。這些鍵按字典序比較即可完全表達題意，也保證比較器一致。",
      "C++的整數%已符合商向0截斷；Python負數%會取非負餘數，所以改成x%M（x≥0）或−((-x)%M)（x<0）。判奇偶可檢查x%2!=0，負奇數同樣成立。C++先存long long避免對最小32位元整數取負溢位。每組先印原N M，遇到0 0也要輸出該終止行後才停止。",
    ],
    complexity: "每組時間 O(N log N)，空間 O(N)。",
    pitfall: "Python原生負數餘數與題目不同；C++用x%2==1會漏掉負奇數。",
    traceLabel: "示意：M=3，數字 −4,−1,2,5",
    trace: [
      { title: "餘數", description: "−4、−1的C式餘數為−1，2、5為2。", cells: ["-4:-1", "-1:-1", "2:2", "5:2"], active: [0, 1, 2, 3], variables: [["餘數群", "-1,2"]] },
      { title: "奇數優先", description: "各群的−1與5都是奇數，排在偶數前。", cells: ["群-1:[-1,-4]", "群2:[5,2]"], active: [0, 1], variables: [["奇數", "-1,5"]] },
      { title: "合併", description: "先小餘數群，答案−1,−4,5,2。", cells: ["-1", "-4", "5", "2"], active: [0, 1, 2, 3], variables: [["輸出數", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <tuple>
#include <algorithm>
using namespace std;
int main(){
    int n,m;
    while(cin>>n>>m){
        cout<<n<<' '<<m<<'\n';if(!n&&!m)break;
        vector<long long>a(n);for(auto &x:a)cin>>x;
        auto key=[&](long long x){bool odd=x%2!=0;return make_tuple(x%m,odd?0:1,odd?-x:x);};
        sort(a.begin(),a.end(),[&](long long x,long long y){return key(x)<key(y);});
        for(auto x:a)cout<<x<<'\n';
    }
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
for n, m in zip(it, it):
    print(n, m)
    if n == m == 0: break
    a = [next(it) for _ in range(n)]
    def key(x):
        remainder = x % m if x >= 0 else -((-x) % m)
        odd = x % 2 != 0
        return remainder, 0 if odd else 1, -x if odd else x
    for x in sorted(a, key=key): print(x)
`,
  }),
  defineCpeLesson("a704", {
    topic: "trees", level: "hard", concept: "預留頂部位置的Fenwick動態排名", goal: "快速查詢電影上方盒數並移到新頂端。",
    explanation: [
      "事先在位置1…m預留未來的頂端，原電影i放在m+i。較小位置代表較上方，Fenwick tree在每個有盒子的位置存1。查詢電影x上方數量就是prefix(pos[x]−1)，無需在陣列中搬移所有盒子。",
      "每次查完，把舊位置加−1，將電影移到目前top（初值m），新位置加1，再把top減1。預留m個位置恰夠m次操作，其他盒子的相對位置不變；每個電影始終只有一個活躍位置。每組重新建立位置表與樹，輸出m個答案於同一行，單一空白分隔且無尾空白。",
    ],
    complexity: "時間 O((n+m)log(n+m))，空間 O(n+m)。",
    pitfall: "回報要在移動之前；連續拿同一部電影的第二次答案是0。",
    traceLabel: "示意：n=3，依序拿3、1、1",
    trace: [
      { title: "拿3", description: "初始1,2,3，3上方2盒；移後3,1,2。", cells: ["3", "1", "2"], active: [0], variables: [["本次答案", "2"], ["pos3", "3"]] },
      { title: "拿1", description: "1上方是3，共1盒；移後1,3,2。", cells: ["1", "3", "2"], active: [0], variables: [["本次答案", "1"], ["pos1", "2"]] },
      { title: "再拿1", description: "1已在頂端，回報0再放到新頂部位置。", cells: ["1", "3", "2"], active: [0], variables: [["本次答案", "0"], ["pos1", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
struct Fenwick{
    vector<int> bit;Fenwick(int n):bit(n+1){}
    void add(int i,int d){for(;i<(int)bit.size();i+=i&-i)bit[i]+=d;}
    int sum(int i){int result=0;for(;i;i-=i&-i)result+=bit[i];return result;}
};
int main(){
    int tests;cin>>tests;
    while(tests--){
        int n,m;cin>>n>>m;Fenwick tree(n+m);vector<int>pos(n+1);
        for(int i=1;i<=n;i++){pos[i]=m+i;tree.add(pos[i],1);}
        int top=m;
        for(int i=0;i<m;i++){
            int x;cin>>x;cout<<(i?" ":"")<<tree.sum(pos[x]-1);
            tree.add(pos[x],-1);pos[x]=top--;tree.add(pos[x],1);
        }
        cout<<'\n';
    }
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n, m = next(it), next(it); bit = [0]*(n+m+1)
    def add(i, value):
        while i < len(bit): bit[i] += value; i += i & -i
    def prefix(i):
        result = 0
        while i: result += bit[i]; i -= i & -i
        return result
    pos = [0]+[m+i for i in range(1, n+1)]
    for i in range(1, n+1): add(pos[i], 1)
    top = m; answers = []
    for _ in range(m):
        x = next(it); answers.append(prefix(pos[x]-1))
        add(pos[x], -1); pos[x] = top; top -= 1; add(pos[x], 1)
    print(*answers)
`,
  }),
  defineCpeLesson("a705", {
    topic: "math", level: "medium", concept: "逐根乘一次因式與多項式格式化", goal: "把根轉成係數，精確處理零項、正負號與單位係數。",
    explanation: [
      "以低次到高次的陣列保存係數，初始多項式為1。乘上(x−r)時，舊係數a[i]分別貢獻到新係數b[i+1]+=a[i]與b[i]−=r·a[i]。用全新陣列累加，再替換舊陣列，就能把所有根（包含重複與0）依序乘入。",
      "輸出由最高次往下，非常數零係數省略，常數即使0也必印。非首項依正負印空白包住的+或−，再印絕對值；非常數項的係數1省略，指數1只印x，高次印x^i。最後接 = 0。使用64位元整數保存係數，Python整數則可自動擴充，禁止浮點展開。輸入讀至EOF。",
    ],
    complexity: "時間 O(N²)，空間 O(N)。",
    pitfall: "根0會使常數項為0，但仍須印 + 0；不可把x的一次方寫成x^1。",
    traceLabel: "示意：根 0,1,−1",
    trace: [
      { title: "乘x", description: "係數低到高為[0,1]。", cells: ["常數0", "x係數1"], active: [0, 1], variables: [["目前", "x"]] },
      { title: "乘x−1", description: "得到x²−x，係數[0,−1,1]。", cells: ["0", "-1", "1"], active: [1, 2], variables: [["次數", "2"]] },
      { title: "乘x+1", description: "得到係數[0,−1,0,1]，印x³−x+0。", cells: ["0", "-1", "0", "1"], active: [0, 1, 3], variables: [["輸出", "x^3 - x + 0 = 0"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <cstdlib>
using namespace std;
int main(){
    int n;
    while(cin>>n){
        vector<long long>a(1,1);
        for(int k=0;k<n;k++){
            long long r;cin>>r;vector<long long>b(a.size()+1);
            for(int i=0;i<(int)a.size();i++){b[i]-=r*a[i];b[i+1]+=a[i];}a.swap(b);
        }
        bool first=true;
        for(int i=n;i>=0;i--){
            long long value=a[i];if(i>0 && value==0)continue;
            if(!first)cout<<(value<0?" - ":" + ");else if(value<0)cout<<'-';
            long long magnitude=llabs(value);
            if(i==0 || magnitude!=1)cout<<magnitude;
            if(i>0){cout<<'x';if(i>1)cout<<'^'<<i;}
            first=false;
        }
        cout<<" = 0\n";
    }
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    a = [1]
    for _ in range(n):
        r = next(it); b = [0]*(len(a)+1)
        for i, value in enumerate(a): b[i] -= r*value; b[i+1] += value
        a = b
    parts = []
    for i in range(n, -1, -1):
        value = a[i]
        if i > 0 and value == 0: continue
        sign = (' - ' if value < 0 else ' + ') if parts else ('-' if value < 0 else '')
        term = str(abs(value)) if i == 0 or abs(value) != 1 else ''
        if i: term += 'x' + (f'^{i}' if i > 1 else '')
        parts.append(sign+term)
    print(''.join(parts)+' = 0')
`,
  }),
  defineCpeLesson("a706", {
    topic: "graphs", level: "easy", concept: "四鄰接連通區塊與雙鍵排名", goal: "每次洪水填色只增加一個國家，再按數量排序語言。",
    explanation: [
      "逐格掃描，遇到尚未走訪的字母ch，就找到一個新國家，該語言計數加1。以堆疊或佇列走訪同字母的上下左右相鄰格，入列時立即標記，將整個連通區都消掉；這能保證同國家不會再被掃描計數。",
      "掃描結束後，依國家數遞減排序，數量相同依字母遞增。不同地區即使字母相同，只要沒有四鄰接路徑就算不同國家；對角相碰不連接。輸出先印World #k，接著每個出現字母的 ch: 數量，不加多餘案例空行。使用迭代走訪避免大地圖遞迴堆疊限制。",
    ],
    complexity: "時間 O(HW+26 log26)，空間 O(HW)。",
    pitfall: "統計的是國家連通塊數，不是字母格數；本題只用四方向。",
    traceLabel: "示意：2×3地圖 aba / aaa",
    trace: [
      { title: "找到a", description: "從左上a出發，沿下排連到右上a。", cells: ["a b a", "a a a"], active: [0, 1], variables: [["a國家", "1"], ["a格數", "5"]] },
      { title: "找到b", description: "頂排中間b是獨立一國。", cells: ["已訪 b 已訪", "已訪 已訪 已訪"], active: [0], variables: [["b國家", "1"]] },
      { title: "排名", description: "兩者國家數均1，a排在b前。", cells: ["a: 1", "b: 1"], active: [0, 1], variables: [["國家總數", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main(){
    int tests;cin>>tests;
    for(int tc=1;tc<=tests;tc++){
        int h,w;cin>>h>>w;vector<string> a(h);for(auto &s:a)cin>>s;int count[26]={};
        int dr[]={-1,1,0,0},dc[]={0,0,-1,1};
        for(int r=0;r<h;r++)for(int c=0;c<w;c++)if(a[r][c]!='#'){
            char ch=a[r][c];count[ch-'a']++;vector<pair<int,int>> stack{{r,c}};a[r][c]='#';
            while(!stack.empty()){
                auto [x,y]=stack.back();stack.pop_back();
                for(int d=0;d<4;d++){int nr=x+dr[d],nc=y+dc[d];if(nr>=0&&nr<h&&nc>=0&&nc<w&&a[nr][nc]==ch){a[nr][nc]='#';stack.push_back({nr,nc});}}
            }
        }
        vector<pair<int,char>> ranking;for(int i=0;i<26;i++)if(count[i])ranking.push_back({-count[i],char('a'+i)});
        sort(ranking.begin(),ranking.end());cout<<"World #"<<tc<<'\n';for(auto [v,ch]:ranking)cout<<ch<<": "<<-v<<'\n';
    }
}`,
    python: `import sys
it = iter(sys.stdin.buffer.read().split())
for tc in range(1, int(next(it))+1):
    h, w = int(next(it)), int(next(it)); a = [list(next(it).decode()) for _ in range(h)]; count = {}
    for r in range(h):
        for c in range(w):
            if a[r][c] == '#': continue
            ch = a[r][c]; count[ch] = count.get(ch, 0)+1
            stack = [(r, c)]; a[r][c] = '#'
            while stack:
                x, y = stack.pop()
                for nr, nc in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                    if 0 <= nr < h and 0 <= nc < w and a[nr][nc] == ch:
                        a[nr][nc] = '#'; stack.append((nr,nc))
    print(f'World #{tc}')
    for ch in sorted(count, key=lambda ch: (-count[ch], ch)): print(f'{ch}: {count[ch]}')
`,
  }),
  defineCpeLesson("a707", {
    topic: "simulation", level: "easy", concept: "日夜順序與固定疲勞量", goal: "以精確整數縮放模擬嚴格成功與失敗條件。",
    explanation: [
      "每天先加上當天攀爬量，若高度嚴格大於H就立即成功；否則才扣夜間滑落D，若高度嚴格小於0就失敗。最後把下一天攀爬量減少初始U·F/100，最低為0。疲勞減量始終固定，不能每天拿目前爬量再乘百分比。",
      "H,U,D,F皆為整數，將高度與爬量放大100倍，則每日疲勞減量恰為U·F，可全程用整數比較，避免剛好井口或井底時浮點誤差。第一天也完整走相同步驟，但疲勞只影響下一天。讀到H=0結束，按結果輸出success或failure on day d，天數從1開始。",
    ],
    complexity: "若經過d天，時間 O(d)，空間 O(1)。",
    pitfall: "到井口高度H不算成功，到0不算失敗；夜間動作不能先於白天成功判斷。",
    traceLabel: "示意：H=6,U=3,D=1,F=10",
    trace: [
      { title: "第1天", description: "白天到3，夜晚到2，翌日爬量2.7。", cells: ["日高3.0", "夜高2.0", "下次2.7"], active: [1], variables: [["day", "1"]] },
      { title: "第2天", description: "2+2.7=4.7，夜晚到3.7。", cells: ["日高4.7", "夜高3.7", "下次2.4"], active: [1], variables: [["day", "2"]] },
      { title: "第3天", description: "3.7+2.4=6.1>6，白天立即成功。", cells: ["日高6.1", "井深6.0"], active: [0], variables: [["成功日", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <algorithm>
using namespace std;
int main(){
    long long h,u,d,f;
    while(cin>>h>>u>>d>>f && h){
        long long height=0,climb=u*100,fatigue=u*f;int day=0;
        while(true){
            ++day;height+=climb;
            if(height>h*100){cout<<"success on day "<<day<<'\n';break;}
            height-=d*100;
            if(height<0){cout<<"failure on day "<<day<<'\n';break;}
            climb=max(0LL,climb-fatigue);
        }
    }
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
for h, u, d, f in zip(it, it, it, it):
    if h == 0: break
    height = day = 0; climb = u*100; fatigue = u*f
    while True:
        day += 1; height += climb
        if height > h*100: print(f'success on day {day}'); break
        height -= d*100
        if height < 0: print(f'failure on day {day}'); break
        climb = max(0, climb-fatigue)
`,
  }),
  defineCpeLesson("a708", {
    topic: "number-theory", level: "medium", concept: "kuti遞迴分組與固定寬度編號", goal: "將最大十五位整數分層展開為孟加拉單位。",
    explanation: [
      "若n≥10⁷，先遞迴展開n//10⁷，接單位kuti，再處理n%10⁷。這讓高於一個kuti的數仍用相同單位系統描述，也自然處理連續的kuti，例如10¹⁴是1 kuti kuti。即使後面的餘數為0，也不能刪掉已產生的kuti。",
      "剩餘不足10⁷時，依lakh=10⁵、hajar=10³、shata=100做整除與取餘，只輸出非零商；最後不足100的非零餘數直接輸出。整筆0另輸出0，不讓遞迴產生空答案。用token清單組合單一空白，編號寬度4靠右、接句點與空白，讀到EOF。C++用long long承接十五位整數。",
    ],
    complexity: "時間與遞迴深度 O(log₁₀⁷ n)，文字空間與輸出長度成正比。",
    pitfall: "0單位應省略，但表示高階分組的kuti仍需出現；案例編號前導空白是必要格式。",
    traceLabel: "示意：10000101",
    trace: [
      { title: "kuti分組", description: "10000101=1·10000000+101。", cells: ["商1", "kuti", "餘101"], active: [0, 1], variables: [["已輸出", "1 kuti"]] },
      { title: "shata分組", description: "101=1·100+1。", cells: ["1 kuti", "1 shata", "餘1"], active: [1], variables: [["已輸出", "1 kuti 1 shata"]] },
      { title: "個位餘數", description: "最後接1，沒有零的lakh或hajar。", cells: ["1", "kuti", "1", "shata", "1"], active: [4], variables: [["結果", "1 kuti 1 shata 1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <iomanip>
#include <vector>
#include <string>
using namespace std;
void words(long long n,vector<string>& out){
    if(n>=10000000){words(n/10000000,out);out.push_back("kuti");n%=10000000;}
    long long value[]={100000,1000,100};string name[]={"lakh","hajar","shata"};
    for(int i=0;i<3;i++)if(n>=value[i]){out.push_back(to_string(n/value[i]));out.push_back(name[i]);n%=value[i];}
    if(n)out.push_back(to_string(n));
}
int main(){
    long long n;int tc=0;
    while(cin>>n){
        vector<string> out;if(n==0)out.push_back("0");else words(n,out);
        cout<<setw(4)<<++tc<<'.';for(auto &s:out)cout<<' '<<s;cout<<'\n';
    }
}`,
    python: `import sys
def words(n):
    out = []
    if n >= 10000000:
        out += words(n//10000000)+['kuti']; n %= 10000000
    for value, name in ((100000, 'lakh'), (1000, 'hajar'), (100, 'shata')):
        if n >= value:
            out += [str(n//value), name]; n %= value
    if n: out.append(str(n))
    return out
for tc, n in enumerate(map(int, sys.stdin.buffer.read().split()), 1):
    result = ' '.join(words(n)) if n else '0'
    print(f'{tc:4d}. {result}')
`,
  }),
  defineCpeLesson("a709", {
    topic: "strings", level: "easy", concept: "一對一替換保存字母頻率多重集合", goal: "比較排序後的26個頻率，判定是否存在合法加密。",
    explanation: [
      "字元位置可以任意重排，所以位置資訊完全無關，只留下各字母出現次數。一對一替換又只能重新命名字母，不能把兩個不同字母合併，因此替換前後的頻率多重集合必須相同。例如頻率[2,2]可以互相映射，卻不能變成[1,1,1,1]。",
      "分別計數A至Z的26格，排序後比較即可。若相同，可把頻率相等的字母一一配對，剩下沒出現的字母也可配對，得到合法雙射；最後再重排位置即可構造密文，所以條件也充分。輸入每兩行一組直到EOF，輸出YES或NO，不要求輸出映射。",
    ],
    complexity: "長度L，時間 O(L+26 log26)，空間 O(26)。",
    pitfall: "不同字母不能替換成同一字母；只比較不同字母種類數也不足。",
    traceLabel: "示意：密文HAHA、原文HEHE",
    trace: [
      { title: "密文統計", description: "H與A都出現2次。", cells: ["H:2", "A:2"], active: [0, 1], variables: [["非零頻率", "2,2"]] },
      { title: "原文統計", description: "H與E也都出現2次。", cells: ["H:2", "E:2"], active: [0, 1], variables: [["非零頻率", "2,2"]] },
      { title: "配對", description: "H→H、E→A就得到HAHA，故YES。", cells: ["H→H:2", "E→A:2", "YES"], active: [2], variables: [["匹配頻率數", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <array>
#include <algorithm>
using namespace std;
int main(){
    string a,b;
    while(cin>>a>>b){
        array<int,26>x{},y{};for(char c:a)x[c-'A']++;for(char c:b)y[c-'A']++;
        sort(x.begin(),x.end());sort(y.begin(),y.end());cout<<(x==y?"YES":"NO")<<'\n';
    }
}`,
    python: `import sys
from collections import Counter
it = iter(sys.stdin.buffer.read().split())
for a, b in zip(it, it):
    print('YES' if sorted(Counter(a).values()) == sorted(Counter(b).values()) else 'NO')
`,
  }),
  defineCpeLesson("a710", {
    topic: "basics", level: "easy", concept: "翻轉一位元只改變一列與一欄奇偶", goal: "由奇數列與奇數欄的數量直接判定可修復性。",
    explanation: [
      "讀每個位元時，分別對該列與該欄做XOR，得到總和模2。全部為0就已符合parity property，輸出OK。翻轉(i,j)會讓第i列與第j欄的奇偶各切換一次，其他列欄不變。",
      "所以若恰有一個奇數列和一個奇數欄，只需翻它們交點便能全部修正；若奇數列或欄數不是此情況，就無法靠一格修好，輸出Corrupt。輸出交點使用1起算的列欄編號，格式Change bit (i,j)中逗號後沒有空白。n=0結束。",
    ],
    complexity: "時間 O(n²)，額外空間 O(n)。",
    pitfall: "不要輸出0起算座標；兩個奇數列即使只出現一個奇數欄，也不可能單點修正。",
    traceLabel: "示意：2×2矩陣 1 0 / 0 0",
    trace: [
      { title: "列奇偶", description: "列1和1為奇，列2和0為偶。", cells: ["列1:1", "列2:0"], active: [0], variables: [["奇數列數", "1"]] },
      { title: "欄奇偶", description: "欄1和1為奇，欄2和0為偶。", cells: ["欄1:1", "欄2:0"], active: [0], variables: [["奇數欄數", "1"]] },
      { title: "交點翻轉", description: "翻轉(1,1)後全為0，所有列欄皆偶。", cells: ["0 0", "0 0"], active: [0], variables: [["輸出", "Change bit (1,1)"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){
    int n;
    while(cin>>n && n){
        vector<int> rows(n),cols(n),oddRows,oddCols;
        for(int i=0;i<n;i++)for(int j=0;j<n;j++){int x;cin>>x;rows[i]^=x;cols[j]^=x;}
        for(int i=0;i<n;i++){if(rows[i])oddRows.push_back(i+1);if(cols[i])oddCols.push_back(i+1);}
        if(oddRows.empty()&&oddCols.empty())cout<<"OK\n";
        else if(oddRows.size()==1&&oddCols.size()==1)cout<<"Change bit ("<<oddRows[0]<<','<<oddCols[0]<<")\n";
        else cout<<"Corrupt\n";
    }
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
for n in it:
    if n == 0: break
    rows = [0]*n; cols = [0]*n
    for i in range(n):
        for j in range(n):
            x = next(it); rows[i] ^= x; cols[j] ^= x
    r = [i+1 for i in range(n) if rows[i]]; c = [j+1 for j in range(n) if cols[j]]
    if not r and not c: print('OK')
    elif len(r) == len(c) == 1: print(f'Change bit ({r[0]},{c[0]})')
    else: print('Corrupt')
`,
  }),
  defineCpeLesson("a711", {
    topic: "simulation", level: "easy", concept: "週期日聯集與假日排除", goal: "用布林日曆避免同日罷工重複計數。",
    explanation: [
      "對每個政黨週期h，標記h、2h、3h…直到N。日曆陣列只記當天是否至少有一黨罷工，所以多個政黨落在同一天仍只有一個標記。可在標記時或最後計數時排除假日。",
      "第1天是星期日，因此day%7=6代表星期五，day%7=0代表星期六，這兩種日子不計。將1至N中已標記且不是假日的天數加總即可。各筆重新建立日曆，依T讀取N、P與P個週期，每筆只輸出工作日損失數。",
    ],
    complexity: "時間 O(N+Σ floor(N/hᵢ))，空間 O(N)。",
    pitfall: "星期日是第1天而非第0天；同一天多黨罷工不能重複加總。",
    traceLabel: "示意：N=14，週期3、4、8",
    trace: [
      { title: "週期3", description: "標3、6、9、12；第6天假日不計。", cells: ["3", "6:假日", "9", "12"], active: [0, 2, 3], variables: [["有效", "3天"]] },
      { title: "週期4", description: "加入4、8、12，其中12已標過。", cells: ["3", "4", "8", "9", "12"], active: [1, 2], variables: [["有效聯集", "5天"]] },
      { title: "週期8", description: "8已標過，不增加，答案5。", cells: ["3", "4", "8", "9", "12"], active: [2], variables: [["答案", "5"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){
    int tests;cin>>tests;
    while(tests--){
        int n,p;cin>>n>>p;vector<bool> strike(n+1);
        while(p--){int h;cin>>h;for(int day=h;day<=n;day+=h)strike[day]=true;}
        int answer=0;for(int day=1;day<=n;day++)if(day%7!=6 && day%7!=0 && strike[day])answer++;
        cout<<answer<<'\n';
    }
}`,
    python: `import sys
it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n, p = next(it), next(it); strike = bytearray(n+1)
    for _ in range(p):
        h = next(it)
        for day in range(h, n+1, h): strike[day] = 1
    print(sum(strike[day] for day in range(1, n+1) if day % 7 not in (0, 6)))
`,
  }),
  defineCpeLesson("a712", {
    topic: "simulation", level: "hard", concept: "週期最小值分組與完整週期停止證明", goal: "正確辨認永不再吃牛的時刻，同時避免逐日掃描所有牛。",
    explanation: [
      "所有週期Ti≤10，整體產量序列在L=lcm(Ti)≤2520天後重複。只要連續L天沒有吃牛，存活集合未變且所有相位都看過，未來也永遠不會再吃；每吃一頭就把連續無事件天數歸0。不能只模擬總共2520天，因為中途刪牛會改變之後的最小值與平手情況。",
      "為每種週期t、相位p、產量v維護存活牛數與牛編號XOR，並維護該相位的最小非空v。每天只需查至多10種週期在day%t的最小值，合併全域最小值的牛數；恰一頭時用XOR取回編號。刪牛時只更新牠所屬週期的至多10個相位，空桶使最小指標向上移。日序從0計算相位，輸出日期要加1；從未刪除時最後日期為0。",
    ],
    complexity: "G≤10種週期、L≤2520，最多 O((N+1)LG+251Σt+Σ被刪牛Ti) 時間，空間 O(251Σt+ΣTi)。",
    pitfall: "最少產量平手時一頭都不吃；某天沒有事件不足以停止，必須完整走過無刪除的聯合週期。",
    traceLabel: "示意：牛1週期[1,3]，牛2、3皆週期[2]",
    trace: [
      { title: "第1天", description: "產量1,2,2，唯一最少是牛1，吃掉牠。", cells: ["牛1:1", "牛2:2", "牛3:2"], active: [0], variables: [["存活", "2"], ["最後日期", "1"]] },
      { title: "第2天", description: "只剩牛2、3，都是2，平手不吃。", cells: ["牛2:2", "牛3:2"], active: [0, 1], variables: [["無事件連續天數", "1"], ["L", "2"]] },
      { title: "第3天", description: "又平手，已經完整兩天無事件，永遠留下2頭。", cells: ["牛2:2", "牛3:2"], active: [0, 1], variables: [["無事件連續天數", "2"], ["輸出", "2 1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <numeric>
using namespace std;
struct Phase {vector<int> count,ids;int low;Phase():count(251),ids(251),low(251){}};
int main(){
    int tests;cin>>tests;
    while(tests--){
        int n;cin>>n;vector<vector<int>> cows(n+1);vector<vector<Phase>> group(11);
        for(int t=1;t<=10;t++)group[t].resize(t);
        vector<int> periods;bool exists[11]={};int cycle=1;
        for(int id=1;id<=n;id++){
            int t;cin>>t;cows[id].resize(t);exists[t]=true;cycle=lcm(cycle,t);
            for(int p=0;p<t;p++){int v;cin>>v;cows[id][p]=v;auto &b=group[t][p];b.count[v]++;b.ids[v]^=id;if(v<b.low)b.low=v;}
        }
        for(int t=1;t<=10;t++)if(exists[t])periods.push_back(t);
        int alive=n,last=0,quiet=0,day=0;
        while(alive && quiet<cycle){
            int minimum=251,count=0,id=0;
            for(int t:periods){
                auto &b=group[t][day%t];int v=b.low;if(v==251)continue;
                if(v<minimum){minimum=v;count=b.count[v];id=b.ids[v];}
                else if(v==minimum){count+=b.count[v];id^=b.ids[v];}
            }
            if(count==1){
                alive--;last=day+1;quiet=0;int t=cows[id].size();
                for(int p=0;p<t;p++){
                    int v=cows[id][p];auto &b=group[t][p];b.count[v]--;b.ids[v]^=id;
                    while(b.low<251 && b.count[b.low]==0)b.low++;
                }
            }else quiet++;
            day++;
        }
        cout<<alive<<' '<<last<<'\n';
    }
}`,
    python: `import sys
from math import lcm
it = iter(map(int, sys.stdin.buffer.read().split()))
for _ in range(next(it)):
    n = next(it); cows = [None]; groups = {}; cycle = 1
    for identifier in range(1, n+1):
        t = next(it); values = [next(it) for _ in range(t)]; cows.append(values)
        cycle = lcm(cycle, t)
        if t not in groups: groups[t] = [[[0]*251, [0]*251, 251] for _ in range(t)]
        for phase, v in enumerate(values):
            bucket = groups[t][phase]; bucket[0][v] += 1; bucket[1][v] ^= identifier
            bucket[2] = min(bucket[2], v)
    alive = n; last = quiet = day = 0
    while alive and quiet < cycle:
        minimum = 251; count = identifier = 0
        for t, phases in groups.items():
            counts, ids, low = phases[day % t]
            if low == 251: continue
            if low < minimum: minimum = low; count = counts[low]; identifier = ids[low]
            elif low == minimum: count += counts[low]; identifier ^= ids[low]
        if count == 1:
            alive -= 1; last = day+1; quiet = 0
            values = cows[identifier]; t = len(values)
            for phase, v in enumerate(values):
                bucket = groups[t][phase]; bucket[0][v] -= 1; bucket[1][v] ^= identifier
                while bucket[2] < 251 and bucket[0][bucket[2]] == 0: bucket[2] += 1
        else: quiet += 1
        day += 1
    print(alive, last)
`,
  }),
  defineCpeLesson("a713", {
    topic: "graphs", level: "medium", concept: "三維六方向BFS最短路", goal: "用層、列、欄座標找出每分鐘一步的最短逃脫時間。",
    explanation: [
      "每個可走格子是一個頂點，與上、下、前、後、左、右六格連邊，邊權都為1。由S開始BFS，距離設0；取出某格時將尚未拜訪的合法鄰格設成距離加1並入列。BFS按距離逐層處理，所以第一次到達E就是最少分鐘數。",
      "用三維距離陣列的−1表示未走訪，入列立刻改值避免重複。檢查三個維度邊界後才讀格子，#不可走，S與E都可走。分詞讀入各地圖行可忽略層間空白行，讀到0 0 0停止。可達輸出Escaped in x minute(s).，否則Trapped!。",
    ],
    complexity: "時間、空間 O(LRC)。",
    pitfall: "不能只在同一層找路，也不能沿三維對角線移動；遞迴DFS不保證第一次找到最短路。",
    traceLabel: "示意：兩層各1×2，上層S.，下層#E",
    trace: [
      { title: "起點", description: "S=(0,0,0)，距離0，下方是牆。", cells: ["(0,0,0):0", "(0,0,1):-1", "(1,0,1):-1"], active: [0], variables: [["queue長度", "1"]] },
      { title: "向右", description: "到(0,0,1)，距離1。", cells: ["S:0", "右格:1", "E:-1"], active: [1], variables: [["距離", "1"]] },
      { title: "向下", description: "從右格下樓到E，總共2分鐘。", cells: ["S:0", "右格:1", "E:2"], active: [2], variables: [["答案", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <array>
using namespace std;
int main(){
    int l,r,c;
    while(cin>>l>>r>>c && (l||r||c)){
        vector<vector<string>> a(l,vector<string>(r));array<int,3> start{},end{};
        for(int z=0;z<l;z++)for(int x=0;x<r;x++){cin>>a[z][x];for(int y=0;y<c;y++){if(a[z][x][y]=='S')start={z,x,y};if(a[z][x][y]=='E')end={z,x,y};}}
        vector<vector<vector<int>>> dist(l,vector<vector<int>>(r,vector<int>(c,-1)));
        queue<array<int,3>> q;q.push(start);dist[start[0]][start[1]][start[2]]=0;
        int dz[]={-1,1,0,0,0,0},dx[]={0,0,-1,1,0,0},dy[]={0,0,0,0,-1,1};
        while(!q.empty()){
            auto u=q.front();q.pop();
            for(int d=0;d<6;d++){
                int z=u[0]+dz[d],x=u[1]+dx[d],y=u[2]+dy[d];
                if(z<0||z>=l||x<0||x>=r||y<0||y>=c||a[z][x][y]=='#'||dist[z][x][y]>=0)continue;
                dist[z][x][y]=dist[u[0]][u[1]][u[2]]+1;q.push({z,x,y});
            }
        }
        int answer=dist[end[0]][end[1]][end[2]];
        if(answer<0)cout<<"Trapped!\n";else cout<<"Escaped in "<<answer<<" minute(s).\n";
    }
}`,
    python: `import sys
from collections import deque
it = iter(sys.stdin.buffer.read().split())
for token in it:
    levels, rows, cols = int(token), int(next(it)), int(next(it))
    if levels == rows == cols == 0: break
    a = [[next(it).decode() for _ in range(rows)] for _ in range(levels)]
    for z in range(levels):
        for x in range(rows):
            for y in range(cols):
                if a[z][x][y] == 'S': start = (z,x,y)
                if a[z][x][y] == 'E': end = (z,x,y)
    distance = {start: 0}; q = deque([start])
    while q:
        z, x, y = q.popleft()
        for dz, dx, dy in ((1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)):
            nz, nx, ny = z+dz, x+dx, y+dy; v = (nz,nx,ny)
            if 0 <= nz < levels and 0 <= nx < rows and 0 <= ny < cols and a[nz][nx][ny] != '#' and v not in distance:
                distance[v] = distance[(z,x,y)]+1; q.append(v)
    print(f'Escaped in {distance[end]} minute(s).' if end in distance else 'Trapped!')
`,
  }),
  defineCpeLesson("a714", {
    topic: "search", level: "medium", concept: "正質數序列的滑動視窗", goal: "利用總和隨右端增加、左端移除而單調變化的性質計數。",
    explanation: [
      "先篩出不超過10000的遞增質數。對一個目標n，維護連續質數區間[left,right]的總和sum。右端每加入下一個質數就增加sum；若sum>n，持續移除左端直到sum≤n。所有質數都是正數，所以移除後總和嚴格下降，不會跳過可能解。",
      "每個右端在收縮完成後，若sum=n就增加1。對固定右端最多只有一個左端能達n，因此可完整且不重複地計數，也自然包含只有一個質數的解。質數超過n便可停止該查詢。輸入0結束，每筆輸出方式數；不可略過中間質數或重複使用同一質數。",
    ],
    complexity: "篩表 O(U log log U)，每筆 O(π(n))，空間 O(U)。",
    pitfall: "是質數表中的連續區段，不是一般零錢組合數；53自身也要計入。",
    traceLabel: "示意：n=5，質數序列2,3,5",
    trace: [
      { title: "加入2", description: "目前總和2，尚未達5。", cells: ["2", "3", "5"], active: [0], variables: [["sum", "2"], ["答案", "0"]] },
      { title: "加入3", description: "2+3=5，找到第一種。", cells: ["2", "3", "5"], active: [0, 1], variables: [["sum", "5"], ["答案", "1"]] },
      { title: "加入5並收縮", description: "總和10，移除2、3後剩5，找到第二種。", cells: ["2:移除", "3:移除", "5"], active: [2], variables: [["sum", "5"], ["答案", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;
int main(){
    const int limit=10000;vector<bool> prime(limit+1,true);prime[0]=prime[1]=false;
    for(int p=2;p*p<=limit;p++)if(prime[p])for(int x=p*p;x<=limit;x+=p)prime[x]=false;
    vector<int> primes;for(int p=2;p<=limit;p++)if(prime[p])primes.push_back(p);
    int n;
    while(cin>>n && n){
        int left=0,sum=0,answer=0;
        for(int right=0;right<(int)primes.size()&&primes[right]<=n;right++){
            sum+=primes[right];while(sum>n)sum-=primes[left++];if(sum==n)answer++;
        }
        cout<<answer<<'\n';
    }
}`,
    python: `import sys
limit = 10000; prime = bytearray(b'\\x01')*(limit+1); prime[:2] = b'\\x00\\x00'
for p in range(2, 101):
    if prime[p]: prime[p*p::p] = b'\\x00'*((limit-p*p)//p+1)
primes = [p for p in range(2, limit+1) if prime[p]]
for n in map(int, sys.stdin.buffer.read().split()):
    if n == 0: break
    left = total = answer = 0
    for p in primes:
        if p > n: break
        total += p
        while total > n: total -= primes[left]; left += 1
        if total == n: answer += 1
    print(answer)
`,
  }),
  defineCpeLesson("a715", {
    topic: "graphs", level: "easy", concept: "八鄰接洪水填色的油田計數", goal: "將斜向連通也納入走訪，讓每個油田只被計一次。",
    explanation: [
      "逐格掃描地圖，找到@即表示遇到一個尚未計數的油田，答案加1，再用堆疊走遍所有與它八方向相連的@。每個發現的格子立即改成*，如此其他分支或之後掃描便不會重複加入。",
      "方向可枚舉dr,dc各為−1、0、1並跳過(0,0)。先確認新列欄合法，才判斷是否為@。斜接也是連通，這與只允許四鄰接的語言國家題不同。m=0即結束，不要求n同時為0；每張地圖輸出一行油田數，完全沒有@時是0。",
    ],
    complexity: "時間、空間 O(mn)。",
    pitfall: "若只檢查上下左右，對角線的同一油田會被拆成多個。",
    traceLabel: "示意：3×3地圖 @** / *@* / **@",
    trace: [
      { title: "第一格", description: "左上@開始新油田，計數1。", cells: ["@**", "*@*", "**@"], active: [0], variables: [["油田數", "1"]] },
      { title: "對角擴張", description: "左上可斜向到中央，中央仍屬同一油田。", cells: ["***", "*@*", "**@"], active: [1], variables: [["已發現格數", "2"]] },
      { title: "再到右下", description: "中央再斜向連到右下，三格共一個油田。", cells: ["***", "***", "***"], active: [2], variables: [["走訪格數", "3"], ["答案", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main(){
    int m,n;
    while(cin>>m>>n && m){
        vector<string>a(m);for(auto &s:a)cin>>s;int answer=0;
        for(int r=0;r<m;r++)for(int c=0;c<n;c++)if(a[r][c]=='@'){
            ++answer;vector<pair<int,int>> stack{{r,c}};a[r][c]='*';
            while(!stack.empty()){
                auto [x,y]=stack.back();stack.pop_back();
                for(int dr=-1;dr<=1;dr++)for(int dc=-1;dc<=1;dc++)if(dr||dc){
                    int nr=x+dr,nc=y+dc;
                    if(nr>=0&&nr<m&&nc>=0&&nc<n&&a[nr][nc]=='@'){a[nr][nc]='*';stack.push_back({nr,nc});}
                }
            }
        }
        cout<<answer<<'\n';
    }
}`,
    python: `import sys
it = iter(sys.stdin.buffer.read().split())
for token in it:
    m, n = int(token), int(next(it))
    if m == 0: break
    a = [bytearray(next(it)) for _ in range(m)]; answer = 0
    for r in range(m):
        for c in range(n):
            if a[r][c] != 64: continue
            answer += 1; stack = [(r,c)]; a[r][c] = 42
            while stack:
                x, y = stack.pop()
                for dr in (-1,0,1):
                    for dc in (-1,0,1):
                        nr, nc = x+dr, y+dc
                        if (dr or dc) and 0 <= nr < m and 0 <= nc < n and a[nr][nc] == 64:
                            a[nr][nc] = 42; stack.append((nr,nc))
    print(answer)
`,
  }),
];
