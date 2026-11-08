"""Author/verify only b568,b569,b573,b578,b590,b591,b592 sidecars.

python3 verify-hard-562-607.py --author   # regenerate the owned lesson sidecar
python3 verify-hard-562-607.py            # Linux/WSL runtime checks + evidence
All generated executables live in /tmp. No database, registry or merged data edits.
"""
import argparse
import functools
import hashlib
import itertools
import json
import math
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import time

P = Path(__file__).resolve().parent
M = 1000000007
CODES = ['b568','b569','b573','b578','b590','b591','b592']
SOURCE = {p['code']:p for p in json.loads((P/'source.json').read_text(encoding='utf-8'))}
HEAD = '#include <bits/stdc++.h>\nusing namespace std;\nusing ll=long long;\nconst ll MOD=1000000007;\n'
LOSING = [1,2,4,7,10,20,23,26,50,53,270,273,276,282,285,288,316,334,337,340,346,359,362,365,386,389,392,566,630,633,636,639,673,676,682,685,923,926,929,932,1222]


def author():
    lessons = []

    def add(code,topic,concept,goal,proof,complexity,pitfall,trace,python,cpp,note=None):
        source = SOURCE[code]
        lesson = dict(code=code,title=source['title'].split('. ',1)[1],topic=topic,level='hard',
                      concept=concept,goal=goal,explanation=proof,complexity=complexity,pitfall=pitfall,
                      sampleInput=source['samples'][0]['input'],sampleOutput=source['samples'][0]['output'],
                      traceLabel=trace[0],trace=[dict(title=t,description=d,cells=c,active=a,variables=v) for t,d,c,a,v in trace[1]],
                      python=python.strip()+'\n',cpp=HEAD+cpp.strip()+'\n')
        if note: lesson['performanceNote'] = note
        lessons.append(lesson)

    add('b568','geometry','線段掃描線與最早碰撞編號',
        '以 O(n log n) 找出最早碰到舊軌跡的指令，再沿該線段找最近交點。',[
        '官方 [Robot Path](https://cses.fi/problemset/task/1742/) 說走過的 point 都算已訪問，不只指令端點。把同方向相鄰指令合併，連續反向則在轉向處截斷：沿原線段反走時，任意正距離都已走過，沒有正長度的安全延伸，所以額外距離為 0，而非先走一格。這是連續路徑的立即停止解讀；前面若已有碰撞仍必須優先處理，不能一讀到反向就直接輸出累積長度。合併後相鄰線段都垂直，兩者的共同轉角只是一次連續通過，不算返回。',
        '替線段依時間編號。任意一對非相鄰相交線段 i,j，碰撞最晚在編號 max(i,j) 的指令發生；在所有相交對中取此值的最小值，便是第一個發生碰撞的指令。同向線段先合併，故同一直線上的重疊對不可能相鄰。將它們按固定座標、左端排序，以最小編號 heap 保存尚未結束的區間，懶刪已結束者；每段只需與目前最小編號比較，就得到該段可能的最小 max(i,j)。水平和垂直同樣處理，端點相等也算交會。',
        '垂直交會用 x 掃描：水平段在左端加入、右端移除；同 x 先加入、再查詢、最後移除，包含端點。壓縮水平段的 y，各葉 heap 保存活躍編號，線段樹保存區間最小編號。對垂直段查 y 範圍最小值，若結果是相鄰段就暫時移除再查，至多排除兩個編號，查完復原。因 max(i,j) 隨 i 單調，保留最小合格 i 足夠，不需列舉可能二次方個交點。每段與事件只處理常數次，為 O(n log n)。確定首個碰撞指令後，直接掃描所有更早非相鄰段，算該指令前進方向最近的交點，將之前完整長度加上此距離；沒有碰撞則走完截斷後路徑。'],
        '合併後 m≤n。排序、heap 及線段樹共 O(n log n) 時間；最後定位 O(n)。空間 O(n)，含輸入、事件及 heap。座標與總距離可達 10^11，C++ 使用 long long。',
        '只比較指令端點會漏掉途中交叉；相鄰段的共同起終點需排除，但非相鄰端點接觸不能排除；連續反向不能加 1。',
        ('展示例 R3,U2,L3,D3 的連續軌跡',[
            ('前三段','累積 3+2+3=8，尚未重訪。',['(0,0)','(3,0)','(3,2)','(0,2)'],[3],[['已走距離','8'],['下一段','D 3']]),
            ('找到最早碰撞段','第 4 段 x=0 會與第 1 段在原點交會，與第 3 段的共同轉角不算返回。',['段1 y=0','段3 y=2','段4 x=0'],[0,2],[['碰撞指令','4'],['交點','(0,0)']]),
            ('沿段找最近點','由 (0,2) 向下走 2 到原點立即停止，不執行剩餘 1。',['8+2','10'],[1],[['段內距離','2'],['答案','10']])]),
        r'''import sys
import heapq
from bisect import bisect_left, bisect_right

def solve():
    it = iter(sys.stdin.buffer.read().split())
    n = int(next(it))
    moves = []
    opposite = {b'U':b'D',b'D':b'U',b'L':b'R',b'R':b'L'}
    for _ in range(n):
        d, length = next(it), int(next(it))
        if moves and opposite[d] == moves[-1][0]:
            break
        if moves and d == moves[-1][0]:
            moves[-1][1] += length
        else:
            moves.append([d,length])
    segments = []
    x = y = 0
    for d,length in moves:
        xx = x + (length if d == b'R' else -length if d == b'L' else 0)
        yy = y + (length if d == b'U' else -length if d == b'D' else 0)
        segments.append((x,y,xx,yy))
        x,y = xx,yy
    count = len(segments)
    best = count
    # Collinear overlaps, including a single common endpoint.
    for horizontal in (True,False):
        rows = []
        for i,(x,y,xx,yy) in enumerate(segments):
            if (y == yy) == horizontal:
                fixed,lo,hi = (y,min(x,xx),max(x,xx)) if horizontal else (x,min(y,yy),max(y,yy))
                rows.append((fixed,lo,hi,i))
        rows.sort()
        heap = []
        last = None
        for fixed,lo,hi,i in rows:
            if fixed != last:
                heap = []
                last = fixed
            while heap and heap[0][1] < lo:
                heapq.heappop(heap)
            if heap:
                best = min(best,max(i,heap[0][0]))
            heapq.heappush(heap,(i,hi))
    ys = sorted({y for x,y,xx,yy in segments if y == yy})
    if ys:
        size = 1
        while size < len(ys): size *= 2
        tree = [count]*(2*size)
        heaps = [[] for _ in ys]
        active = [False]*count
        position = [-1]*count
        events = []
        for i,(x,y,xx,yy) in enumerate(segments):
            if y == yy:
                p = bisect_left(ys,y)
                position[i] = p
                events.append((min(x,xx),0,i))
                events.append((max(x,xx),2,i))
            else:
                events.append((x,1,i))
        events.sort()
        def refresh(p):
            h = heaps[p]
            while h and not active[h[0]]: heapq.heappop(h)
            node = size+p
            tree[node] = h[0] if h else count
            node //= 2
            while node:
                value = min(tree[node*2],tree[node*2+1])
                if value == tree[node]: break
                tree[node] = value
                node //= 2
        def query(left,right):
            left += size
            right += size
            result = count
            while left < right:
                if left & 1:
                    result = min(result,tree[left]); left += 1
                if right & 1:
                    right -= 1; result = min(result,tree[right])
                left //= 2; right //= 2
            return result
        for x,kind,i in events:
            if kind != 1:
                p = position[i]
                active[i] = kind == 0
                if kind == 0: heapq.heappush(heaps[p],i)
                refresh(p)
            else:
                _,y,_,yy = segments[i]
                left = bisect_left(ys,min(y,yy))
                right = bisect_right(ys,max(y,yy))
                removed = []
                while True:
                    j = query(left,right)
                    if j == count or abs(i-j) != 1: break
                    p = position[j]
                    heapq.heappop(heaps[p])
                    removed.append(j)
                    refresh(p)
                if j != count: best = min(best,max(i,j))
                for j in removed:
                    p = position[j]
                    heapq.heappush(heaps[p],j)
                    refresh(p)
    distance = sum(moves[i][1] for i in range(best))
    if best < count:
        x,y,xx,yy = segments[best]
        nearest = abs(xx-x)+abs(yy-y)
        for a,b,c,d in segments[:max(0,best-1)]:
            if y == yy:
                if b == d:
                    if b != y: continue
                    lo,hi = max(min(x,xx),min(a,c)),min(max(x,xx),max(a,c))
                    if lo > hi: continue
                    crossx = lo if xx > x else hi
                else:
                    crossx = a
                    if not (min(x,xx)<=a<=max(x,xx) and min(b,d)<=y<=max(b,d)): continue
                nearest = min(nearest,abs(crossx-x))
            else:
                if a == c:
                    if a != x: continue
                    lo,hi = max(min(y,yy),min(b,d)),min(max(y,yy),max(b,d))
                    if lo > hi: continue
                    crossy = lo if yy > y else hi
                else:
                    crossy = b
                    if not (min(y,yy)<=b<=max(y,yy) and min(a,c)<=x<=max(a,c)): continue
                nearest = min(nearest,abs(crossy-y))
        distance += nearest
    print(distance)

solve()''',r'''
struct Segment {ll x,y,xx,yy;};
int main(){
    ios::sync_with_stdio(false);cin.tie(nullptr);
    int n;cin>>n; vector<pair<char,ll>> moves;
    auto opposite=[](char a,char b){return (a=='U'&&b=='D')||(a=='D'&&b=='U')||(a=='L'&&b=='R')||(a=='R'&&b=='L');};
    for(int i=0;i<n;i++){char d;ll len;cin>>d>>len;if(!moves.empty()&&opposite(d,moves.back().first))break;
        if(!moves.empty()&&d==moves.back().first)moves.back().second+=len;else moves.push_back({d,len});}
    vector<Segment>s;ll x=0,y=0;for(auto [d,len]:moves){ll xx=x+(d=='R'?len:d=='L'?-len:0),yy=y+(d=='U'?len:d=='D'?-len:0);s.push_back({x,y,xx,yy});x=xx;y=yy;}
    int m=s.size(),best=m;
    for(bool horizontal:{true,false}){
        vector<tuple<ll,ll,ll,int>>rows;
        for(int i=0;i<m;i++){auto [x,y,xx,yy]=s[i];if((y==yy)==horizontal){if(horizontal)rows.emplace_back(y,min(x,xx),max(x,xx),i);else rows.emplace_back(x,min(y,yy),max(y,yy),i);}}
        sort(rows.begin(),rows.end());priority_queue<pair<int,ll>,vector<pair<int,ll>>,greater<pair<int,ll>>>heap;
        ll last=LLONG_MIN;
        for(auto [fixed,lo,hi,i]:rows){if(fixed!=last){heap={};last=fixed;}while(!heap.empty()&&heap.top().second<lo)heap.pop();if(!heap.empty())best=min(best,max(i,heap.top().first));heap.push({i,hi});}
    }
    vector<ll>ys;for(auto z:s)if(z.y==z.yy)ys.push_back(z.y);sort(ys.begin(),ys.end());ys.erase(unique(ys.begin(),ys.end()),ys.end());
    if(!ys.empty()){
        int size=1;while(size<(int)ys.size())size*=2;vector<int>tree(2*size,m),position(m,-1);vector<bool>active(m,false);
        vector<priority_queue<int,vector<int>,greater<int>>>heaps(ys.size());vector<tuple<ll,int,int>>events;
        for(int i=0;i<m;i++){auto z=s[i];if(z.y==z.yy){position[i]=lower_bound(ys.begin(),ys.end(),z.y)-ys.begin();events.emplace_back(min(z.x,z.xx),0,i);events.emplace_back(max(z.x,z.xx),2,i);}else events.emplace_back(z.x,1,i);}
        sort(events.begin(),events.end());
        auto refresh=[&](int p){auto &h=heaps[p];while(!h.empty()&&!active[h.top()])h.pop();int node=size+p;tree[node]=h.empty()?m:h.top();for(node/=2;node;node/=2)tree[node]=min(tree[node*2],tree[node*2+1]);};
        auto query=[&](int l,int r){int ans=m;for(l+=size,r+=size;l<r;l/=2,r/=2){if(l&1)ans=min(ans,tree[l++]);if(r&1)ans=min(ans,tree[--r]);}return ans;};
        for(auto [at,kind,i]:events){if(kind!=1){int p=position[i];active[i]=kind==0;if(kind==0)heaps[p].push(i);refresh(p);}
            else{auto z=s[i];int l=lower_bound(ys.begin(),ys.end(),min(z.y,z.yy))-ys.begin(),r=upper_bound(ys.begin(),ys.end(),max(z.y,z.yy))-ys.begin();vector<int>removed;int j;
                while(true){j=query(l,r);if(j==m||abs(i-j)!=1)break;int p=position[j];heaps[p].pop();removed.push_back(j);refresh(p);}if(j!=m)best=min(best,max(i,j));for(int id:removed){heaps[position[id]].push(id);refresh(position[id]);}}
        }
    }
    ll distance=0;for(int i=0;i<best;i++)distance+=moves[i].second;
    if(best<m){auto [x,y,xx,yy]=s[best];ll near=abs(xx-x)+abs(yy-y);
        for(int i=0;i<best-1;i++){auto [a,b,c,d]=s[i];if(y==yy){ll t;if(b==d){if(b!=y)continue;ll lo=max(min(x,xx),min(a,c)),hi=min(max(x,xx),max(a,c));if(lo>hi)continue;t=xx>x?lo:hi;}else{t=a;if(!(min(x,xx)<=a&&a<=max(x,xx)&&min(b,d)<=y&&y<=max(b,d)))continue;}near=min(near,abs(t-x));}
            else{ll t;if(a==c){if(a!=x)continue;ll lo=max(min(y,yy),min(b,d)),hi=min(max(y,yy),max(b,d));if(lo>hi)continue;t=yy>y?lo:hi;}else{t=b;if(!(min(y,yy)<=b&&b<=max(y,yy)&&min(a,c)<=x&&x<=max(a,c)))continue;}near=min(near,abs(t-y));}}
        distance+=near;
    }cout<<distance<<'\n';
}''', 'Python 使用相同 O(n log n) 全範圍演算法，沒有逐單位展開；但 1 秒限制下 Python heap、事件排序及多次線段樹操作可能超時，建議正式提交 C++17。效能側錄為本機最大規模測試，不代表官方評測通過。')

    add('b569','dp','Sprague–Grundy 與有來源的有限範圍零值表',
        '區分 SG 遞推的證明、有限計算結果，以及尚未證明的無窮外推。',[
        '令 g(n)=mex{g(a) xor g(n−a) | 1≤a<n−a}；g(1)=g(2)=0。兩個不相干硬幣堆的 SG 值異或，0 表示輪到的人必敗。因此只知道各單堆的勝敗還不夠，遞推必須保存完整 SG 數字，且不能把相等兩堆當合法切法。這個遞推可精確驗證任意有限前綴，但直接算到 10^6 需要 O(10^12) 級的配對工作，不能作為 1 秒的提交方案。',
        '本題採用已發表的有限計算資料，而不是由「算到 2000」猜之後全贏。[Achim Flammenkamp 原始計算紀錄](https://wwwhomes.uni-bielefeld.de/achim/grundy.html) 的 Heapsizes 0–2^35 頻率表列出 SG=0 共 42 次、最後出現在 1222；其中含 n=0，所以合法正整數有 41 個。這個已報告的有限範圍包含題目全部 n≤10^6，可把列出的零值存成集合查詢。此解的範圍保證依賴該外部計算紀錄；本次獨立 SG 回歸只重算到 5000，不宣稱重現原作者的 2^35 計算，也不把有限表當成無窮定理。',
        '程式對表內的合法 n 輸出 second，其餘輸出 first。全題 n≤10^6 的範圍依據是上述外部有限計算紀錄；本次獨立回歸重算到 5000。這些有限資料不構成所有 n>1222 都先手勝或 SG 序列最終週期化的無窮定理。'],
        '固定 41 個零值。C++ 有序集合查詢 O(log 41)，Python 雜湊查詢平均 O(1)，總時間 O(t)、總輸入輸出緩衝 O(t)，表本身 O(41)。不在執行時重算 10^6 個 SG 值。',
        '不能把 g(a) xor g(b) 換成「兩堆都贏」；1222 之後的全範圍結論來自具體有限計算範圍，不是 2000 次實驗的歸納。',
        ('小範圍 SG 推導：n=3、4、5',[
            ('n=3','唯一切法 1+2，後繼 SG 為 0，所以 mex{0}=1。',['g(1)=0','g(2)=0','g(3)=1'],[2],[['後繼集合','{0}'],['勝方','first']]),
            ('n=4','只能切 1+3，後繼為 1；2+2 不合法，mex{1}=0。',['1+3 → 1','2+2 禁止','g(4)=0'],[2],[['後繼集合','{1}'],['勝方','second']]),
            ('n=5','1+4 得 0，2+3 得 1，mex{0,1}=2。',['1+4 → 0','2+3 → 1','g(5)=2'],[2],[['後繼集合','{0,1}'],['勝方','first']])]),
        'import sys\n\nlosing = {'+', '.join(map(str,LOSING))+'}'+r'''
data = list(map(int, sys.stdin.buffer.read().split()))
t = data[0]
out = []
for n in data[1:t+1]:
    if not 1 <= n <= 1000000:
        raise ValueError('n is outside the verified problem range')
    out.append('second' if n in losing else 'first')
print('\n'.join(out))''',
        'int main(){ios::sync_with_stdio(false);cin.tie(nullptr);const set<int>losing={'+','.join(map(str,LOSING))+r'''};
    int t;cin>>t;while(t--){int n;cin>>n;if(n<1||n>1000000)return 1;cout<<(losing.count(n)?"second":"first")<<'\n';}}
''')

    add('b573','data-structures','固定上下界與 OR 聚合雙堆疊佇列',
        '以位元遮罩與均攤 O(1) 滑動視窗，數出包含所有 k 種字母的矩形。',[
        '固定上界 top，再逐列增加 bottom。每欄以 k 位遮罩保存這段列區間出現過的字母，新增一列只需 OR。對固定列帶，欄區間包含全部字母，等價於該區間所有欄遮罩的 OR 為 full=(1<<k)−1，因此每個矩形恰在自己的上下界被計一次。這裡需要「至少一次全部種類」，不是每欄都要包含全部字母。',
        'OR 沒有可直接相減的反運算，故不能刪除一欄時直接 XOR。使用兩個帶聚合值的堆疊實作佇列：後堆疊負責加入，前堆疊負責移除；前堆疊空時，把後堆疊倒入，重新累積各層 OR。整個視窗的 OR 是兩堆疊頂端聚合值的 OR，每個欄值最多入後堆疊、轉移、出前堆疊各一次，故均攤 O(1)。',
        '每增加右界 r，當視窗 OR=full 就不斷刪左端，直到留下第一個不滿足的視窗。若共刪掉 left 欄，則恰有 left 個起點可與 r 組成合法矩形：被刪起點的視窗都曾完整，往更左延長也完整；目前與更右的起點缺某字母。把 left 加入答案。共有 O(n²) 組列帶，每組掃 O(n) 欄，得到 O(n³) 全範圍演算法。'],
        '時間 O(n³)，字母位元遮罩最多 26 位；額外視窗與欄遮罩 O(n)，含方格輸入 O(n²)。答案可能達 [n(n+1)/2]²，C++ 使用 long long。',
        'OR 無法直接用 XOR 刪除元素；只對整個列帶檢查一次會漏掉不同左右界。',
        ('展示例 AB/BA，full=3',[
            ('上面一列','遮罩為 [A=1,B=2]，只有寬 2 的區間合法。',['1','2','OR=3'],[2],[['top,bottom','0,0'],['貢獻','1']]),
            ('兩列一起','每欄都含 A 和 B，三個非空欄區間全部合法。',['3','3'],[0,1],[['top,bottom','0,1'],['貢獻','3']]),
            ('下面一列','遮罩 [B=2,A=1] 再貢獻一個，總數 1+3+1=5。',['2','1','合計5'],[2],[['top,bottom','1,1'],['答案','5']])]),
        r'''import sys

it = iter(sys.stdin.buffer.read().split())
n, k = int(next(it)), int(next(it))
grid = [[1 << (c-65) for c in next(it)] for _ in range(n)]
full = (1 << k)-1
answer = 0
for top in range(n):
    masks = [0]*n
    for bottom in range(top,n):
        row = grid[bottom]
        front = []
        back = []
        back_or = 0
        left = 0
        for j in range(n):
            masks[j] |= row[j]
            value = masks[j]
            back.append(value)
            back_or |= value
            while ((front[-1] if front else 0) | back_or) == full:
                if not front:
                    aggregate = 0
                    while back:
                        aggregate |= back.pop()
                        front.append(aggregate)
                    back_or = 0
                front.pop()
                left += 1
            answer += left
print(answer)''',r'''
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,k;cin>>n>>k;vector<vector<int>>g(n,vector<int>(n));for(auto &row:g)for(int &v:row){char c;cin>>c;v=1<<(c-'A');}
    int full=(1<<k)-1;ll ans=0;for(int top=0;top<n;top++){vector<int>mask(n);for(int bottom=top;bottom<n;bottom++){
        vector<int>front,back;front.reserve(n);back.reserve(n);int backOR=0,left=0;
        for(int j=0;j<n;j++){mask[j]|=g[bottom][j];back.push_back(mask[j]);backOR|=mask[j];
            while(((front.empty()?0:front.back())|backOR)==full){if(front.empty()){int all=0;while(!back.empty()){all|=back.back();back.pop_back();front.push_back(all);}backOR=0;}front.pop_back();left++;}ans+=left;}}}cout<<ans<<'\n';}
''','Python 的 O(n³) 程式完整支援 n=500，沒有縮減測資，但約 6.26×10^7 次右界更新及堆疊操作可能遠超過 1 秒；正式滿分提交建議 C++17。Python 適合驗證與教學，最大規模實測時間另列，不宣稱能通過官方時限。')

    add('b578','dp','列對、連續同色頂底與垂直高度',
        '以 O(n³) 統計每種字母的完整邊框，包含高或寬為 1 的情況。',[
        '預算 height[r][c]：自 (r,c) 往上連續相同字母的格數。固定 top、bottom，掃欄位。若這兩列在某欄字母不同，該欄不能出現在任何有效邊框的頂底之間；若相同為字母 x，只能與相鄰同為 x 的欄構成一個連續區塊。於是每個區塊內的任何左右界都已保證頂邊與底邊全是 x。',
        '區塊內，欄 c 可當垂直邊，當且僅當 height[bottom][c]≥bottom−top+1；它涵蓋整段列界且字母就是 x。維護此前合格欄數 seen。遇到合格欄作右界時，左界可選此前 seen 欄或本欄，共 seen+1，加入該字母答案後 seen++。不合格的中間欄不會打斷區塊，因內部不受限制；只有頂底不相同或字母改變才重設 seen。',
        '對每個合法矩形，所屬上下界、同色頂底區塊及左右兩個合格欄唯一，因此不重不漏。left=right 自然計入單欄；top=bottom 時高度條件自動成立，每個單色列區間都被計一次，單格也正好一次。整個過程不需為 k 個字母各重掃一次。'],
        '時間 O(n³)，高度表及方格空間 O(n²)，答案陣列 O(k)。答案上界為 [n(n+1)/2]²，須用 64 位元整數。',
        '垂直高度不夠的內部欄仍可放在邊框中間；不能把它當斷點。高或寬為 1 也有邊界，不能漏算。',
        ('展示例 AA/AB 的 A 邊框',[
            ('top=bottom=0','上列 AA 的單格與整列共有 3 個。',['A','A'],[0,1],[['A累計','3'],['B累計','0']]),
            ('top=0,bottom=1','第一欄垂直 AA 合格；第二欄頂底不同，故只有 1 個 A 單欄。',['AA','AB'],[0],[['A累計','4'],['列帶貢獻','1']]),
            ('top=bottom=1','下列 A、B 各一個單格，最後 A=5、B=1。',['A=5','B=1'],[0,1],[['A答案','5'],['B答案','1']])]),
        r'''import sys

it = iter(sys.stdin.buffer.read().split())
n, k = int(next(it)), int(next(it))
grid = [list(next(it)) for _ in range(n)]
height = [[1]*n for _ in range(n)]
for r in range(1,n):
    for c in range(n):
        if grid[r][c] == grid[r-1][c]:
            height[r][c] = height[r-1][c]+1
answer = [0]*k
for top in range(n):
    upper = grid[top]
    for bottom in range(top,n):
        lower, heights = grid[bottom], height[bottom]
        need = bottom-top+1
        previous = -1
        seen = 0
        for c in range(n):
            value = upper[c]
            if value != lower[c]:
                previous = -1
                seen = 0
                continue
            if value != previous:
                previous = value
                seen = 0
            if heights[c] >= need:
                seen += 1
                answer[value-65] += seen
print('\n'.join(map(str,answer)))''',r'''
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,k;cin>>n>>k;vector<string>g(n);for(auto &s:g)cin>>s;vector<vector<int>>h(n,vector<int>(n,1));for(int r=1;r<n;r++)for(int c=0;c<n;c++)if(g[r][c]==g[r-1][c])h[r][c]=h[r-1][c]+1;
    vector<ll>ans(k);for(int top=0;top<n;top++)for(int bottom=top;bottom<n;bottom++){int need=bottom-top+1,seen=0;char previous=0;for(int c=0;c<n;c++){char x=g[top][c];if(x!=g[bottom][c]){previous=0;seen=0;continue;}if(x!=previous){previous=x;seen=0;}if(h[bottom][c]>=need)ans[x-'A']+=++seen;}}for(ll x:ans)cout<<x<<'\n';}
''','Python 同樣是全範圍 O(n³)，n=500 約 6.26×10^7 次欄檢查；1 秒時限不宜保證 Python 可過，建議正式提交 C++17。這不是截小 n 的範例程式；效能報告包含滿格及交錯格等最大形狀。')

    add('b590','number-theory','兩個部分排列與分離的容斥',
        '以 O(n²) 容斥數出互不重疊的 A、B 排列補法。',[
        '每列每欄恰一個 A，故 A 的位置是一個排列，B 也是一個排列，唯一額外限制是兩排列不能選同格。令 a、b 為尚缺 A、B 的列數（也等於缺該字母的欄數），R、C 為兩字母都缺的列、欄數。固定 A 的格子若其列與欄都尚缺 B，便形成一個 B 不能填的格子，數量 p；相反的固定 B 形成 q 個 A 禁格。這些禁格本身各是一個部分排列。',
        '對兩字母同格事件作容斥。選 j 個固定 B 禁格強迫 A 填入、i 個固定 A 禁格強迫 B 填入；另選 k 個兩者皆自由的碰撞格。後者必為 R×C 中的不同行不同欄匹配，有 C(R,k)C(C,k)k! 種。固定 A 禁格的列欄不屬於雙自由區域；固定 B 同理，所以三組事件不會互搶同一排列的列欄，剩下的 A、B 分別可任意排列，數量為 (a−j−k)!、(b−i−k)!。容斥符號為 (−1)^(i+j+k)，涵蓋所有不合法同格事件。',
        '將三重和拆開。對每個 0≤k≤min(R,C)，計算 U(k)=Σ[j=0..q](−1)^j C(q,j)(a−k−j)!、V(k)=Σ[i=0..p](−1)^i C(p,i)(b−k−i)!，答案為 Σk (−1)^k C(R,k)C(C,k)k! U(k)V(k)。因 q+R≤a、p+R≤b，階乘索引不會為負；預算階乘與反階乘後每個係數 O(1)，總工作 O(n²)，不枚舉 n! 個排列。空方格退化為 n! 乘錯排數，可作獨立核對。'],
        '讀方格 O(n²)，容斥 O(n²)，階乘及反階乘 O(n+log MOD)。輸入方格 O(n²)，額外陣列 O(n)。全部運算模 10^9+7。',
        '不是隨便補兩個排列：兩者不能落在同格。固定字母產生的禁格只有在另一字母的列與欄都自由時才需要納入 p 或 q。',
        ('展示例 n=2 空方格的容斥',[
            ('沒有強制碰撞','a=b=R=C=2，p=q=0，兩排列獨立有 2!²=4。',['k=0','4'],[1],[['k','0'],['項值','4']]),
            ('一個碰撞格','選格 C(2,1)²=4，兩邊剩餘皆 1!，扣掉 4。',['k=1','-4'],[1],[['k','1'],['累計','0']]),
            ('兩個碰撞格','完整匹配有 2! 個，加回 2，答案為 2。',['k=2','+2','答案2'],[2],[['k','2'],['答案','2']])]),
        r'''import sys

MOD = 1000000007
it = iter(sys.stdin.buffer.read().split())
n = int(next(it))
grid = [next(it) for _ in range(n)]
ra, ca, rb, cb = ([False]*n for _ in range(4))
for r,row in enumerate(grid):
    for c,x in enumerate(row):
        if x == 65: ra[r] = ca[c] = True
        elif x == 66: rb[r] = cb[c] = True
a, b = n-sum(ra), n-sum(rb)
R = sum(not ra[i] and not rb[i] for i in range(n))
C = sum(not ca[i] and not cb[i] for i in range(n))
p = sum(x == 65 and not rb[r] and not cb[c] for r,row in enumerate(grid) for c,x in enumerate(row))
q = sum(x == 66 and not ra[r] and not ca[c] for r,row in enumerate(grid) for c,x in enumerate(row))
fact = [1]*(n+1)
for i in range(1,n+1): fact[i] = fact[i-1]*i%MOD
inv = [1]*(n+1)
inv[n] = pow(fact[n],MOD-2,MOD)
for i in range(n,0,-1): inv[i-1] = inv[i]*i%MOD
def choose(x,y): return fact[x]*inv[y]%MOD*inv[x-y]%MOD
cp = [choose(p,i)*(-1 if i%2 else 1) for i in range(p+1)]
cq = [choose(q,j)*(-1 if j%2 else 1) for j in range(q+1)]
answer = 0
for k in range(min(R,C)+1):
    u = sum(cq[j]*fact[a-k-j] for j in range(q+1))%MOD
    v = sum(cp[i]*fact[b-k-i] for i in range(p+1))%MOD
    coefficient = choose(R,k)*choose(C,k)%MOD*fact[k]%MOD
    answer = (answer+(-1 if k%2 else 1)*coefficient*u*v)%MOD
print(answer)''',r'''
ll power(ll a,ll b){ll r=1;for(;b;b>>=1,a=a*a%MOD)if(b&1)r=r*a%MOD;return r;}
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<string>g(n);for(auto &s:g)cin>>s;vector<int>ra(n),rb(n),ca(n),cb(n);
    for(int r=0;r<n;r++)for(int c=0;c<n;c++){if(g[r][c]=='A')ra[r]=ca[c]=1;if(g[r][c]=='B')rb[r]=cb[c]=1;}
    int a=n-accumulate(ra.begin(),ra.end(),0),b=n-accumulate(rb.begin(),rb.end(),0),R=0,C=0,p=0,q=0;
    for(int i=0;i<n;i++){R+=!ra[i]&&!rb[i];C+=!ca[i]&&!cb[i];}for(int r=0;r<n;r++)for(int c=0;c<n;c++){p+=g[r][c]=='A'&&!rb[r]&&!cb[c];q+=g[r][c]=='B'&&!ra[r]&&!ca[c];}
    vector<ll>f(n+1,1),inv(n+1,1);for(int i=1;i<=n;i++)f[i]=f[i-1]*i%MOD;inv[n]=power(f[n],MOD-2);for(int i=n;i;i--)inv[i-1]=inv[i]*i%MOD;
    auto choose=[&](int x,int y){return f[x]*inv[y]%MOD*inv[x-y]%MOD;};ll ans=0;
    for(int k=0;k<=min(R,C);k++){ll u=0,v=0;for(int j=0;j<=q;j++){ll term=choose(q,j)*f[a-k-j]%MOD;u=(u+(j%2?MOD-term:term))%MOD;}for(int i=0;i<=p;i++){ll term=choose(p,i)*f[b-k-i]%MOD;v=(v+(i%2?MOD-term:term))%MOD;}
        ll term=choose(R,k)*choose(C,k)%MOD*f[k]%MOD*u%MOD*v%MOD;ans=(ans+(k%2?MOD-term:term))%MOD;}
    cout<<ans<<'\n';}
''')

    add('b591','graphs','競賽圖 SCC 的唯一全序與有序組成',
        '先數強連通競賽圖，再用有序分塊動態規劃求全部 SCC 數量分布。',[
        '競賽圖縮成 SCC 後，任兩分量之間的邊必全指同一方向，否則兩個分量可互達而應合併。縮圖又沒有環，所以它是一個具有唯一拓撲順序的傳遞競賽圖。設 T[s]=2^(s(s−1)/2)、S[s] 為 s 個標號點的強連通競賽圖數。選唯一的第一個 SCC，若大小 r，選點 C(s,r)、內部 S[r]，它到剩餘點的邊方向全部固定，而剩下內部可任選 T[s−r]，故 S[s]=T[s]−Σ[r=1..s−1] C(s,r)S[r]T[s−r]。S[1]=1，S[2]=0。',
        '令 D[v][k] 為 v 個標號點、恰有 k 個 SCC 的競賽圖數。再按唯一第一分量分解：D[v][k]=Σr C(v,r)S[r]D[v−r][k−1]，初值 D[0][0]=1。為省去每次轉移的組合數，改保存 E[v][k]=D[v][k]/v!、w[r]=S[r]/r!，得到 E[v][k]=Σr w[r]E[v−r][k−1]。因所有分量順序唯一，不再乘 k! 或除 k!。',
        '按 k 逐層做卷積，v 至少為 k、r 至多為 v−k+1，每層只需前一層。輸出 n! E[n][k]。S[r]=0 的大小（例如 r=2）可以跳過，但不能把單點分量漏掉。模數是質數且 n<MOD，所以階乘都有反元素，這個除法在模運算下合法。'],
        '強連通數預算 O(n²)，分布 DP O(n³)，滾動層、階乘及 S 陣列 O(n) 空間；讀入僅一個 n。',
        'SCC 間不是任意選邊；一旦拓撲順序確定，跨分量的全部邊就被固定。不同 SCC 的標號選擇須用組合數或等價的階乘正規化。',
        ('教學例 n=3 的全部 8 個競賽圖',[
            ('求 S[1],S[2]','單點強連通，兩點必只有單向可達。',['S1=1','S2=0'],[0,1],[['S[1]','1'],['S[2]','0']]),
            ('求 S[3]','T3=8，第一分量為單點的 3×T2=6，其餘項為 0，所以 S3=2。',['8','-6','2'],[2],[['S[3]','2'],['有向三角形','2']]),
            ('分布','一分量有兩個有向環，兩分量不可能，三個單點有 3!=6 個順序。',['k1:2','k2:0','k3:6'],[0,1,2],[['總和','8'],['輸出','2,0,6']])]),
        r'''import sys

MOD = 1000000007
n = int(sys.stdin.buffer.read())
fact = [1]*(n+1)
for i in range(1,n+1): fact[i] = fact[i-1]*i%MOD
inv = [1]*(n+1)
inv[n] = pow(fact[n],MOD-2,MOD)
for i in range(n,0,-1): inv[i-1] = inv[i]*i%MOD
total = [pow(2,i*(i-1)//2,MOD) for i in range(n+1)]
strong = [0]*(n+1)
for v in range(1,n+1):
    subtract = 0
    for r in range(1,v):
        subtract += fact[v]*inv[r]%MOD*inv[v-r]%MOD*strong[r]%MOD*total[v-r]
    strong[v] = (total[v]-subtract)%MOD
weights = [(r,strong[r]*inv[r]%MOD) for r in range(1,n+1) if strong[r]]
previous = [0]*(n+1)
previous[0] = 1
out = []
for k in range(1,n+1):
    current = [0]*(n+1)
    for v in range(k,n+1):
        value = 0
        for r,w in weights:
            if r > v-k+1: break
            value += w*previous[v-r]
        current[v] = value%MOD
    out.append(str(fact[n]*current[n]%MOD))
    previous = current
print('\n'.join(out))''',r'''
ll power(ll a,ll b){ll r=1;for(;b;b>>=1,a=a*a%MOD)if(b&1)r=r*a%MOD;return r;}
int main(){int n;cin>>n;vector<ll>f(n+1,1),inv(n+1,1),t(n+1),s(n+1);for(int i=1;i<=n;i++)f[i]=f[i-1]*i%MOD;inv[n]=power(f[n],MOD-2);for(int i=n;i;i--)inv[i-1]=inv[i]*i%MOD;for(int i=0;i<=n;i++)t[i]=power(2,1LL*i*(i-1)/2);
    for(int v=1;v<=n;v++){s[v]=t[v];for(int r=1;r<v;r++)s[v]=(s[v]-f[v]*inv[r]%MOD*inv[v-r]%MOD*s[r]%MOD*t[v-r]%MOD+MOD)%MOD;}
    vector<pair<int,ll>>weights;for(int r=1;r<=n;r++)if(s[r])weights.push_back({r,s[r]*inv[r]%MOD});vector<ll>prev(n+1),cur(n+1);prev[0]=1;
    for(int k=1;k<=n;k++){fill(cur.begin(),cur.end(),0);for(int v=k;v<=n;v++){ll value=0;for(auto [r,w]:weights){if(r>v-k+1)break;value=(value+w*prev[v-r])%MOD;}cur[v]=value;}cout<<f[n]*cur[n]%MOD<<'\n';swap(prev,cur);}}
''','Python 使用完整 O(n³) 演算法與滾動層，n=500 約兩千萬個卷積項；把逐項取模延至每個係數完成可降低成本，但 1 秒仍不保證。建議 C++17 作正式滿規模提交，Python 的最大測試僅提供本機效能證據。')

    add('b592','number-theory','選環點、根森林與第一類 Stirling 數',
        '用 O(n²) 時間、O(n) 額外空間計算 n≤5000 的函數圖連通分量分布。',[
        '每個函數圖分量恰含一個有向環。先選全部 m 個環上節點，有 C(n,m) 種；這些節點的環邊形成一個排列，恰有 k 個環的排列數是無號第一類 Stirling 數 c(m,k)。其餘節點必形成朝這 m 個根流入的森林，且每棵樹只含一個根。環與森林的分解唯一，故分量數正好等於排列環數。',
        '固定 m 個根，m<n 時根森林數為 m n^(n−m−1)。可用 [Chaiken 的 all-minors matrix-tree theorem 原論文](https://doi.org/10.1137/0603033) 的固定根森林計數證明：刪根後的完全圖 Laplacian 子矩陣為 nI−J，階數 n−m；其特徵值為 m 一次、n 共 n−m−1 次，行列式即上述公式。m=n 時沒有非根，空行列式為 1，必須獨立處理，不能算負次方。這是本課明示使用的外部定理。',
        '因此答案 Ans[k]=Σ[m=k..n] C(n,m)c(m,k)F(n,m)，F(n,n)=1，其餘 F(n,m)=m n^(n−m−1)。Stirling 遞推 c(m,k)=c(m−1,k−1)+(m−1)c(m−1,k)：新元素獨立成一環，或插進舊排列的 m−1 個環邊位置。由大 k 往小原地更新一列，就能立即乘本列權重累加所有答案，不需 n² 記憶體。先預算 n 的冪及階乘、反階乘，總計 O(n²)；每個 m 都完整涵蓋到 n，沒有截斷 5000 的限制。'],
        '時間 O(n²+log MOD)，額外空間 O(n)：Stirling 一列、答案、階乘、反階乘、冪表。所有結果模 10^9+7。',
        '不能只數排列：非環節點還有根森林的連接方式。m=n 的森林數是 1；原地 Stirling 更新必須倒序，並在每列結束把 c(m,0) 清零。',
        ('展示例 n=2 的環點分解',[
            ('m=1','選根有 2 種，每個固定根的森林只有另一點指向根，所以貢獻 2 到 k=1。',['根1','根2','k1+=2'],[2],[['m','1'],['森林數','1']]),
            ('m=2','沒有非環節點；兩個排列為一個二環或兩個自環，分別貢獻 1 到 k=1、k=2。',['(12)','(1)(2)'],[0,1],[['c(2,1)','1'],['c(2,2)','1']]),
            ('累加','恰一個分量有 3 種，兩個分量只有兩個自環 1 種，總和 4=2²。',['k1=3','k2=1'],[0,1],[['總和','4'],['輸出','3,1']])]),
        r'''import sys

MOD = 1000000007
n = int(sys.stdin.buffer.read())
fact = [1]*(n+1)
for i in range(1,n+1): fact[i] = fact[i-1]*i%MOD
inv = [1]*(n+1)
inv[n] = pow(fact[n],MOD-2,MOD)
for i in range(n,0,-1): inv[i-1] = inv[i]*i%MOD
powers = [1]*(n+1)
for i in range(1,n+1): powers[i] = powers[i-1]*n%MOD
stirling = [0]*(n+1)
stirling[0] = 1
answer = [0]*(n+1)
for m in range(1,n+1):
    forest = 1 if m == n else m*powers[n-m-1]%MOD
    weight = fact[n]*inv[m]%MOD*inv[n-m]%MOD*forest%MOD
    for k in range(m,0,-1):
        value = (stirling[k-1]+(m-1)*stirling[k])%MOD
        stirling[k] = value
        answer[k] = (answer[k]+weight*value)%MOD
    stirling[0] = 0
print('\n'.join(map(str,answer[1:])))''',r'''
ll power(ll a,ll b){ll r=1;for(;b;b>>=1,a=a*a%MOD)if(b&1)r=r*a%MOD;return r;}
int main(){int n;cin>>n;vector<ll>f(n+1,1),inv(n+1,1),powers(n+1,1),stirling(n+1),ans(n+1);for(int i=1;i<=n;i++){f[i]=f[i-1]*i%MOD;powers[i]=powers[i-1]*n%MOD;}inv[n]=power(f[n],MOD-2);for(int i=n;i;i--)inv[i-1]=inv[i]*i%MOD;stirling[0]=1;
    for(int m=1;m<=n;m++){ll forest=m==n?1:m*powers[n-m-1]%MOD;ll weight=f[n]*inv[m]%MOD*inv[n-m]%MOD*forest%MOD;for(int k=m;k>=1;k--){stirling[k]=(stirling[k-1]+(m-1)*stirling[k])%MOD;ans[k]=(ans[k]+weight*stirling[k])%MOD;}stirling[0]=0;}for(int k=1;k<=n;k++)cout<<ans[k]<<'\n';}
''','Python 完整執行 n=5000 的約 1.25×10^7 次 Stirling/答案更新，無需 O(n²) 記憶體；但每次有大整數乘法與模運算，1 秒限制仍可能超時，正式提交建議 C++17。本機滿規模測試會核對總數及分布邊界，這些部分證書不能代替全部 5000 個桶的獨立驗算。')

    (P/'hard-562-607-lessons.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def robot_oracle(moves):
    # Unit expansion is independent of the submitted segment sweep. With integer
    # coordinates, non-collinear first crossings are integer positions. Reversal
    # is handled before expansion to model the continuous overlap at distance 0.
    visited = {(0,0)}
    vectors = {'R':(1,0),'L':(-1,0),'U':(0,1),'D':(0,-1)}
    x = y = distance = 0
    previous = None
    for direction,length in moves:
        dx,dy = vectors[direction]
        if previous and (dx,dy) == (-previous[0],-previous[1]):
            return distance
        previous = (dx,dy)
        for _ in range(length):
            x += dx; y += dy; distance += 1
            if (x,y) in visited: return distance
            visited.add((x,y))
    return distance


def rectangle_oracle(grid,k,border=False):
    n = len(grid)
    answer = [0]*k if border else 0
    for top in range(n):
        for bottom in range(top,n):
            for left in range(n):
                for right in range(left,n):
                    letters = {grid[r][c] for r in range(top,bottom+1) for c in range(left,right+1)
                               if not border or r in (top,bottom) or c in (left,right)}
                    if border:
                        if len(letters) == 1: answer[ord(next(iter(letters)))-65] += 1
                    elif len(letters) == k: answer += 1
    return '\n'.join(map(str,answer)) if border else str(answer)


@functools.lru_cache(None)
def permutations(n):
    return list(itertools.permutations(range(n)))


def completion_oracle(grid):
    n = len(grid)
    fixed = {letter:[(r,c) for r in range(n) for c in range(n) if grid[r][c] == letter] for letter in 'AB'}
    possibilities = {letter:[p for p in permutations(n) if all(p[r] == c for r,c in fixed[letter])]
                     for letter in 'AB'}
    return str(sum(all(a[r] != b[r] for r in range(n)) for a in possibilities['A'] for b in possibilities['B']))


@functools.lru_cache(None)
def tournament_oracle(n):
    pairs = list(itertools.combinations(range(n),2))
    answer = [0]*n
    for edges in range(1<<len(pairs)):
        reach = [1<<i for i in range(n)]
        for bit,(a,b) in enumerate(pairs):
            if edges >> bit & 1: reach[a] |= 1<<b
            else: reach[b] |= 1<<a
        for mid in range(n):
            for a in range(n):
                if reach[a] >> mid & 1: reach[a] |= reach[mid]
        components = 0
        unseen = set(range(n))
        while unseen:
            a = min(unseen)
            unseen -= {b for b in unseen if reach[a] >> b & 1 and reach[b] >> a & 1}
            components += 1
        answer[components-1] += 1
    return '\n'.join(map(str,answer))


@functools.lru_cache(None)
def functional_oracle(n):
    answer = [0]*n
    for image in itertools.product(range(n),repeat=n):
        parent = list(range(n))
        def find(x):
            while parent[x] != x:
                x = parent[x]
            return x
        for a,b in enumerate(image):
            parent[find(a)] = find(b)
        count = len({find(x) for x in range(n)})
        answer[count-1] += 1
    return '\n'.join(map(str,answer))


def make_checks():
    checks = []
    rng = random.Random(568569573578590591592)
    def add(code,data,expected,reason):
        checks.append(dict(code=code,input=data,output=str(expected),reason=reason))
    def robot(moves,reason):
        data = str(len(moves))+'\n'+''.join(f'{d} {x}\n' for d,x in moves)
        add('b568',data,robot_oracle(moves),reason)
    robot([('R',3),('L',2)],'連續反向：在距離3處立即停止，不多走整數一格。')
    robot([('R',3),('R',2),('L',1)],'同向合併後反向；不可把合併分界當重訪。')
    robot([('U',2),('R',3),('D',1),('L',5),('U',2)],'官方公開範例：獨立單位展開得到9。')
    robot([('R',3),('U',2),('L',5),('D',2),('R',5)],'從起點外側沿第一段同一直線返回原點，須處理共線碰撞。')
    robot([('R',4),('U',4),('L',2),('D',6),('L',1),('R',1)],'早期途中交叉優先於後方的立即反向。')
    for _ in range(110):
        robot([(rng.choice('UDLR'),rng.randint(1,5)) for _ in range(rng.randint(1,18))],
              '小座標單位展開的訪問集合；額外獨立處理連續反向的零距離重疊。')
    # More non-reversing paths force the geometric query instead of trivial truncation.
    for _ in range(35):
        directions = [rng.choice('UDLR')]
        for _ in range(16):
            directions.append(rng.choice('UD' if directions[-1] in 'LR' else 'LR'))
        robot([(d,rng.randint(1,7)) for d in directions], '連續直角轉向，強迫處理端點或段內交叉。')
    sg = [0]*5001
    for n in range(3,len(sg)):
        options = {sg[a]^sg[n-a] for a in range(1,(n+1)//2)}
        value = 0
        while value in options: value += 1
        sg[n] = value
    assert [i for i in range(1,len(sg)) if sg[i] == 0] == LOSING
    add('b569','5000\n'+'\n'.join(map(str,range(1,5001))),
        '\n'.join('first' if sg[i] else 'second' for i in range(1,5001)),
        '獨立精確 mex/xor 計算1..5000，完整核對41個正零值；不把5000以後視為本機SG重算。')
    add('b569','6\n1221\n1222\n1223\n2000\n999999\n1000000',
        'first\nsecond\nfirst\nfirst\nfirst\nfirst',
        '1222邊界與上限；>5000 的判斷明確依賴 Flammenkamp 的有限計算紀錄，非獨立SG證明。')
    for n in [1,2]:
        for flat in itertools.product('AB',repeat=n*n):
            grid = [''.join(flat[r*n:(r+1)*n]) for r in range(n)]
            data = f'{n} 2\n'+'\n'.join(grid)
            add('b573',data,rectangle_oracle(grid,2),'窮舉小二色方格及全部上下左右界，直接集合字母。')
            add('b578',data,rectangle_oracle(grid,2,True),'窮舉小二色方格及全部矩形，直接讀完整邊界。')
    for _ in range(28):
        n,k = rng.randint(1,5),rng.randint(1,5)
        grid = [''.join(chr(65+rng.randrange(k)) for _ in range(n)) for _ in range(n)]
        data = f'{n} {k}\n'+'\n'.join(grid)
        add('b573',data,rectangle_oracle(grid,k),'直接枚舉全部矩形的字母集合，含缺席字母。')
        add('b578',data,rectangle_oracle(grid,k,True),'逐格檢查四條邊，含單列、單欄及單格。')
    for code in ['b573','b578']:
        grid = ['AAA','ABA','AAA']
        add(code,'3 3\n'+'\n'.join(grid),rectangle_oracle(grid,3,code=='b578'),
            '中心不同字母但完整A外框；C缺席，兩題條件不可混淆。')
    # Every n=2 partial grid satisfying the actual per-letter row/column promise.
    for flat in itertools.product('.AB',repeat=4):
        grid = [''.join(flat[:2]),''.join(flat[2:])]
        if any(sum(grid[r][c] == letter for c in range(2)) > 1 for r in range(2) for letter in 'AB'): continue
        if any(sum(grid[r][c] == letter for r in range(2)) > 1 for c in range(2) for letter in 'AB'): continue
        add('b590','2\n'+'\n'.join(grid),completion_oracle(grid),'全枚舉合法2×2部分方格，獨立枚舉兩排列補法。')
    for _ in range(32):
        n = rng.randint(3,5)
        grid = [['.']*n for _ in range(n)]
        cells = list(itertools.product(range(n),repeat=2)); rng.shuffle(cells)
        for r,c in cells:
            letter = rng.choice('.AB')
            if letter != '.' and all(grid[r][j] != letter for j in range(n)) and all(grid[i][c] != letter for i in range(n)):
                grid[r][c] = letter
        grid = [''.join(row) for row in grid]
        add('b590',str(n)+'\n'+'\n'.join(grid),completion_oracle(grid),'獨立枚舉A、B所有排列，檢查固定格及同格衝突，非容斥重算。')
    add('b590','3\nAB.\n.A.\n..B',0,'部分排列各自合法但剩餘A被迫與固定B衝突，必須輸出0。')
    for n in range(1,7):
        add('b591',str(n),tournament_oracle(n),'窮舉所有競賽圖邊方向，以傳遞閉包直接分SCC，完整分布。')
        add('b592',str(n),functional_oracle(n),'窮舉 n^n 個函數，以無向並查集計連通分量，完整分布。')
    return checks


def maximum_cases():
    def exact(want):
        return lambda output: output.split() == str(want).split()
    n = 500
    total_rectangles = (n*(n+1)//2)**2
    cases = [
        ('b568','monotone-100000','100000\n'+''.join(('R' if i%2 == 0 else 'U')+' 1000000\n' for i in range(100000)),exact(100000000000),
         '單調階梯，不重訪；100000指令、每段1000000。'),
        ('b568','late-collision-100000','100000\n'+('R 1\nU 1\n'*49999)+'L 49999\nD 49999\n',exact(199996),
         '49999個單調階梯後沿上界和左界返回原點；最後一段才首碰撞。'),
        ('b569','100000-upper-bound-queries','100000\n'+''.join(str(x)+'\n' for x in range(900001,1000001)),
         lambda out: out.split() == ['first']*100000,'依來源有限計算表核對最大t及最大n；不宣稱這100000筆是獨立重算SG。'),
        ('b573','cyclic-26-500','500 26\n'+(('ABCDEFGHIJKLMNOPQRSTUVWXYZ'*20)[:500]+'\n')*500,
         exact((475*476//2)*(500*501//2)),'每列相同週期26；欄寬至少26才全字母，獨立閉式。'),
        ('b573','one-letter-500','500 1\n'+('A'*500+'\n')*500,exact(total_rectangles),'全部矩形都合格；閉式 n²(n+1)²/4。'),
        ('b578','one-letter-500','500 26\n'+('A'*500+'\n')*500,
         lambda out: list(map(int,out.split())) == [total_rectangles]+[0]*25,'A的所有矩形都合格，其他字母缺席。'),
        ('b578','checkerboard-500','500 2\n'+''.join(('AB'*250 if r%2 == 0 else 'BA'*250)+'\n' for r in range(500)),
         lambda out: list(map(int,out.split())) == [125000,125000],'任意高度或寬度大於1的邊界都混色，所以只有單格。'),
    ]
    derangements = [1,0]
    for i in range(2,501): derangements.append((i-1)*(derangements[-1]+derangements[-2])%M)
    cases += [('b590','empty-500','500\n'+('.'*500+'\n')*500,
               exact(math.factorial(500)%M*derangements[500]%M),'A任選排列，B相對A是錯排：500! × !500。'),
              ('b590','partial-A-500','500\n'+''.join((''.join('A' if r == c and r < 250 else '.' for c in range(500)))+'\n' for r in range(500)),
               exact(math.factorial(250)%M*derangements[500]%M),'固定250個A後有250!個A補法；每個補法均有!500個B，亦測非平凡容斥。')]
    def tournament(out):
        a = list(map(int,out.split())); n = 500
        return (len(a) == n and sum(a)%M == pow(2,n*(n-1)//2,M) and a[-1] == math.factorial(n)%M
                and a[-2] == 0 and a[-3] == 2*math.comb(n,3)*math.factorial(n-2)%M)
    def functional(out):
        a = list(map(int,out.split())); n = 5000
        return (len(a) == n and sum(a)%M == pow(n,n,M) and a[-1] == 1
                and a[-2] == 3*math.comb(n,2)%M and a[-3] == (17*math.comb(n,3)+27*math.comb(n,4))%M)
    cases += [('b591','distribution-500','500\n',tournament,
               '部分證書：總數2^C(n,2)，n桶=n!，n−1桶=0，n−2桶=2*C(n,3)*(n−2)!；非全桶獨立證明。'),
              ('b592','distribution-5000','5000\n',functional,
               '部分證書：總數n^n，n桶=1，n−1桶=3*C(n,2)，n−2桶=17*C(n,3)+27*C(n,4)；非全桶獨立證明。')]
    return cases


def record_metadata(lessons_list,result):
    lesson_path = P/'hard-562-607-lessons.json'
    by_case = {}
    for row in result['cases']:
        by_case.setdefault((row['code'],row['name'],row['kind']),set()).add(row.get('outputSHA256'))
    result['crossLanguageExactOutputMatch'] = all(len(hashes) == 1 and None not in hashes for hashes in by_case.values())
    assert result['crossLanguageExactOutputMatch'], 'Cross-language output disagreement; inspect runtime evidence.'
    for lesson in lessons_list:
        code = lesson['code']
        timings = {language:max((r['seconds'] for r in result['cases'] if r['code']==code and r['kind']=='maximum' and r['language']==language),default=0)
                   for language in ['C++17','Python']}
        if 'performanceNote' in lesson:
            base = lesson['performanceNote'].split('本機 WSL 壓力測量：')[0]
            lesson['performanceNote'] = base+f"本機 WSL 壓力測量：C++17 最慢 {timings['C++17']:.3f} 秒、Python 最慢 {timings['Python']:.3f} 秒；資料形狀、完整輸出核對／部分證書區分及環境見 hard-562-607-results.json。"
    lesson_path.write_text(json.dumps(lessons_list,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result['lessonSHA256'] = hashlib.sha256(lesson_path.read_bytes()).hexdigest()
    result['verifierSHA256'] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    result['checksSHA256'] = hashlib.sha256((P/'hard-562-607-checks.json').read_bytes()).hexdigest()
    result['sourceSHA256'] = hashlib.sha256((P/'source.json').read_bytes()).hexdigest()
    result['testedProgramSHA256'] = {lesson['code']:{language:hashlib.sha256(lesson[field].encode()).hexdigest() for language,field in [('C++17','cpp'),('Python','python')]}
                                    for lesson in lessons_list}


def verify(selected=None):
    if sys.platform != 'linux': raise SystemExit('Runtime verification requires Linux/WSL; generated C++ executes only in /tmp.')
    lesson_path = P/'hard-562-607-lessons.json'
    lessons_list = json.loads(lesson_path.read_text(encoding='utf-8'))
    lessons = {l['code']:l for l in lessons_list}
    assert list(lessons) == CODES and len(lessons_list) == 7
    previous_result = None
    if selected:
        assert selected in CODES
        previous_result = json.loads((P/'hard-562-607-results.json').read_text(encoding='utf-8'))
        for code,lesson in lessons.items():
            if code == selected: continue
            for language,field in [('C++17','cpp'),('Python','python')]:
                assert previous_result['testedProgramSHA256'][code][language] == hashlib.sha256(lesson[field].encode()).hexdigest(), 'Other program changed; full verification required.'
    topics = {'basics','simulation','strings','sorting','search','greedy','dp','graphs','trees','data-structures','number-theory','geometry'}
    for code,lesson in lessons.items():
        assert lesson['topic'] in topics and len(lesson['explanation']) >= 2
        assert lesson['title'] == SOURCE[code]['title'].split('. ',1)[1]
        assert lesson['sampleInput'] == SOURCE[code]['samples'][0]['input']
        assert lesson['sampleOutput'] == SOURCE[code]['samples'][0]['output']
        assert len(lesson['trace']) >= 3
        for step in lesson['trace']:
            assert step['title'] and step['cells']
            assert all(isinstance(i,int) and 0 <= i < len(step['cells']) for i in step['active'])
            keys = [pair[0] for pair in step['variables']]
            assert len(keys) == len(set(keys))
            assert all(len(pair) == 2 and all(isinstance(x,str) for x in pair) for pair in step['variables'])
    checks = make_checks()
    (P/'hard-562-607-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    result = dict(lessonSHA256=hashlib.sha256(lesson_path.read_bytes()).hexdigest(),
                  environment=dict(python=sys.version,platform=sys.platform),
                  notes=['No official judge submissions or database writes.',
                         'All generated C++17 executables are compiled and run inside Linux /tmp.',
                         'Local maximum-case time is not an official 1-second acceptance guarantee; Python performanceNote fields apply.',
                         'Large distribution certificates check totals and selected boundary bins, not every bin independently.',
                         'Grundy finite-range reliance: Flammenkamp 0..2^35, SG zero count42 including0, last1222. Local exact SG recomputation only1..5000.',
                         'Robot reversal is interpreted from the continuous-point wording as zero extra distance; no official hidden test or submission used.'],
                  sources=[dict(code='b568',url='https://cses.fi/problemset/task/1742/',basis='Official continuous-point stopping statement; reversal interpretation explicitly identified.'),
                           dict(code='b569',url='https://wwwhomes.uni-bielefeld.de/achim/grundy.html',basis='Author finite computation frequency table through2^35: zero count42, last1222; not an infinite theorem.'),
                           dict(code='b592',url='https://doi.org/10.1137/0603033',basis='All-minors matrix-tree theorem for fixed-root forests.')],
                  cases=[],failures=[])
    if previous_result:
        result['cases'] = [r for r in previous_result['cases'] if r['code'] != selected]
        result['failures'] = [r for r in previous_result['failures'] if r['code'] != selected]
        result['selectiveVerification'] = dict(code=selected,otherProgramHashesVerifiedUnchanged=True)
    with tempfile.TemporaryDirectory(prefix='hard-cses-seven-',dir='/tmp') as temp:
        commands = {}
        for code,lesson in lessons.items():
            if selected and code != selected: continue
            cpp = Path(temp)/(code+'.cpp'); exe = Path(temp)/code
            cpp.write_text(lesson['cpp'],encoding='utf-8')
            p = subprocess.run(['g++','-std=c++17','-O2','-Wall','-Wextra',str(cpp),'-o',str(exe)],text=True,capture_output=True,timeout=120)
            assert p.returncode == 0, (code,p.stderr)
            py = Path(temp)/(code+'.py'); py.write_text(lesson['python'],encoding='utf-8')
            commands[code] = [('C++17',[str(exe)]),('Python',[sys.executable,str(py)])]
        def run_case(code,name,data,validate,reason,kind):
            for language,command in commands[code]:
                row = dict(code=code,language=language,name=name,kind=kind,inputBytes=len(data.encode()),reason=reason)
                start = time.monotonic()
                try:
                    p = subprocess.run(command,input=data,text=True,capture_output=True,timeout=90)
                    passed = p.returncode == 0 and validate(p.stdout)
                    row.update(seconds=round(time.monotonic()-start,6),passed=passed,outputSHA256=hashlib.sha256(p.stdout.encode()).hexdigest())
                    if not passed: row.update(stderr=p.stderr[-2000:],actual=p.stdout[:3000])
                except subprocess.TimeoutExpired:
                    row.update(seconds=round(time.monotonic()-start,6),passed=False,error='timeout90')
                result['cases'].append(row)
                if not row['passed']: result['failures'].append(row)
                if kind == 'maximum' or not row['passed']: print(json.dumps(row,ensure_ascii=False),flush=True)
        for code in CODES:
            if selected and code != selected: continue
            for i,sample in enumerate(SOURCE[code]['samples']):
                expected = sample['output'].split()
                run_case(code,f'public-sample-{i+1}',sample['input'],lambda out,e=expected:out.split()==e,'Exact source.json public sample.','sample')
            for i,check in enumerate(c for c in checks if c['code'] == code):
                expected = check['output'].split()
                run_case(code,f'oracle-{i+1}',check['input'],lambda out,e=expected:out.split()==e,check['reason'],'independent')
            print(f'{code}: samples and independent cases complete',flush=True)
        for code,name,data,validate,reason in maximum_cases():
            if selected and code != selected: continue
            run_case(code,name,data,validate,reason,'maximum')
    # Metadata-only update after all executions; tested program text is unchanged.
    record_metadata(lessons_list,result)
    result['summary'] = {code:{kind:sum(r['code']==code and r['kind']==kind for r in result['cases'])//2 for kind in ['sample','independent','maximum']} for code in CODES}
    result['passed'] = not result['failures']
    (P/'hard-562-607-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(passed=result['passed'],summary=result['summary']),ensure_ascii=False),flush=True)
    if result['failures']: raise SystemExit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--author',action='store_true')
    parser.add_argument('--refresh-metadata',action='store_true',help='Attach timings to unchanged, hash-verified tested lessons; no runtime rerun.')
    parser.add_argument('--only',choices=CODES,help='Rerun one program; retain earlier evidence only after verifying all other program hashes unchanged.')
    args = parser.parse_args()
    if args.author:
        author()
    elif args.refresh_metadata:
        path = P/'hard-562-607-lessons.json'
        result_path = P/'hard-562-607-results.json'
        result = json.loads(result_path.read_text(encoding='utf-8'))
        assert result['lessonSHA256'] == hashlib.sha256(path.read_bytes()).hexdigest(), 'Tested artifact changed; rerun verification.'
        record_metadata(json.loads(path.read_text(encoding='utf-8')),result)
        result['metadataNote'] = 'Added measured performance notes after runtime checks; original artifact hash verified, tested programs unchanged.'
        result_path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print('Updated metadata only; tested code unchanged.')
    else:
        verify(args.only)
