import { defineCpeLesson } from "@/lib/cpeLessonBuilder";

export const lessons = [
  defineCpeLesson("a844", {
    topic: "dp", level: "medium", concept: "無限背包・組合數計算",
    goal: "以面額為外層，計算不考慮排列順序的找零方法數。",
    explanation: [
      "令 ways[x] 表示只用目前已處理面額湊成 x 分的方法數。開始時 ways[0]=1，代表完全不拿硬幣；其他金額都無法湊成，設為 0。",
      "處理面額 c 時，金額由 c 遞增到上限，令 ways[x] += ways[x-c]。新增的組合就是在一個湊成 x-c 的組合上再加一枚 c。遞增掃描使同面額能使用多次；按面額分階段則使每種硬幣數量組合恰好被計算一次，不會把拿取順序當成新方法。",
      "先讀到 EOF，對所有查詢的最大金額預先建表，之後每筆只需查表。方法數需要 C++ 的 long long；Python 整數可直接使用。最後依方法數是否恰為 1 選擇單數或複數句型，0 分也要輸出單數句型。",
    ],
    complexity: "設最大查詢金額為 A、查詢數為 Q：時間 O(5A+Q)，空間 O(A+Q)。",
    pitfall: "將金額放外層會把不同排列重複計算；ways[0] 必須是 1。輸出的 is/are、way/ways 與句點都不可省略。",
    traceLabel: "示意：用 1、5 分硬幣湊出 6 分",
    trace: [
      { title: "空組合", description: "還沒有處理面額，只有 0 分有一種方法。", cells: ["0:1", "1:0", "2:0", "3:0", "4:0", "5:0", "6:0"], active: [0], variables: [["ways[0]", "1"]] },
      { title: "加入 1 分", description: "遞增更新後，每個金額都有全用 1 分硬幣的一種組合。", cells: ["0:1", "1:1", "2:1", "3:1", "4:1", "5:1", "6:1"], active: [1, 2, 3, 4, 5, 6], variables: [["面額 c", "1"], ["ways[6]", "1"]] },
      { title: "加入 5 分", description: "ways[5] 加上 ways[0]，ways[6] 加上 ways[1]；6 分共有六枚 1 分及一枚 5 分加一枚 1 分兩種。", cells: ["0:1", "1:1", "2:1", "3:1", "4:1", "5:2", "6:2"], active: [5, 6], variables: [["面額 c", "5"], ["ways[6]", "2"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    vector<int> queries;
    int n, maximum = 0;
    while (cin >> n) { queries.push_back(n); maximum = max(maximum, n); }
    vector<long long> ways(maximum + 1);
    ways[0] = 1;
    for (int coin : {1, 5, 10, 25, 50})
        for (int amount = coin; amount <= maximum; ++amount)
            ways[amount] += ways[amount - coin];
    for (int amount : queries) {
        if (ways[amount] == 1)
            cout << "There is only 1 way to produce " << amount << " cents change.\n";
        else
            cout << "There are " << ways[amount] << " ways to produce " << amount << " cents change.\n";
    }
}`,
    python: String.raw`import sys
queries = list(map(int, sys.stdin.buffer.read().split()))
maximum = max(queries, default=0)
ways = [0] * (maximum + 1)
ways[0] = 1
for coin in (1, 5, 10, 25, 50):
    for amount in range(coin, maximum + 1):
        ways[amount] += ways[amount - coin]
for amount in queries:
    count = ways[amount]
    if count == 1:
        print(f"There is only 1 way to produce {amount} cents change.")
    else:
        print(f"There are {count} ways to produce {amount} cents change.")`,
  }),
  defineCpeLesson("a845", {
    topic: "search", level: "easy", concept: "縮小枚舉・平方根反推",
    goal: "枚舉兩半的和，而不是枚舉全部 k 位字串。",
    explanation: [
      "設半段長度為 k/2，B=10^(k/2)。數字 v 的左右兩半分別是 v//B 與 v%B，題目要求它們的和 s 滿足 s²=v。因為 0≤v<B²，所以 0≤s<B。",
      "因此只要枚舉 s=0 到 B−1，計算 v=s²，再檢查 v//B+v%B 是否等於 s。每個答案必定有唯一的非負平方根 s，不會漏掉也不會重複；平方值隨 s 遞增，自然已按數值排序。八位數時只需枚舉一萬個候選，而不是一億個字串。",
      "位數 k 是輸出寬度，不是要求數值一定達到 10^(k−1)。因此 0、1 等值也可能是答案，輸出時必須補足前導零。資料讀到 EOF；相同位數的查詢可以快取枚舉結果。",
    ],
    complexity: "每種位數第一次查詢時間 O(10^(k/2))；其後只需輸出。空間為快取的答案數。",
    pitfall: "不可排除 00、0001 等含前導零的答案；不同查詢之間不加空白行。",
    traceLabel: "示意：兩位數，B=10",
    trace: [
      { title: "平方根為 0、1", description: "0²=0 且 0+0=0；1²=1 且 0+1=1，輸出必須是 00、01。", cells: ["s=0 → 00", "s=1 → 01"], active: [0, 1], variables: [["目前答案", "00, 01"]] },
      { title: "排除平方根 2", description: "2²=4，但左右兩半 0+4=4 不等於 2，所以 04 不是答案。", cells: ["v=04", "0+4=4", "s=2"], active: [1, 2], variables: [["是否接受", "否"]] },
      { title: "平方根為 9", description: "9²=81，8+1=9，因此加入 81；所有 s<10 都檢查後完成。", cells: ["00", "01", "81"], active: [2], variables: [["輸出順序", "由小到大"], ["候選總數", "10"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <iomanip>
#include <map>
#include <vector>
using namespace std;
int main() {
    map<int, vector<int>> cache;
    int k;
    while (cin >> k) {
        if (!cache.count(k)) {
            int base = 1;
            for (int i = 0; i < k / 2; ++i) base *= 10;
            auto &answers = cache[k];
            for (int s = 0; s < base; ++s) {
                int value = s * s;
                if (value / base + value % base == s) answers.push_back(value);
            }
        }
        for (int value : cache[k]) cout << setw(k) << setfill('0') << value << '\n';
    }
}`,
    python: String.raw`import sys
cache = {}
for k in map(int, sys.stdin.buffer.read().split()):
    if k not in cache:
        base = 10 ** (k // 2)
        cache[k] = [s * s for s in range(base)
                    if (s * s) // base + (s * s) % base == s]
    for value in cache[k]:
        print(f"{value:0{k}d}")`,
  }),
  defineCpeLesson("a846", {
    topic: "trees", level: "easy", concept: "堆疊・後進先出",
    goal: "用堆疊保存夢境巢狀順序，直接查詢最內層夢境。",
    explanation: [
      "進入新夢境後，先前所有層仍需保留，醒來時只離開最後進入的一層。這正是後進先出結構：堆疊從底到頂依序保存由外到內的夢境。空堆疊代表清醒。",
      "Sleep X 將 X 放到頂端；Kick 在非空時移除頂端，空時不做事；Test 在非空時輸出頂端名字，否則輸出指定句子。每種指令都維持堆疊等於目前夢境路徑的不變量，因此任何時候的查詢都正確。",
    ],
    complexity: "n 個指令的時間 O(n)，空間 O(n)；每次堆疊操作為攤銷 O(1)，另計名字讀寫長度。",
    pitfall: "Kick 必須先檢查空堆疊；只有 Test 會輸出。名字的大小寫不可轉換。",
    traceLabel: "示意：Sleep Dom、Sleep Ari、Kick、Kick、Test",
    trace: [
      { title: "第一層夢境", description: "Sleep Dom 把 Dom 放進空堆疊，此時 Test 會得到 Dom。", cells: ["Dom（頂端）"], active: [0], variables: [["深度", "1"]] },
      { title: "進入更深一層", description: "Sleep Ari 保留 Dom 並把 Ari 放到頂端，目前位於 Ari 的夢。", cells: ["Dom", "Ari（頂端）"], active: [1], variables: [["深度", "2"], ["Test", "Ari"]] },
      { title: "逐層離開", description: "第一次 Kick 回到 Dom，第二次 Kick 清空堆疊；之後 Test 輸出 Not in a dream。", cells: ["Ari 離開", "Dom 離開", "清醒"], active: [2], variables: [["深度", "0"], ["Test", "Not in a dream"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;
int main() {
    int n; cin >> n;
    vector<string> dreams;
    while (n--) {
        string command; cin >> command;
        if (command == "Sleep") {
            string name; cin >> name; dreams.push_back(name);
        } else if (command == "Kick") {
            if (!dreams.empty()) dreams.pop_back();
        } else if (command == "Test") {
            cout << (dreams.empty() ? "Not in a dream" : dreams.back()) << '\n';
        }
    }
}`,
    python: String.raw`import sys
read = sys.stdin.readline
n = int(read())
dreams = []
for _ in range(n):
    command = read().split()
    if command[0] == "Sleep":
        dreams.append(command[1])
    elif command[0] == "Kick":
        if dreams:
            dreams.pop()
    elif command[0] == "Test":
        print(dreams[-1] if dreams else "Not in a dream")`,
  }),
  defineCpeLesson("a847", {
    topic: "basics", level: "easy", concept: "頻率表・相異次數檢查",
    goal: "只比較有出現的字母頻率，判斷是否至少兩種且全部互不相同。",
    explanation: [
      "先統計單字中每個字母的出現次數，再取出大於 0 的頻率。沒有出現的字母不參與條件，否則許多相同的 0 會把合法單字誤判為不合法。",
      "設出現過的字母數為 d。cool word 需要 d≥2，而且這 d 個頻率的集合大小也必須是 d。集合大小變小就表示至少兩種字母有相同次數。逐字判定後累計本組合法單字數，讀到 EOF 才停止，組號跨組持續遞增。",
    ],
    complexity: "設所有單字總長度為 L、單字數為 W：時間 O(L+26W)，每個單字額外空間 O(26)。",
    pitfall: "只有一種字母的單字不合法；頻率相同但字母不同仍違反條件。每組要重設答案，但 Case 組號不可重設。",
    traceLabel: "範例第一組：ada 與 bbacccd",
    trace: [
      { title: "統計 ada", description: "a 出現 2 次、d 出現 1 次，兩種字母且次數互異，因此合法。", cells: ["a:2", "d:1"], active: [0, 1], variables: [["不同字母", "2"], ["合法單字數", "1"]] },
      { title: "統計 bbacccd", description: "b:2、a:1、c:3、d:1，其中 a 和 d 的頻率都為 1，不合法。", cells: ["a:1", "b:2", "c:3", "d:1"], active: [0, 3], variables: [["不同字母", "4"], ["不同頻率", "3"]] },
      { title: "輸出第一組", description: "兩個單字中恰有一個合法，輸出 Case 1: 1。", cells: ["ada：合法", "bbacccd：不合法"], active: [0], variables: [["Case", "1"], ["答案", "1"]] },
    ],
    cpp: String.raw`#include <iostream>
#include <string>
#include <set>
using namespace std;
int main() {
    int n, caseNumber = 0;
    while (cin >> n) {
        int answer = 0;
        while (n--) {
            string word; cin >> word;
            int counts[26] = {};
            for (char ch : word) ++counts[ch - 'a'];
            int distinct = 0;
            set<int> frequencies;
            for (int count : counts) if (count) { ++distinct; frequencies.insert(count); }
            if (distinct >= 2 && (int)frequencies.size() == distinct) ++answer;
        }
        cout << "Case " << ++caseNumber << ": " << answer << '\n';
    }
}`,
    python: String.raw`import sys
from collections import Counter
tokens = iter(sys.stdin.buffer.read().split())
case_number = 0
for token in tokens:
    n = int(token)
    answer = 0
    for _ in range(n):
        frequencies = list(Counter(next(tokens)).values())
        if len(frequencies) >= 2 and len(set(frequencies)) == len(frequencies):
            answer += 1
    case_number += 1
    print(f"Case {case_number}: {answer}")`,
  }),
];
