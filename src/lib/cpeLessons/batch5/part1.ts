import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a716", {
    topic: "strings", level: "easy", concept: "多重集合交集與字典序", goal: "以每個字母可共用的次數建構最長答案。",
    explanation: ["這裡允許兩邊採用不同排列，因此不用求最長共同子序列。字母 c 若在兩行分別出現 A[c]、B[c] 次，答案至多使用 min(A[c],B[c]) 次；各字母互不干涉，全部取滿便達到最長長度。", "將字母依 a 到 z 輸出，各重複共同次數，就得到這個多重集合中字典序最小的排列。用逐行輸入保留空字串，每兩行為一組直到 EOF；即使交集為空也必須輸出一個空行。"],
    complexity: "時間 O(|a|+|b|+26)，額外空間 O(26)，另計輸出。", pitfall: "不能用集合去掉重複字母，也不能跳過輸入空行。",
    traceLabel: "示意：a=abbc，b=bccd", trace: [
      { title: "統計 a", description: "a、b、c 的次數為 1、2、1。", cells: ["a:1", "b:2", "c:1", "d:0"], active: [0,1,2], variables: [["長度", "4"]] },
      { title: "逐字取小", description: "b 只能共用一次，c 也只能共用一次。", cells: ["min(1,0)=0", "min(2,1)=1", "min(1,2)=1", "min(0,1)=0"], active: [1,2], variables: [["答案長度", "2"]] },
      { title: "有序輸出", description: "先 b 再 c，答案是 bc。", cells: ["b", "c"], active: [0,1], variables: [["輸出", "bc"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    string a,b;
    while (getline(cin,a) && getline(cin,b)) {
        int x[26]={},y[26]={};
        for(char c:a) if(c>='a'&&c<='z') ++x[c-'a'];
        for(char c:b) if(c>='a'&&c<='z') ++y[c-'a'];
        for(int i=0;i<26;++i) cout<<string(min(x[i],y[i]),char('a'+i));
        cout<<'\n';
    }
}`,
    python: String.raw`import sys
from collections import Counter
lines = sys.stdin.read().splitlines()
for i in range(0, len(lines)-1, 2):
    a, b = Counter(lines[i]), Counter(lines[i+1])
    print(''.join(c * min(a[c], b[c]) for c in 'abcdefghijklmnopqrstuvwxyz'))`,
  }),
  defineCpeLesson("a717", {
    topic: "trees", level: "hard", concept: "雙堆維護逐次增加的排名", goal: "讓最大堆始終保存已需要的最小幾個元素。",
    explanation: ["第 p 次 GET 要求目前前綴的第 p 小。使用最大堆 low 保存最小的 p−1 個數，最小堆 high 保存其餘數，維持 low 中所有數都不大於 high。加入新數時先與 low 的堆頂比較，必要時把 low 最大者移到 high，保持 low 大小不變。", "讀到查詢指定的加入數量後，把 high 最小者移入 low；此時 low 恰有 p 個元素，堆頂就是答案。查詢 u 可以重複，但排名仍會增加。重複數值各自入堆，不能去重。第一個數是測試組數，空白行可由 token 輸入略過，組間輸出一空行。"],
    complexity: "每組時間 O((M+N) log M)，空間 O(M)。", pitfall: "GET 次數決定排名，u 決定資料前綴，兩者不可混為一談。",
    traceLabel: "示意：加入 3,1,−4；u=1,3", trace: [
      { title: "第一次查詢", description: "加入 3，取 high 最小者。", cells: ["low=[3]", "high=[]"], active: [0], variables: [["p", "1"], ["答案", "3"]] },
      { title: "加入剩餘數", description: "維持 low 大小為 1，最小數 −4 留在 low。", cells: ["low=[−4]", "high=[1,3]"], active: [0,1], variables: [["已加入", "3"]] },
      { title: "第二次查詢", description: "將 1 移到 low，其最大者為第 2 小。", cells: ["low=[−4,1]", "high=[3]"], active: [0], variables: [["p", "2"], ["答案", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <queue>
#include <functional>
using namespace std;
int main(){
    int t; cin>>t;
    for(int cs=0;cs<t;++cs){
        int m,n;cin>>m>>n;vector<int>a(m),u(n);
        for(int &x:a)cin>>x;for(int &x:u)cin>>x;
        priority_queue<int> low;
        priority_queue<int,vector<int>,greater<int>> high;
        int at=0;if(cs)cout<<'\n';
        for(int end:u){
            while(at<end){
                int x=a[at++];
                if(!low.empty() && x<low.top()){
                    high.push(low.top());low.pop();low.push(x);
                }else high.push(x);
            }
            low.push(high.top());high.pop();cout<<low.top()<<'\n';
        }
    }
}`,
    python: String.raw`import sys, heapq
it = iter(map(int, sys.stdin.buffer.read().split()))
groups = []
for _ in range(next(it)):
    m, n = next(it), next(it)
    a = [next(it) for _ in range(m)]
    u = [next(it) for _ in range(n)]
    low, high, at, out = [], [], 0, []
    for end in u:
        while at < end:
            x = a[at]; at += 1
            if low and x < -low[0]:
                heapq.heappush(high, -heapq.heapreplace(low, -x))
            else:
                heapq.heappush(high, x)
        heapq.heappush(low, -heapq.heappop(high))
        out.append(str(-low[0]))
    groups.append('\n'.join(out))
print('\n\n'.join(groups))`,
  }),
  defineCpeLesson("a718", {
    topic: "strings", level: "medium", concept: "一次式解析與有號向下整除", goal: "把每側歸納成 Ax+B，再分類求解。",
    explanation: ["以項為單位掃描，每項先讀連接符號，再讀可省略的數字，最後判斷是否接 x。含 x 的項加入係數 A，其餘加入常數 B；單獨 x 的係數是 1，而 0x 的係數確實是 0。左右各得到一對係數。", "移項後有 (AL−AR)x=BR−BL。係數為零時，常數也為零輸出 IDENTITY，否則 IMPOSSIBLE。唯一解需向下取整；Python // 已符合，C++ 除法朝零截斷，餘數非零且分子分母異號時還要減 1。依開頭 t 讀取方程式，每題一行。"],
    complexity: "每題時間 O(L)，額外空間 O(1)，L 為方程式長度。", pitfall: "負解不能直接用 C++ 整數除法；數字未出現與數字為 0 必須區分。",
    traceLabel: "示意：2x+3=0", trace: [
      { title: "解析左側", description: "2x 加入係數，3 加入常數。", cells: ["2x", "+3"], active: [0,1], variables: [["AL", "2"], ["BL", "3"]] },
      { title: "移項", description: "右側是 0，得到 2x=−3。", cells: ["2x", "=", "−3"], active: [0,2], variables: [["A", "2"], ["B", "−3"]] },
      { title: "向下取整", description: "−3/2=−1.5，不大於它的最大整數是 −2。", cells: ["−2", "−1.5", "−1"], active: [0], variables: [["floor", "−2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <utility>
#include <cctype>
using namespace std;
pair<long long,long long> parse(const string&s){
    long long a=0,b=0;size_t i=0;
    while(i<s.size()){
        int sign=1;if(s[i]=='+'||s[i]=='-')sign=s[i++]=='-'?-1:1;
        long long v=0;bool has=false;
        while(i<s.size()&&isdigit(s[i])){has=true;v=v*10+s[i++]-'0';}
        if(i<s.size()&&s[i]=='x'){++i;a+=sign*(has?v:1);}
        else b+=sign*v;
    }return {a,b};
}
int main(){int t;cin>>t;while(t--){
    string s;cin>>s;auto pos=s.find('=');
    auto l=parse(s.substr(0,pos)),r=parse(s.substr(pos+1));
    long long a=l.first-r.first,b=r.second-l.second;
    if(!a)cout<<(b?"IMPOSSIBLE":"IDENTITY")<<'\n';
    else{long long q=b/a;if(b%a && ((b<0)!=(a<0)))--q;cout<<q<<'\n';}
}}`,
    python: String.raw`import sys, re
def parse(s):
    a = b = 0
    for match in re.finditer(r'([+-]?)(\d*x|\d+)', s):
        sign = -1 if match[1] == '-' else 1
        term = match[2]
        if term.endswith('x'):
            a += sign * int(term[:-1] or '1')
        else:
            b += sign * int(term)
    return a, b
lines = sys.stdin.read().split()
for s in lines[1:1+int(lines[0])]:
    l, r = map(parse, s.split('='))
    a, b = l[0]-r[0], r[1]-l[1]
    print(b//a if a else ('IMPOSSIBLE' if b else 'IDENTITY'))`,
  }),
  defineCpeLesson("a719", {
    topic: "strings", level: "easy", concept: "鍵盤列的位置映射", goal: "建立向左兩格的查表轉換並保留空白。",
    explanation: ["鍵盤位置並非字母順序，應直接列出四列按鍵。對每列索引 i≥2 的字元，記錄它解碼為索引 i−2 的字元，避免在不同列之間錯誤跨越。", "把輸入英文字母先轉成小寫，再逐字查表，空白原樣保留。列首兩個按鍵沒有左邊兩格，若遇到未建立映射的字元便原樣保留；合法編碼應只使用可解碼位置。讀入整段訊息，輸出解碼行。"],
    complexity: "時間 O(L)，固定大小查表空間 O(1)。", pitfall: "不能用 ASCII 減 2，且大寫 I 必須先轉小寫才查表。",
    traceLabel: "示意：k[r → how", trace: [
      { title: "解 k", description: "asdfghjkl 列中 k 的左兩格是 h。", cells: ["h", "j", "k"], active: [0,2], variables: [["輸出長度", "1"], ["文字", "h"]] },
      { title: "解 [", description: "qwertyuiop[] 列中 [ 的左兩格是 o。", cells: ["o", "p", "["], active: [0,2], variables: [["輸出長度", "2"], ["文字", "ho"]] },
      { title: "解 r", description: "r 的左兩格是 w。", cells: ["w", "e", "r"], active: [0,2], variables: [["輸出長度", "3"], ["文字", "how"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <cctype>
using namespace std;
int main(){
    string rows[]={"\x60" "1234567890-=","qwertyuiop[]\\","asdfghjkl;'","zxcvbnm,./"};
    char table[256];for(int i=0;i<256;++i)table[i]=char(i);
    for(auto &r:rows)for(size_t i=2;i<r.size();++i)table[(unsigned char)r[i]]=r[i-2];
    string s;while(getline(cin,s)){
        if(!s.empty()&&s.back()=='\r')s.pop_back();
        for(unsigned char c:s)cout<<table[tolower(c)];cout<<'\n';
    }
}`,
    python: String.raw`import sys
rows = [chr(96)+'1234567890-=', 'qwertyuiop[]'+chr(92), "asdfghjkl;'", 'zxcvbnm,./']
table = {row[i]: row[i-2] for row in rows for i in range(2, len(row))}
for line in sys.stdin.read().splitlines():
    print(''.join(table.get(c, c) for c in line.lower()))`,
  }),
  defineCpeLesson("a720", {
    topic: "sorting", level: "medium", concept: "排序區間與最早最大空隙", goal: "掃描忙碌區間的聯集，求工作日內最長空檔。",
    explanation: ["把 hh:mm 換成分鐘，再依開始時間排序。cursor 初值為 600，代表目前忙碌聯集已覆蓋到的最晚時間。處理 [s,e] 前，若 s>cursor，便找到 [cursor,s] 空檔；之後以 max(cursor,e) 更新，可同時處理行程重疊。", "只在空檔長度嚴格變大時更新答案，排序掃描便會保留同長時最早者。最後再檢查 cursor 到 1080 的空檔。行程說明可能有空白，逐行只解析前兩個時間。讀至 EOF，依 Day #d 格式輸出，滿 60 分鐘使用 hours and minutes，即使 1 也不改單數。"],
    complexity: "每天時間 O(s log s)，空間 O(s)。", pitfall: "不能遺漏 10:00 前端或 18:00 尾端空檔；重疊行程不可讓 cursor 倒退。",
    traceLabel: "示意：11–12 點、13–14 點", trace: [
      { title: "第一空檔", description: "10:00 到 11:00 有 60 分鐘。", cells: ["600", "660", "720"], active: [0,1], variables: [["best", "60"], ["start", "600"]] },
      { title: "相同長度", description: "12:00 到 13:00 也是 60，保留較早的 10:00。", cells: ["720", "780", "840"], active: [0,1], variables: [["best", "60"], ["cursor", "840"]] },
      { title: "最後空檔", description: "14:00 到 18:00 長 240 分鐘，更新答案。", cells: ["840", "1080", "240"], active: [0,1,2], variables: [["start", "14:00"], ["時長", "4 hours and 0 minutes."]] },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <iomanip>
using namespace std;
int minute(string s){return stoi(s.substr(0,2))*60+stoi(s.substr(3,2));}
int main(){int n,day=0;string line;
while(cin>>n){getline(cin,line);vector<pair<int,int>> a;
    for(int i=0;i<n;++i){getline(cin,line);istringstream in(line);string s,e;in>>s>>e;a.push_back({minute(s),minute(e)});}
    sort(a.begin(),a.end());a.push_back({1080,1080});
    int cur=600,best=-1,start=600;
    for(auto [s,e]:a){if(s-cur>best){best=s-cur;start=cur;}cur=max(cur,e);}
    cout<<"Day #"<<++day<<": the longest nap starts at "<<setfill('0')<<setw(2)<<start/60<<':'<<setw(2)<<start%60<<setfill(' ')<<" and will last for ";
    if(best>=60)cout<<best/60<<" hours and ";cout<<best%60<<" minutes.\n";
}}`,
    python: String.raw`import sys
def minute(s):
    h, m = map(int, s.split(':'))
    return h*60+m
lines = iter(sys.stdin.read().splitlines())
day = 0
for line in lines:
    if not line.strip(): continue
    a = []
    for _ in range(int(line)):
        s, e, *rest = next(lines).split()
        a.append((minute(s), minute(e)))
    cur, best, start = 600, -1, 600
    for s, e in sorted(a)+[(1080,1080)]:
        if s-cur > best: best, start = s-cur, cur
        cur = max(cur,e)
    day += 1
    duration = (f'{best//60} hours and ' if best >= 60 else '')+f'{best%60} minutes.'
    print(f'Day #{day}: the longest nap starts at {start//60:02}:{start%60:02} and will last for {duration}')`,
  }),
  defineCpeLesson("a721", {
    topic: "simulation", level: "easy", concept: "排列的目的位置與字串資料", goal: "直接將每個原始數字字串放到指定索引。",
    explanation: ["p_i 是 x_i 的目的位置，所以建立長度 n 的結果陣列，執行 result[p_i−1]=x_i。排列恰好包含 1 到 n，每個位置會被寫入一次，不必排序或反覆交換。", "資料雖然看起來是浮點數，題目卻要求保留 32.0 等原始寫法，因此一律讀成字串。每筆索引與資料各占一整行，跳過資料組間的空白行，再把結果逐項輸出；測試組之間留一空行。"],
    complexity: "時間 O(n)，空間 O(n)，另計數字字串長度。", pitfall: "result[i]=x[p_i−1] 是反向排列；浮點轉換會破壞格式。",
    traceLabel: "示意：p=3,1,2；x=32.0,54.7,−2", trace: [
      { title: "放第一項", description: "32.0 放到第 3 格。", cells: ["?", "?", "32.0"], active: [2], variables: [["p1", "3"]] },
      { title: "放第二項", description: "54.7 放到第 1 格。", cells: ["54.7", "?", "32.0"], active: [0], variables: [["p2", "1"]] },
      { title: "放第三項", description: "−2 放到第 2 格，再從左至右輸出。", cells: ["54.7", "−2", "32.0"], active: [1], variables: [["p3", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;
int main(){int t;cin>>t;string line;getline(cin,line);
for(int cs=0;cs<t;++cs){
    do{if(!getline(cin,line))return 0;}while(line.find_first_not_of(" \t\r")==string::npos);
    istringstream indices(line);vector<int> p;int k;while(indices>>k)p.push_back(k);
    vector<string> ans(p.size());string x;
    for(int i:p){cin>>x;ans[i-1]=x;}getline(cin,line);
    if(cs)cout<<'\n';for(auto &s:ans)cout<<s<<'\n';
}}`,
    python: String.raw`import sys
lines = iter(sys.stdin.read().splitlines())
t = int(next(lines)); groups = []
for _ in range(t):
    line = next(lines)
    while not line.strip(): line = next(lines)
    p = list(map(int,line.split()))
    values = next(lines).split()
    ans = ['']*len(p)
    for i, value in zip(p,values): ans[i-1] = value
    groups.append('\n'.join(ans))
print('\n\n'.join(groups))`,
  }),
  defineCpeLesson("a722", {
    topic: "graphs", level: "medium", concept: "Floyd–Warshall 與網路直徑", goal: "求所有人之間最短距離，再判斷連通性。",
    explanation: ["姓名映射為整數編號，建立 P×P 距離矩陣，對角線為 0、已知關係為雙向的 1，其餘為無限大。即使某些人從未出現在關係中，仍須保留 P 個節點，否則會漏掉孤立者。", "依序允許第 k 人成為中繼點，更新 d[i][j]=min(d[i][j],d[i][k]+d[k][j])。k 的外層迴圈保證每階段只使用已允許的中繼點。完成後有無限距離即 DISCONNECTED，否則最大值為直徑。讀到 0 0 停止，每筆 Network k 後印空行。"],
    complexity: "時間 O(P³)，空間 O(P²)，P≤50。", pitfall: "不是最長簡單路徑；要求的是所有最短路中的最大值。",
    traceLabel: "示意：A–B–C，P=3", trace: [
      { title: "建立邊", description: "A 到 C 暫時未知。", cells: ["A–B=1", "B–C=1", "A–C=∞"], active: [0,1], variables: [["P", "3"]] },
      { title: "經 B 更新", description: "A 到 C 可以走 A–B–C，距離變 2。", cells: ["1", "+1", "=2"], active: [0,1,2], variables: [["d[A][C]", "2"]] },
      { title: "取得直徑", description: "所有點互通，最大最短距離是 2。", cells: ["AB:1", "BC:1", "AC:2"], active: [2], variables: [["輸出", "Network 1: 2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <algorithm>
using namespace std;
int main(){int p,r,cs=0;while(cin>>p>>r && (p||r)){
    vector<vector<int>>d(p,vector<int>(p,1000000));for(int i=0;i<p;++i)d[i][i]=0;
    map<string,int>id;auto get=[&](string s){if(!id.count(s)){int k=id.size();id[s]=k;}return id[s];};
    while(r--){string a,b;cin>>a>>b;int u=get(a),v=get(b);d[u][v]=d[v][u]=1;}
    for(int k=0;k<p;++k)for(int i=0;i<p;++i)for(int j=0;j<p;++j)d[i][j]=min(d[i][j],d[i][k]+d[k][j]);
    int best=0;for(auto &row:d)for(int x:row)best=max(best,x);
    cout<<"Network "<<++cs<<": ";if(best>=1000000)cout<<"DISCONNECTED";else cout<<best;cout<<"\n\n";
}}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split()); cs = 0
for token in it:
    p, r = int(token), int(next(it))
    if p == r == 0: break
    d = [[10**6]*p for _ in range(p)]
    for i in range(p): d[i][i] = 0
    names = {}
    for _ in range(r):
        a,b = next(it), next(it)
        for s in (a,b):
            if s not in names: names[s] = len(names)
        u,v = names[a],names[b]; d[u][v] = d[v][u] = 1
    for k in range(p):
        for i in range(p):
            for j in range(p): d[i][j] = min(d[i][j], d[i][k]+d[k][j])
    best = max(map(max,d)); cs += 1
    print(f'Network {cs}: '+('DISCONNECTED' if best >= 10**6 else str(best))+'\n')`,
  }),
  defineCpeLesson("a723", {
    topic: "number-theory", level: "easy", concept: "串流二進位取模", goal: "不建構超大整數，逐位維護除法餘數。",
    explanation: ["目前二進位前綴值為 v，接上位元 b 後變成 2v+b。由同餘性，只需保存 r=v mod 131071，更新 r=(2r+b) mod 131071，無論輸入多長都能維持固定範圍。", "數字可能跨行，換行和其他空白只是分隔，不代表整數結束。只有遇到 # 才判斷 r 是否為 0、輸出 YES 或 NO 並重設餘數。全零本身能被整除；EOF 時不應把尚無 # 的內容擅自當新資料輸出。"],
    complexity: "時間 O(B)，空間 O(1)，B 為所有位元數。", pitfall: "不能逐行重設餘數，也不能把 10000 位數塞進 long long。",
    traceLabel: "示意：二進位 101#", trace: [
      { title: "第一位 1", description: "0×2+1=1。", cells: ["1", "0", "1"], active: [0], variables: [["r", "1"]] },
      { title: "第二位 0", description: "1×2+0=2。", cells: ["1", "0", "1"], active: [1], variables: [["r", "2"]] },
      { title: "第三位與終止符", description: "2×2+1=5，遇 # 得 NO。", cells: ["1", "0", "1", "#"], active: [2,3], variables: [["r", "5"], ["重設後", "0"]] },
    ],
    cpp: String.raw`#include <iostream>
using namespace std;
int main(){char c;int r=0;while(cin.get(c)){
    if(c=='0'||c=='1')r=(r*2+c-'0')%131071;
    else if(c=='#'){cout<<(r==0?"YES":"NO")<<'\n';r=0;}
}}`,
    python: String.raw`import sys
r = 0
for c in sys.stdin.read():
    if c in '01': r = (2*r+int(c)) % 131071
    elif c == '#':
        print('YES' if r == 0 else 'NO')
        r = 0`,
  }),
  defineCpeLesson("a724", {
    topic: "trees", level: "medium", concept: "括號運算式的堆疊求值", goal: "遵守指定乘法順序，合併矩陣尺寸與成本。",
    explanation: ["遇到矩陣字母，就把它的列欄尺寸推入堆疊；左括號不用處理。遇到右括號，最上方兩個項目依序是右矩陣與左矩陣，將它們相乘後的尺寸推回。每次合併對應語法樹的一個內部節點，確保恰好遵守給定括號。", "若左欄數不等於右列數，整個運算式就是 error；否則新增 left.rows×left.cols×right.cols 的成本，結果尺寸為 left.rows×right.cols。成本以 long long 累加。矩陣定義後逐式讀到 EOF，單獨字母成本為 0；本題不是尋找最佳矩陣鏈順序。"],
    complexity: "每個運算式時間 O(L)、堆疊空間 O(L)。", pitfall: "彈出順序先右後左；相容判斷不可把列欄弄反。",
    traceLabel: "示意：(A(BC))，A=2×3，B=3×4，C=4×5", trace: [
      { title: "推入三矩陣", description: "堆疊由左至右保存待合併尺寸。", cells: ["2×3", "3×4", "4×5"], active: [1,2], variables: [["cost", "0"]] },
      { title: "合併 BC", description: "3×4×5=60，得到 3×5。", cells: ["2×3", "3×5"], active: [1], variables: [["cost", "60"]] },
      { title: "合併 A(BC)", description: "再加 2×3×5=30，合計 90。", cells: ["2×5"], active: [0], variables: [["cost", "90"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <utility>
using namespace std;
int main(){int n;cin>>n;pair<long long,long long>dim[26];
while(n--){char c;long long r,k;cin>>c>>r>>k;dim[c-'A']={r,k};}
string s;while(cin>>s){vector<pair<long long,long long>>st;long long cost=0;bool ok=true;
    for(char c:s){if(c>='A'&&c<='Z')st.push_back(dim[c-'A']);
        else if(c==')'){auto b=st.back();st.pop_back();auto a=st.back();st.pop_back();
            if(a.second!=b.first){ok=false;break;}
            cost+=a.first*a.second*b.second;st.push_back({a.first,b.second});}}
    if(ok)cout<<cost<<'\n';else cout<<"error\n";
}}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split()); n = int(next(it)); dim = {}
for _ in range(n):
    name = next(it)
    dim[name] = (int(next(it)),int(next(it)))
for s in it:
    stack = []; cost = 0; ok = True
    for c in s:
        if c in dim: stack.append(dim[c])
        elif c == ')':
            b = stack.pop(); a = stack.pop()
            if a[1] != b[0]: ok = False; break
            cost += a[0]*a[1]*b[1]; stack.append((a[0],b[1]))
    print(cost if ok else 'error')`,
  }),
  defineCpeLesson("a725", {
    topic: "number-theory", level: "easy", concept: "還原質因數表示再重新分解", goal: "計算原整數減一後的降冪質因數表示。",
    explanation: ["同一行中的數字兩兩配對為質數 p 與次方 e，先用整數乘法累乘 p 共 e 次，還原 x。輸入保證 x≤32767，因此不需要浮點 pow，也沒有大整數問題。再令 v=x−1。", "依序試除 d=2,3,…，每次除盡 d 並記次數；當 d²>剩餘值即可停止，剩餘值若大於 1 就是最後的質因數。收集結果後反向輸出，符合質數遞減規則。逐行讀取才能識別每組配對，單獨 0 結束，數字間只放一個空白。"],
    complexity: "每題時間 O(log x+√x)，空間 O(log x)。", pitfall: "應先還原 x 再減 1，不能把任何一個指數直接減 1。",
    traceLabel: "示意：5¹×2¹=10", trace: [
      { title: "還原並減一", description: "5×2=10，待分解數為 9。", cells: ["5^1", "2^1", "9"], active: [2], variables: [["x", "10"], ["v", "9"]] },
      { title: "第一次除 3", description: "9/3=3，指數增為 1。", cells: ["9", "3", "3"], active: [1,2], variables: [["e", "1"], ["v", "3"]] },
      { title: "第二次除 3", description: "3/3=1，因此輸出 3 2。", cells: ["3", "1", "3 2"], active: [2], variables: [["e", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;
int main(){string line;while(getline(cin,line)){
    istringstream in(line);int p,e;if(!(in>>p))continue;if(!p)break;
    int x=1;in>>e;for(int i=0;i<e;++i)x*=p;
    while(in>>p>>e)for(int i=0;i<e;++i)x*=p;
    int v=x-1;vector<pair<int,int>>f;
    for(int d=2;d*d<=v;++d)if(v%d==0){int count=0;while(v%d==0){v/=d;++count;}f.push_back({d,count});}
    if(v>1)f.push_back({v,1});bool first=true;
    for(auto it=f.rbegin();it!=f.rend();++it){if(!first)cout<<' ';first=false;cout<<it->first<<' '<<it->second;}cout<<'\n';
}}`,
    python: String.raw`import sys
for line in sys.stdin:
    a = list(map(int,line.split()))
    if not a: continue
    if a == [0]: break
    x = 1
    for p,e in zip(a[::2],a[1::2]): x *= p**e
    v = x-1; d = 2; factors = []
    while d*d <= v:
        e = 0
        while v%d == 0: v //= d; e += 1
        if e: factors.append((d,e))
        d += 1
    if v > 1: factors.append((v,1))
    print(' '.join(str(z) for pair in reversed(factors) for z in pair))`,
  }),
  defineCpeLesson("a726", {
    topic: "combinatorics", level: "hard", concept: "字典序排列反排名與多項式係數", goal: "逐字扣掉整塊排列數，而不列舉所有排列。",
    explanation: ["假設剩餘長度為 r，各字母出現次數為 c_i，互異排列共有 r!/∏c_i!。嘗試最小可用字母，暫扣一次後計算該前綴底下的排列數 ways；若 N≥ways，目標不在這塊，扣掉 ways 並還原次數，繼續下一個字母。", "若 N<ways，便固定此字母並進入下一位置。每次跳過的都是完整且較小的字典序區間，因此維持 N 為目前前綴內的零起算排名。此寫法也能處理重複字母；有效查詢須小於互異排列總數。20! 仍可放進有號 64 位整數，Python 使用任意精度整數。依測試筆數每題輸出一行。"],
    complexity: "字母種類 σ≤26、長度 n≤20；時間 O(nσ²)，空間 O(n+σ)。", pitfall: "排名從 0 開始；重複字母不能視為不同位置重複計數。",
    traceLabel: "示意：abc，N=3", trace: [
      { title: "跳過 a 開頭", description: "a 開頭有 2!=2 種，3−2=1。", cells: ["abc", "acb", "b??"], active: [0,1], variables: [["N", "1"]] },
      { title: "固定 b", description: "b 開頭也有 2 種，排名 1 落在其中。", cells: ["bac", "bca"], active: [1], variables: [["前綴", "b"], ["N", "1"]] },
      { title: "選 c 再 a", description: "跳過 ba 的 1 種後 N=0，答案為 bca。", cells: ["b", "c", "a"], active: [1,2], variables: [["N", "0"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){long long fact[21];fact[0]=1;for(int i=1;i<=20;++i)fact[i]=fact[i-1]*i;
int t;cin>>t;while(t--){string s;long long rank;cin>>s>>rank;int count[26]={};for(char c:s)++count[c-'a'];string ans;
for(int rem=int(s.size())-1;rem>=0;--rem)for(int c=0;c<26;++c)if(count[c]){
    --count[c];long long denom=1;for(int v:count)denom*=fact[v];long long ways=fact[rem]/denom;
    if(rank<ways){ans+=char('a'+c);break;}rank-=ways;++count[c];
}cout<<ans<<'\n';}}`,
    python: String.raw`import sys, math
from collections import Counter
it = iter(sys.stdin.read().split())
for _ in range(int(next(it))):
    s, rank = next(it), int(next(it)); count = Counter(s); ans = []
    for rem in range(len(s)-1,-1,-1):
        for c in sorted(count):
            if count[c] == 0: continue
            count[c] -= 1
            ways = math.factorial(rem)
            denom = math.prod(math.factorial(v) for v in count.values())
            ways //= denom
            if rank < ways: ans.append(c); break
            rank -= ways; count[c] += 1
    print(''.join(ans))`,
  }),
  defineCpeLesson("a727", {
    topic: "strings", level: "easy", concept: "不等長文字矩陣的座標旋轉", goal: "按照原欄序逐欄反向讀取各句。",
    explanation: ["若共有 H 行、最長長度 W，順時針旋轉後共有 W 行。輸出第 c 行時，依原行編號 H−1 到 0 取第 c 個字元，等價於座標 (r,c) 映射到 (c,H−1−r)。原句不足此欄時填入空白，保持其他字元位置。", "輸入必須逐行讀到 EOF，保留句內空白與空行，不能用單字分割。輸出每一行右端無字元的補白可省略，內部與行首補白則不可刪；這也符合本地公開範例的尾端空白呈現方式。"],
    complexity: "時間 O(HW)，空間 O(HW) 儲存輸入，單行輸出 O(H)。", pitfall: "要由最後一句讀回第一句；只移除輸出行尾空白，不可 strip 整行。",
    traceLabel: "示意：兩行 ABC、DE", trace: [
      { title: "第 0 欄", description: "由下往上得到 D、A。", cells: ["D", "A"], active: [0,1], variables: [["c", "0"], ["輸出", "DA"]] },
      { title: "第 1 欄", description: "由下往上得到 E、B。", cells: ["E", "B"], active: [0,1], variables: [["c", "1"], ["輸出", "EB"]] },
      { title: "第 2 欄", description: "第二句缺字，補空白後接 C。", cells: ["空白", "C"], active: [0,1], variables: [["c", "2"], ["輸出長度", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;
int main(){vector<string>a;string s;size_t w=0;
while(getline(cin,s)){if(!s.empty()&&s.back()=='\r')s.pop_back();w=max(w,s.size());a.push_back(s);}
for(size_t c=0;c<w;++c){string row;for(auto it=a.rbegin();it!=a.rend();++it)row+=c<it->size()?(*it)[c]:' ';
    while(!row.empty()&&row.back()==' ')row.pop_back();cout<<row<<'\n';
}}`,
    python: String.raw`import sys
a = sys.stdin.read().splitlines()
for c in range(max(map(len,a),default=0)):
    print(''.join(s[c] if c < len(s) else ' ' for s in reversed(a)).rstrip(' '))`,
  }),
  defineCpeLesson("a728", {
    topic: "sorting", level: "hard", concept: "強度排序與移除最重者的堆疊貪心", goal: "將堆疊轉為累積重量受期限限制的最多選取問題。",
    explanation: ["堆疊從上到下可整理成強度非遞減。若相鄰上方 A 的強度大於下方 B，原本含兩隻與其上方的總重不超過 sB；交換後 B 承受的重量減少，而放到下面的 A 承受原總重也不超過 sA。因此反覆交換得到強度排序。按此順序，選到每隻時的累積重量必須不超過其強度，等同工作耗時為重量、期限為強度的排程。", "依強度加入烏龜，將重量放進最大堆並累加 total。若 total>s，這批烏龜至少要捨棄一隻，刪掉最重者能在只少一隻的前提下留下最多餘裕。交換論證可把任何最佳方案捨棄的較輕者換成這個最重者，不減少隻數也不會讓後續負擔更大；先前前綴只會因刪除而減輕，因此可行性維持。一次刪除已足夠，因最重者至少和新加入者一樣重。讀到 EOF，堆大小就是最大高度，重量使用 long long。"],
    complexity: "n 隻烏龜，時間 O(n log n)、空間 O(n)。", pitfall: "強度包含自己的重量；堆中要刪最重者，不能刪強度最小者。",
    traceLabel: "示意：(100,101),(200,600),(300,1000)", trace: [
      { title: "第一隻", description: "100≤101，可以保留 1 隻。", cells: ["重量100", "強度101"], active: [0,1], variables: [["height", "1"], ["total", "100"]] },
      { title: "第二隻作底", description: "100+200=300≤600，兩隻都保留。", cells: ["100", "200"], active: [1], variables: [["height", "2"], ["total", "300"]] },
      { title: "第三隻作底", description: "300+300=600≤1000，疊成 3 隻。", cells: ["100", "200", "300"], active: [2], variables: [["總重", "600"], ["height", "3"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
#include <queue>
using namespace std;
int main(){vector<pair<long long,long long>>a;long long w,s;while(cin>>w>>s)a.push_back({s,w});sort(a.begin(),a.end());
priority_queue<long long> selected;long long total=0;
for(auto [strength,weight]:a){selected.push(weight);total+=weight;if(total>strength){total-=selected.top();selected.pop();}}
cout<<selected.size()<<'\n';}`, 
    python: String.raw`import sys, heapq
data = list(map(int,sys.stdin.buffer.read().split()))
a = sorted((s,w) for w,s in zip(data[::2],data[1::2]))
selected = []; total = 0
for s,w in a:
    heapq.heappush(selected,-w); total += w
    if total > s: total += heapq.heappop(selected)
print(len(selected))`,
  }),
  defineCpeLesson("a729", {
    topic: "combinatorics", level: "medium", concept: "嚴格遞增字串的組合排名", goal: "計算比目標更短或同長且字典序更小的合法字串數。",
    explanation: ["長度 k 的合法字串等同從 26 個字母選 k 個，因為選好後遞增順序唯一。因此先加上所有較短長度的 C(26,k)，再從目前字串排名 1 開始處理各位置。重複或下降的相鄰字母直接判為非法。", "第 i 個位置若改放比目標小、但大於前一字母的字母 c，後面還需選 r 個字母，選法有 C(25−c,r)，其中 c 用 a=0 編號。逐一加總所有較小分支，就得到同長度字典序排名。輸入逐詞讀到 EOF，每個字串輸出一行編號；長度超過 5 也應回傳 0。"],
    complexity: "預算組合表 O(26²)；每筆時間 O(26L)，空間 O(26²)。", pitfall: "這是先長度後字典序，不是把所有字串混在一起做字典排序。",
    traceLabel: "示意：ac 的編號", trace: [
      { title: "略過長度 1", description: "共有 26 個單字母，ac 起始排名為 27。", cells: ["a…z:26", "rank=27"], active: [1], variables: [["rank", "27"]] },
      { title: "第一字固定 a", description: "a 已是最小字母，沒有更小合法分支。", cells: ["a", "c"], active: [0], variables: [["增加", "0"]] },
      { title: "第二字略過 b", description: "ab 是唯一較小同前綴字，故 ac 為 28。", cells: ["ab:27", "ac:28"], active: [1], variables: [["rank", "28"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){int C[27][27]={};for(int n=0;n<=26;++n){C[n][0]=1;for(int k=1;k<=n;++k)C[n][k]=C[n-1][k-1]+C[n-1][k];}
string s;while(cin>>s){bool ok=s.size()<=5;for(size_t i=1;i<s.size();++i)if(s[i]<=s[i-1])ok=false;
    if(!ok){cout<<0<<'\n';continue;}int rank=1,L=s.size(),prev=-1;
    for(int k=1;k<L;++k)rank+=C[26][k];
    for(int i=0;i<L;++i){int cur=s[i]-'a';for(int c=prev+1;c<cur;++c)rank+=C[25-c][L-i-1];prev=cur;}
    cout<<rank<<'\n';
}}`,
    python: String.raw`import sys, math
for s in sys.stdin.read().split():
    if not 1 <= len(s) <= 5 or any(a >= b for a,b in zip(s,s[1:])):
        print(0); continue
    rank = 1+sum(math.comb(26,k) for k in range(1,len(s)))
    prev = -1
    for i,ch in enumerate(s):
        cur = ord(ch)-97; rem = len(s)-i-1
        for c in range(prev+1,cur):
            if 25-c >= rem: rank += math.comb(25-c,rem)
        prev = cur
    print(rank)`,
  }),
  defineCpeLesson("a730", {
    topic: "strings", level: "easy", concept: "位置對應的替換密碼", goal: "依字母表建立字元映射，保留未列入的字元。",
    explanation: ["明文字母表第 i 個字元對應替換字母表第 i 個字元，因此先建立一對一的查表關係。掃描每個待轉換文字字元時，只查原字元一次，不能把剛替換的結果再送入映射，否則會造成連鎖替換。", "每組先反過來印出替換字母表、明文字母表，再印轉換文字。逐行讀取以保留空白和標點，空白行是測試組分界，EOF 也可結束最後一組。未出現在明文字母表的大小寫字母、數字及符號均原樣保留，組與組之間印一空行。"],
    complexity: "時間 O(K+L)，空間 O(K)，K 為字母表大小、L 為文字總長。", pitfall: "輸出前兩行順序和輸入相反；不要自動把大寫字母轉小寫。",
    traceLabel: "示意：abc → xyz，文字 aB c", trace: [
      { title: "建立表", description: "只替換 a、b、c。", cells: ["a→x", "b→y", "c→z"], active: [0,1,2], variables: [["映射數", "3"]] },
      { title: "處理 aB", description: "a 變 x，大寫 B 未在表中保持不變。", cells: ["x", "B"], active: [0,1], variables: [["已讀字元", "2"]] },
      { title: "處理空白與 c", description: "保留空白，再將 c 變 z。", cells: ["x", "B", "空白", "z"], active: [2,3], variables: [["結果長度", "4"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
using namespace std;
int main(){int t;cin>>t;string line;getline(cin,line);
for(int cs=0;cs<t;++cs){string plain,cipher;
    do{if(!getline(cin,plain))return 0;if(!plain.empty()&&plain.back()=='\r')plain.pop_back();}while(plain.empty());
    getline(cin,cipher);if(!cipher.empty()&&cipher.back()=='\r')cipher.pop_back();
    char table[256];for(int i=0;i<256;++i)table[i]=char(i);for(size_t i=0;i<plain.size();++i)table[(unsigned char)plain[i]]=cipher[i];
    if(cs)cout<<'\n';cout<<cipher<<'\n'<<plain<<'\n';
    while(getline(cin,line)){if(!line.empty()&&line.back()=='\r')line.pop_back();if(line.empty())break;for(unsigned char c:line)cout<<table[c];cout<<'\n';}
}}`,
    python: String.raw`import sys
lines = iter(sys.stdin.read().splitlines()); t = int(next(lines)); groups = []
for _ in range(t):
    plain = next(lines)
    while plain == '': plain = next(lines)
    cipher = next(lines); table = str.maketrans(plain,cipher)
    out = [cipher,plain]
    for line in lines:
        if line == '': break
        out.append(line.translate(table))
    groups.append('\n'.join(out))
print('\n\n'.join(groups))`,
  }),
  defineCpeLesson("a731", {
    topic: "geometry", level: "easy", concept: "開區間的矩形內部判定", goal: "用四個嚴格不等式列出所有包含點的矩形。",
    explanation: ["矩形以左上 (x1,y1)、右下 (x2,y2) 表示。點 (x,y) 位於內部，恰好等價於 x1<x<x2 且 y2<y<y1。四個條件都要嚴格成立，邊界與角落一律不算。", "先讀到 * 收集矩形，再逐點測試所有矩形，符合者依輸入編號輸出；一點可能同時在多個矩形內。全部檢查後若沒有符合者才輸出 not contained。遇到 9999.9 9999.9 結束，不替終止點編號或輸出，句型依題目大小寫且沒有句尾句點。"],
    complexity: "R 個矩形、Q 個點，時間 O(RQ)，儲存空間 O(R)。", pitfall: "y1 是上邊、y2 是下邊；不能使用 ≤，也不能找到第一個矩形就停止。",
    traceLabel: "示意：矩形 (0,4)–(4,0)", trace: [
      { title: "內部點 (2,2)", description: "0<2<4 在兩軸均成立。", cells: ["x:0<2<4", "y:0<2<4"], active: [0,1], variables: [["包含", "1"]] },
      { title: "邊界點 (0,2)", description: "x 等於左邊界，嚴格比較失敗。", cells: ["x:0=0", "y:2"], active: [0], variables: [["包含", "0"]] },
      { title: "外部點 (5,2)", description: "x 超過右邊界，也不包含。", cells: ["x:5>4", "y:2"], active: [0], variables: [["包含", "0"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <array>
using namespace std;
int main(){vector<array<double,4>>r;char c;while(cin>>c&&c!='*'){array<double,4>a;for(double &v:a)cin>>v;r.push_back(a);}
double x,y;int p=0;while(cin>>x>>y && !(x==9999.9&&y==9999.9)){++p;bool found=false;
    for(size_t i=0;i<r.size();++i){auto a=r[i];if(a[0]<x&&x<a[2]&&a[3]<y&&y<a[1]){found=true;cout<<"Point "<<p<<" is contained in figure "<<i+1<<'\n';}}
    if(!found)cout<<"Point "<<p<<" is not contained in any figure\n";
}}`,
    python: String.raw`import sys
it = iter(sys.stdin.read().split()); rectangles = []
for token in it:
    if token == '*': break
    rectangles.append(tuple(float(next(it)) for _ in range(4)))
p = 0
for token in it:
    x,y = float(token),float(next(it))
    if (x,y) == (9999.9,9999.9): break
    p += 1; found = False
    for i,(x1,y1,x2,y2) in enumerate(rectangles,1):
        if x1 < x < x2 and y2 < y < y1:
            found = True; print(f'Point {p} is contained in figure {i}')
    if not found: print(f'Point {p} is not contained in any figure')`,
  }),
];
