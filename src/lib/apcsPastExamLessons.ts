import type { ApcsLesson } from "@/lib/apcsCourseLessons";
import { lessonsPart1 } from "@/lib/apcsPastExamBatches/part1";
import { lessonsPart2 } from "@/lib/apcsPastExamBatches/part2";
import { lessonsPart3 } from "@/lib/apcsPastExamBatches/part3";
import { lessonsPart4 } from "@/lib/apcsPastExamBatches/part4";
import { lessonsPart5 } from "@/lib/apcsPastExamBatches/part5";
import { lessonsPart6 } from "@/lib/apcsPastExamBatches/part6";

const introductoryLessons: Record<string, ApcsLesson> = {
  a449: {
    code: "a449",
    concept: "週期模擬・邊界判斷",
    goal: "用餘數定位每個人到達時的燈號，再累加需要等待的時間。",
    explanation: [
      "綠燈 a 秒、紅燈 b 秒構成長度 a+b 的週期。騎完一圈花 t 秒的人，到達時刻在週期中的位置是 t % (a+b)。",
      "餘數小於 a 表示綠燈，不用等；餘數大於或等於 a 表示紅燈，需等到週期結尾，所以等待時間是 a+b-餘數。等於 a 的瞬間已經是紅燈，這個等號不能漏掉。",
    ],
    complexity: "時間 O(n) ・ 空間 O(1)",
    pitfall: "紅燈開始的邊界 r=a 要等待完整 b 秒；新週期開始 r=0 則不用等。",
    sampleInput: "4 3\n3\n12 16 25",
    sampleOutput: "5",
    traceLabel: "週期位置 / 等待秒數",
    trace: [
      { title: "建立週期", description: "綠燈 4 秒、紅燈 3 秒，週期長度是 7 秒。", cells: ["0", "1", "2", "3", "4", "5", "6"], active: [0, 1, 2, 3], variables: [["週期", "7 秒"], ["等待總和", "0"]] },
      { title: "處理 12 秒", description: "12 % 7 = 5，位置 5 在紅燈區間，還要等 7-5=2 秒。", cells: ["0", "1", "2", "3", "4", "5", "6"], active: [5, 6], variables: [["目前", "12 秒"], ["等待總和", "2"]] },
      { title: "處理 16 秒", description: "16 % 7 = 2，位於綠燈，不增加等待時間。", cells: ["0", "1", "2", "3", "4", "5", "6"], active: [2], variables: [["目前", "16 秒"], ["等待總和", "2"]] },
      { title: "處理 25 秒", description: "25 % 7 = 4，剛好是紅燈開始，必須等 3 秒，最後答案為 5。", cells: ["0", "1", "2", "3", "4", "5", "6"], active: [4, 5, 6], variables: [["目前", "25 秒"], ["等待總和", "5"]] },
    ],
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, n;\n    cin >> a >> b >> n;\n\n    int total = 0;\n    for (int i = 0; i < n; ++i) {\n        int t;\n        cin >> t;\n        int r = t % (a + b);\n        if (r >= a) total += a + b - r;\n    }\n\n    cout << total << '\\n';\n}`,
    python: `a, b = map(int, input().split())\nn = int(input())\ntimes = list(map(int, input().split()))\n\ntotal = 0\nfor t in times:\n    r = t % (a + b)\n    if r >= a:\n        total += a + b - r\n\nprint(total)`,
  },
  a455: {
    code: "a455",
    concept: "由右往左掃描・交錯累加",
    goal: "把最多 1000 位的整數當字串讀取，依位數奇偶累加數字。",
    explanation: [
      "題目從個位數開始編第 1 位，因此最右邊字元屬於 A，往左一位屬於 B，接著交替。字串索引從右側算起為 0、1、2⋯，索引為偶數的位置加進 A。",
      "輸入可能有 1000 位，遠超過整數型別。逐字元轉成數字即可，不需要把整個數字轉成整數。最後輸出兩個總和的絕對差。",
    ],
    complexity: "時間 O(L) ・ 空間 O(L)",
    pitfall: "奇偶要從最右端開始計算；若從字串左端直接用索引奇偶，偶數位數時會分錯組。",
    sampleInput: "263541",
    sampleOutput: "3",
    traceLabel: "字元（由右至左）",
    trace: [
      { title: "從個位數開始", description: "字串最右邊的 1 是第 1 位，加入 A。", cells: ["2", "6", "3", "5", "4", "1"], active: [5], variables: [["A", "1"], ["B", "0"]] },
      { title: "交替分類", description: "往左依序讀到 4、5、3、6、2，奇數位加 A，偶數位加 B。", cells: ["2", "6", "3", "5", "4", "1"], active: [1, 2, 3, 4], variables: [["A", "1+5+6=12"], ["B", "4+3=7"]] },
      { title: "輸出差值", description: "最左邊的 2 是第 6 位，加入 B；|A-B|=|12-9|=3。", cells: ["2", "6", "3", "5", "4", "1"], active: [0], variables: [["A", "12"], ["B", "9"], ["答案", "3"]] },
    ],
    cpp: `#include <iostream>\n#include <string>\n#include <cstdlib>\nusing namespace std;\n\nint main() {\n    string x;\n    cin >> x;\n\n    int a = 0, b = 0;\n    int position = 0;\n    for (int i = static_cast<int>(x.size()) - 1; i >= 0; --i, ++position) {\n        int digit = x[i] - '0';\n        if (position % 2 == 0) a += digit;\n        else b += digit;\n    }\n\n    cout << abs(a - b) << '\\n';\n}`,
    python: `x = input().strip()\na = 0\nb = 0\n\nfor position, ch in enumerate(reversed(x)):\n    digit = int(ch)\n    if position % 2 == 0:\n        a += digit\n    else:\n        b += digit\n\nprint(abs(a - b))`,
  },
  a457: {
    code: "a457",
    concept: "座標差分・方向狀態",
    goal: "把相鄰座標轉成東西南北方向，再比較方向變化統計轉彎。",
    explanation: [
      "每一段路只會水平或垂直。比較相鄰座標的 x、y 差，就能把路段分類成東、北、西、南其中一個方向。第一段從原點到第一個座標，題目保證向東。",
      "把方向編成循環順序 E=0、N=1、W=2、S=3。新方向減舊方向後對 4 取模：1 是左轉、3 是右轉、2 是掉頭、0 是直走。",
    ],
    complexity: "時間 O(n) ・ 空間 O(n)",
    pitfall: "方向差要做循環取模；例如從東轉南是右轉，不能把方向數字直接相減判斷。",
    sampleInput: "2\n2 0\n2 1",
    sampleOutput: "1 0 0",
    traceLabel: "路段方向",
    trace: [
      { title: "第一段向東", description: "原點 (0,0) 到 (2,0)，方向編碼為 E=0。", cells: ["起點", "(2,0)", "(2,1)"], active: [0, 1], variables: [["方向", "E"], ["左/右/掉頭", "0/0/0"]] },
      { title: "辨認下一段", description: "x 不變、y 增加，所以第二段向北，編碼 N=1。", cells: ["起點", "(2,0)", "(2,1)"], active: [1, 2], variables: [["前一段", "E=0"], ["下一段", "N=1"]] },
      { title: "分類轉向", description: "(1-0+4)%4=1，因此是左轉。", cells: ["起點", "(2,0)", "(2,1)"], active: [1, 2], variables: [["方向差", "1"], ["左/右/掉頭", "1/0/0"]] },
    ],
    cpp: `#include <iostream>\nusing namespace std;\n\nint direction(int x1, int y1, int x2, int y2) {\n    if (x2 > x1) return 0; // east\n    if (y2 > y1) return 1; // north\n    if (x2 < x1) return 2; // west\n    return 3;              // south\n}\n\nint main() {\n    int n;\n    cin >> n;\n    int x = 0, y = 0;\n    int previous = 0; // first segment is east\n    int left = 0, right = 0, turnAround = 0;\n\n    for (int i = 0; i < n; ++i) {\n        int nx, ny;\n        cin >> nx >> ny;\n        int next = direction(x, y, nx, ny);\n        int change = (next - previous + 4) % 4;\n        if (change == 1) ++left;\n        else if (change == 3) ++right;\n        else if (change == 2) ++turnAround;\n        previous = next;\n        x = nx; y = ny;\n    }\n\n    cout << left << ' ' << right << ' ' << turnAround << '\\n';\n}`,
    python: `n = int(input())\npoints = [tuple(map(int, input().split())) for _ in range(n)]\n\ndef direction(a, b):\n    x1, y1 = a\n    x2, y2 = b\n    if x2 > x1:\n        return 0  # east\n    if y2 > y1:\n        return 1  # north\n    if x2 < x1:\n        return 2  # west\n    return 3      # south\n\nprevious = 0  # first segment is east\nleft = right = turn_around = 0\ncurrent = (0, 0)\nfor point in points:\n    change = (direction(current, point) - previous) % 4\n    if change == 1:\n        left += 1\n    elif change == 3:\n        right += 1\n    elif change == 2:\n        turn_around += 1\n    previous = direction(current, point)\n    current = point\n\nprint(left, right, turn_around)`,
  },
  a433: {
    code: "a433",
    concept: "逐組取最佳・延後篩選",
    goal: "先從每組選最大值湊出總和，再依總和的整除條件輸出所選數字。",
    explanation: [
      "每組必須恰好選一個數字，而且目標是讓總和最大，因此每一組都獨立選該組最大值。先把這 N 個數加總得到 S。",
      "選擇完成後才檢查每個所選數是否能整除 S。即使同一數值出現多次，也要按原群組逐一輸出；若沒有任何數能整除 S，就輸出 -1。",
    ],
    complexity: "時間 O(NM) ・ 空間 O(N)",
    pitfall: "不要在選數字時就先做整除篩選；所有組的最大值確定後，才知道最後的 S。",
    sampleInput: "3 2\n1 5\n6 4\n1 1",
    sampleOutput: "12\n6 1",
    traceLabel: "每組最大值與總和",
    trace: [
      { title: "第一組", description: "第一組在 1、5 中選最大值 5。", cells: ["1", "5", "6", "4", "1", "1"], active: [0, 1], variables: [["選取", "5"], ["S", "5"]] },
      { title: "完成選擇", description: "第二、三組分別選 6、1，總和 S=5+6+1=12。", cells: ["1", "5", "6", "4", "1", "1"], active: [2, 3, 4, 5], variables: [["所選數字", "5, 6, 1"], ["S", "12"]] },
      { title: "依 S 篩選", description: "12 能被 6 與 1 整除；5 不能。依原群組順序輸出 6、1。", cells: ["5", "6", "1"], active: [1, 2], variables: [["S % 6", "0"], ["S % 1", "0"], ["答案", "6 1"]] },
    ],
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n, m;\n    cin >> n >> m;\n    vector<int> chosen(n);\n    int sum = 0;\n    for (int i = 0; i < n; ++i) {\n        for (int j = 0; j < m; ++j) {\n            int x; cin >> x;\n            if (j == 0 || x > chosen[i]) chosen[i] = x;\n        }\n        sum += chosen[i];\n    }\n    cout << sum << '\\n';\n\n    bool found = false;\n    for (int x : chosen) {\n        if (sum % x == 0) {\n            if (found) cout << ' ';\n            cout << x;\n            found = true;\n        }\n    }\n    if (!found) cout << -1;\n    cout << '\\n';\n}`,
    python: `n, m = map(int, input().split())\nchosen = []\nfor _ in range(n):\n    values = list(map(int, input().split()))\n    chosen.append(max(values))\n\ntotal = sum(chosen)\nprint(total)\nanswer = [x for x in chosen if total % x == 0]\nif answer:\n    print(*answer)\nelse:\n    print(-1)`,
  },
  a437: {
    code: "a437",
    concept: "排序・區間合併",
    goal: "先按左端點排序，再把重疊區間合併，只累加聯集長度。",
    explanation: [
      "若線段依左端點排序，下一段只可能與目前合併區間相接或在它右側。維護目前的 [left,right]，遇到下一段起點不大於 right，就延伸 right。",
      "若下一段起點大於 right，目前區間已結束，把 right-left 加入答案，再從新線段開始。最後別忘了把最後一段加入。",
    ],
    complexity: "時間 O(n log n) ・ 空間 O(n)",
    pitfall: "重疊部分只能算一次；必須先排序，並在迴圈結束後補上最後一段。",
    sampleInput: "5\n160 180\n150 200\n280 300\n300 330\n190 210",
    sampleOutput: "110",
    traceLabel: "排序後的線段",
    trace: [
      { title: "排序", description: "依左端點排序後，前幾段為 [150,200]、[160,180]、[190,210]。", cells: ["[150,200]", "[160,180]", "[190,210]", "[280,300]", "[300,330]"], active: [0], variables: [["目前區間", "[150,200]"], ["答案", "0"]] },
      { title: "合併重疊", description: "[160,180] 完全落在目前範圍內；[190,210] 將右界延長到 210。", cells: ["[150,200]", "[160,180]", "[190,210]", "[280,300]", "[300,330]"], active: [1, 2], variables: [["目前區間", "[150,210]"], ["答案", "0"]] },
      { title: "累計分離區間", description: "[280,300] 與前段分開，先加 210-150=60；接著 [300,330] 接上，最後再加 50。", cells: ["[150,200]", "[160,180]", "[190,210]", "[280,300]", "[300,330]"], active: [3, 4], variables: [["第一段長度", "60"], ["第二段長度", "50"], ["總長", "110"]] },
    ],
    cpp: `#include <algorithm>\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<pair<int, int>> segments(n);\n    for (auto& [left, right] : segments) cin >> left >> right;\n    sort(segments.begin(), segments.end());\n\n    long long total = 0;\n    int left = segments[0].first;\n    int right = segments[0].second;\n    for (int i = 1; i < n; ++i) {\n        auto [nextLeft, nextRight] = segments[i];\n        if (nextLeft <= right) right = max(right, nextRight);\n        else {\n            total += right - left;\n            left = nextLeft;\n            right = nextRight;\n        }\n    }\n    total += right - left;\n    cout << total << '\\n';\n}`,
    python: `n = int(input())\nsegments = [tuple(map(int, input().split())) for _ in range(n)]\nsegments.sort()\n\nleft, right = segments[0]\ntotal = 0\nfor next_left, next_right in segments[1:]:\n    if next_left <= right:\n        right = max(right, next_right)\n    else:\n        total += right - left\n        left, right = next_left, next_right\n\ntotal += right - left\nprint(total)`,
  },
  a445: {
    code: "a445",
    concept: "字串轉換・逐步套用操作",
    goal: "把每個操作寫成獨立轉換，依輸入順序更新字串。",
    explanation: [
      "操作 0 是每一對相鄰字元交換；操作 1 是將每對字元由小到大排列；操作 2 是把字串分成左右兩半後交錯取字。每個操作都維持字串長度不變。",
      "依序讀到哪個操作就立刻產生新的字串，再把新字串交給下一個操作。把三種轉換分開實作，較容易檢查索引與範例。",
    ],
    complexity: "時間 O(k·n) ・ 空間 O(n)",
    pitfall: "操作 2 是左半、右半交錯，不是將字串切成一字一字的奇偶位置；每次操作都使用前一步的結果。",
    sampleInput: "apcsntnu\n1\n2",
    sampleOutput: "anptcnsu",
    traceLabel: "每次操作後的字串",
    trace: [
      { title: "初始字串", description: "長度 8，左右各 4 個字元。", cells: ["a", "p", "c", "s", "n", "t", "n", "u"], active: [], variables: [["左半", "apcs"], ["右半", "ntnu"]] },
      { title: "交錯取字", description: "依序取左半第一字、右半第一字，再取兩邊第二字⋯。", cells: ["a", "p", "c", "s", "n", "t", "n", "u"], active: [0, 4, 1, 5], variables: [["前四字", "anpt"], ["後四字", "cnsu"]] },
      { title: "得到新字串", description: "合併交錯結果，輸出 anptcnsu。", cells: ["a", "n", "p", "t", "c", "n", "s", "u"], active: [], variables: [["操作結果", "anptcnsu"]] },
    ],
    cpp: `#include <algorithm>\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    int k;\n    cin >> s >> k;\n    while (k--) {\n        int op;\n        cin >> op;\n        string next = s;\n        if (op == 0) {\n            for (int i = 0; i < (int)s.size(); i += 2)\n                swap(next[i], next[i + 1]);\n        } else if (op == 1) {\n            for (int i = 0; i < (int)s.size(); i += 2)\n                if (next[i] > next[i + 1]) swap(next[i], next[i + 1]);\n        } else {\n            int half = s.size() / 2;\n            for (int i = 0; i < half; ++i) {\n                next[2 * i] = s[i];\n                next[2 * i + 1] = s[half + i];\n            }\n        }\n        s = next;\n    }\n    cout << s << '\\n';\n}`,
    python: `s = input().strip()\nk = int(input())\n\nfor _ in range(k):\n    op = int(input())\n    if op == 0:\n        chars = list(s)\n        for i in range(0, len(s), 2):\n            chars[i], chars[i + 1] = chars[i + 1], chars[i]\n        s = "".join(chars)\n    elif op == 1:\n        chars = list(s)\n        for i in range(0, len(s), 2):\n            chars[i:i + 2] = sorted(chars[i:i + 2])\n        s = "".join(chars)\n    else:\n        half = len(s) // 2\n        s = "".join(s[i] + s[half + i] for i in range(half))\n\nprint(s)`,
  },
  a435: {
    code: "a435",
    concept: "排列分解・走訪環",
    goal: "用 visited 陣列沿好友關係走訪，每走完一圈就找到一個小群體。",
    explanation: [
      "每個人恰好指向一位好友，而且每個編號恰好出現一次，所以好友關係是一個排列。排列中的每個連通部分必然是一個環。",
      "從尚未拜訪的人開始，沿著好友指標前進並標記 visited，直到回到已拜訪的人。這整段恰好是一個群體；再找下一個未拜訪的人即可。",
    ],
    complexity: "時間 O(n) ・ 空間 O(n)",
    pitfall: "在進入下一個人前標記目前節點，否則環走完後可能重複計數或無限迴圈。",
    sampleInput: "10\n4 7 2 9 6 0 8 1 5 3",
    sampleOutput: "4",
    traceLabel: "好友指標",
    trace: [
      { title: "從 0 開始", description: "沿好友關係 0→4→6→8→5→0，走回已拜訪的 0，一圈完成。", cells: ["0→4", "4→6", "6→8", "8→5", "5→0"], active: [0, 1, 2, 3, 4], variables: [["群體數", "1"], ["已拜訪", "0,4,5,6,8"]] },
      { title: "找下一個未拜訪者", description: "從 1 出發得到 1→7→1，是另一個環。", cells: ["0→4", "4→6", "6→8", "8→5", "5→0", "1→7", "7→1"], active: [5, 6], variables: [["群體數", "2"], ["已拜訪", "0,1,4,5,6,7,8"]] },
      { title: "完成所有環", description: "其餘人形成 2→2 與 3→9→3，總共有 4 個小群體。", cells: ["2→2", "3→9", "9→3"], active: [0, 1, 2], variables: [["群體數", "4"], ["所有人已拜訪", "是"]] },
    ],
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> friendOf(n);\n    for (int& x : friendOf) cin >> x;\n\n    vector<bool> visited(n, false);\n    int groups = 0;\n    for (int start = 0; start < n; ++start) {\n        if (visited[start]) continue;\n        ++groups;\n        int current = start;\n        while (!visited[current]) {\n            visited[current] = true;\n            current = friendOf[current];\n        }\n    }\n    cout << groups << '\\n';\n}`,
    python: `n = int(input())\nfriend_of = list(map(int, input().split()))\nvisited = [False] * n\ngroups = 0\n\nfor start in range(n):\n    if visited[start]:\n        continue\n    groups += 1\n    current = start\n    while not visited[current]:\n        visited[current] = True\n        current = friend_of[current]\n\nprint(groups)`,
  },
  a447: {
    code: "a447",
    concept: "逆向思考・反轉序列操作",
    goal: "從最後加密結果開始，倒序還原每一個字串置換。",
    explanation: [
      "每一層加密先視 1 的奇偶決定是否交換字串兩半，再依遮罩由左至右從字串兩端取字。要還原時，先反轉取字步驟：遮罩為 0 就把目前字元放回左端位置，為 1 就放回右端位置。",
      "完成放回後，如果遮罩中的 1 數量是奇數，再交換一次兩半。交換兩半是自己的反操作。加密有多層時，必須從最後一層一路倒退到第一層。",
    ],
    complexity: "時間 O(mn) ・ 空間 O(n)",
    pitfall: "兩個操作都要倒著想：遮罩逐字放回原位置，且多層遮罩的處理順序要反轉。",
    sampleInput: "1 5\n10110\nCABAD",
    sampleOutput: "BCAAD",
    traceLabel: "放回字元的位置",
    trace: [
      { title: "從最後結果開始", description: "遮罩 10110 的 1 有 3 個，為奇數；先記住最後還要反向交換兩半。", cells: ["1", "0", "1", "1", "0"], active: [0, 2, 3], variables: [["目前字串", "CABAD"], ["左右指標", "0 / 4"]] },
      { title: "依遮罩放回", description: "C 放右端、A 放左端、B 放右端、A 放右端、D 放左端，還原中間字串為 ADABC。", cells: ["1", "0", "1", "1", "0"], active: [0, 1, 2, 3, 4], variables: [["填入結果", "A D A B C"], ["左右指標", "2 / 2"]] },
      { title: "撤銷半段交換", description: "奇數個 1 表示加密時交換過兩半，再交換一次得到原字串 BCAAD。", cells: ["B", "C", "A", "A", "D"], active: [], variables: [["原始字串", "BCAAD"], ["已還原層數", "1"]] },
    ],
    cpp: `#include <algorithm>\n#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\n\nstring swapHalves(const string& s) {\n    int half = s.size() / 2;\n    if (s.size() % 2 == 0) return s.substr(half) + s.substr(0, half);\n    return s.substr(half + 1) + s.substr(half, 1) + s.substr(0, half);\n}\n\nint main() {\n    int m, n;\n    cin >> m >> n;\n    vector<string> masks(m);\n    for (string& mask : masks) cin >> mask;\n    string current;\n    cin >> current;\n\n    for (int layer = m - 1; layer >= 0; --layer) {\n        const string& mask = masks[layer];\n        string before(n, ' ');\n        int left = 0, right = n - 1;\n        for (int i = 0; i < n; ++i) {\n            if (mask[i] == '0') before[left++] = current[i];\n            else before[right--] = current[i];\n        }\n        current = before;\n        if (count(mask.begin(), mask.end(), '1') % 2 == 1)\n            current = swapHalves(current);\n    }\n    cout << current << '\\n';\n}`,
    python: `m, n = map(int, input().split())\nmasks = [input().strip() for _ in range(m)]\ncurrent = input().strip()\n\ndef swap_halves(s):\n    half = len(s) // 2\n    if len(s) % 2 == 0:\n        return s[half:] + s[:half]\n    return s[half + 1:] + s[half:half + 1] + s[:half]\n\nfor mask in reversed(masks):\n    before = [""] * n\n    left, right = 0, n - 1\n    for bit, char in zip(mask, current):\n        if bit == "0":\n            before[left] = char\n            left += 1\n        else:\n            before[right] = char\n            right -= 1\n    current = "".join(before)\n    if mask.count("1") % 2 == 1:\n        current = swap_halves(current)\n\nprint(current)`,
  },
  a379: {
    code: "a379",
    concept: "區間動態規劃・枚舉最後一次合併",
    goal: "把每段連續數字的最小合併成本記在 dp[l][r]，枚舉最後切分點。",
    explanation: [
      "合併只能選相鄰兩個數，因此處理完一段 [l,r] 時，最後一步必定把左半 [l,k] 和右半 [k+1,r] 合在一起。兩半各自先用最小成本合成一個數，再付一次 |左半總和−右半總和|。",
      "用 dp[l][r] 儲存把區間 l..r 合成一個數的最小成本。前綴和可以 O(1) 算出任一區間總和；枚舉所有 k 後取最小值。",
    ],
    complexity: "時間 O(n³) ・ 空間 O(n²)",
    pitfall: "切分點要讓左右兩段都非空；合併費用用兩段的總和差，不是原始相鄰元素差。",
    sampleInput: "4\n3 -1 2 5",
    sampleOutput: "5",
    traceLabel: "區間 dp[l][r]",
    trace: [
      { title: "單一元素", description: "一個數字不需要合併，所有長度 1 的區間成本都是 0。", cells: ["3", "-1", "2", "5"], active: [], variables: [["dp[i][i]", "0"], ["前綴和", "3, 2, 4, 9"]] },
      { title: "長度 2 的區間", description: "合併 3 與 -1 花 |3-(-1)|=4；合併 -1 與 2 花 3。", cells: ["3", "-1", "2", "5"], active: [0, 1, 2], variables: [["dp[0][1]", "4"], ["dp[1][2]", "3"]] },
      { title: "計算完整區間", description: "最佳順序先合併 3 和 -1（成本 4），再合併得到的 2 與原本的 2（成本 0），最後合併 4 和 5（成本 1），總成本 5。", cells: ["3", "-1", "2", "5"], active: [0, 1, 2, 3], variables: [["最佳切分", "[3,-1,2] | [5]"], ["dp[0][3]", "5"]] },
    ],
    cpp: `#include <algorithm>\n#include <cstdlib>\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<long long> prefix(n + 1);\n    for (int i = 0; i < n; ++i) {\n        long long x; cin >> x;\n        prefix[i + 1] = prefix[i] + x;\n    }\n    auto sum = [&](int l, int r) { return prefix[r + 1] - prefix[l]; };\n\n    const long long INF = (1LL << 60);\n    vector<vector<long long>> dp(n, vector<long long>(n, 0));\n    for (int length = 2; length <= n; ++length) {\n        for (int l = 0; l + length <= n; ++l) {\n            int r = l + length - 1;\n            dp[l][r] = INF;\n            for (int k = l; k < r; ++k) {\n                long long cost = dp[l][k] + dp[k + 1][r]\n                    + llabs(sum(l, k) - sum(k + 1, r));\n                dp[l][r] = min(dp[l][r], cost);\n            }\n        }\n    }\n    cout << dp[0][n - 1] << '\\n';\n}`,
    python: `n = int(input())\na = list(map(int, input().split()))\nprefix = [0]\nfor x in a:\n    prefix.append(prefix[-1] + x)\n\ndef range_sum(left, right):\n    return prefix[right + 1] - prefix[left]\n\ndp = [[0] * n for _ in range(n)]\nfor length in range(2, n + 1):\n    for left in range(n - length + 1):\n        right = left + length - 1\n        dp[left][right] = min(\n            dp[left][cut] + dp[cut + 1][right]\n            + abs(range_sum(left, cut) - range_sum(cut + 1, right))\n            for cut in range(left, right)\n        )\n\nprint(dp[0][n - 1])`,
  },
};

export const apcsPastExamLessons: Record<string, ApcsLesson> = { ...introductoryLessons };
for (const lesson of [
  ...lessonsPart1, ...lessonsPart2, ...lessonsPart3,
  ...lessonsPart4, ...lessonsPart5, ...lessonsPart6,
]) {
  if (apcsPastExamLessons[lesson.code]) {
    throw new Error(`Duplicate APCS lesson: ${lesson.code}`);
  }
  apcsPastExamLessons[lesson.code] = lesson;
}
