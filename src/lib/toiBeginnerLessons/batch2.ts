import { defineToiBeginnerLesson } from "@/lib/toiBeginnerLessonBuilder";
import type { ToiBeginnerLesson } from "@/lib/toiBeginnerLessonTypes";

// Per-problem lessons audited against the 2026-10-20 live statement snapshot.
export const lessons: ToiBeginnerLesson[] = [
  defineToiBeginnerLesson("a180", {
  "topic": "simulation",
  "concept": "電梯・逐段累計耗電",
  "goal": "從 1 樓出發，逐段依上升或下降計算耗電。",
  "explanation": [
    "current 初始為 1；依序讀取下一個樓層 x，用差值 x-current 判斷方向。",
    "差值非負時加上差值的 3 倍，負值時加上下降層數的 2 倍；同樓層加 0。",
    "每段結束都把 current 更新成 x，不能全部都跟 1 樓比較。"
  ],
  "complexity": "時間 O(N)，額外空間 O(1)（Python 輸入緩衝 O(N)）。",
  "pitfall": "起點是 1 樓；下降單價為 2，並非上升的 3。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n, cur = 1;\n    cin >> n;\n    long long ans = 0;\n    for (int i = 0, x; i < n; i++) {\n        cin >> x;\n        ans += (x >= cur ? 3LL * (x - cur) : 2LL * (cur - x));\n        cur = x;\n    }\n    cout << ans << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn = next(it)\ncurrent = 1\nenergy = 0\nfor _ in range(n):\n    x = next(it)\n    energy += (x-current)*3 if x >= current else (current-x)*2\n    current = x\nprint(energy)\n",
  "traceLabel": "電梯・逐段累計耗電",
  "trace": [
    {
      "title": "起始與上升",
      "description": "從 1 到 3 再到 7，耗電 6+12。",
      "cells": [
        "1→3",
        "3→7"
      ],
      "variables": [
        [
          "energy",
          "18"
        ],
        [
          "current",
          "7"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "下降與停留",
      "description": "7 到 2 耗電 10，2 到 2 耗電 0。",
      "cells": [
        "7→2",
        "2→2"
      ],
      "variables": [
        [
          "energy",
          "28"
        ],
        [
          "current",
          "2"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "最後上升",
      "description": "2 到 9 增加 21，輸出 49。",
      "cells": [
        "2→9",
        "49"
      ],
      "variables": [
        [
          "energy",
          "49"
        ],
        [
          "current",
          "9"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a181", {
  "topic": "read-calculate",
  "concept": "彗星列車・整數向上取整",
  "goal": "計算最小的 t，使 A×t 至少為 S。",
  "explanation": [
    "經過 t 秒後速度是 A×t，所以秒數是 S/A 向上取整。",
    "正整數向上取整可寫成 (S+A-1)//A，不必逐秒模擬。",
    "C++ 使用 long long 保存計算式；恰好整除時不多加一秒。"
  ],
  "complexity": "時間 O(1)，空間 O(1)。",
  "pitfall": "不是取最接近的整數，而是一定向上取整。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    long long a, s;\n    cin >> a >> s;\n    cout << (s + a - 1) / a << '\\n';\n}\n",
  "python": "a, s = map(int, input().split())\nprint((s+a-1)//a)\n",
  "traceLabel": "彗星列車・整數向上取整",
  "trace": [
    {
      "title": "讀取速度條件",
      "description": "每秒增加 17，目標速度 201。",
      "cells": [
        "A=17",
        "S=201"
      ],
      "variables": [
        [
          "A",
          "17"
        ],
        [
          "S",
          "201"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "檢查 11 秒",
      "description": "17×11=187，仍未達標。",
      "cells": [
        "187 < 201"
      ],
      "variables": [
        [
          "t",
          "11"
        ],
        [
          "speed",
          "187"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "檢查 12 秒",
      "description": "17×12=204，首次達標。",
      "cells": [
        "204 ≥ 201",
        "輸出 12"
      ],
      "variables": [
        [
          "t",
          "12"
        ],
        [
          "speed",
          "204"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a182", {
  "topic": "simulation",
  "concept": "洗牌・兩半交錯",
  "goal": "每回合使用新陣列，交錯放入前半與後半的牌。",
  "explanation": [
    "將目前的 N 張牌分為各 N/2 張的兩半，前半的第 i 張放到新陣列 2i。",
    "後半的第 i 張放到新陣列 2i+1；完成整回合後才取代原陣列。",
    "重複 M 回合，牌面可以重複，演算法只依位置移動。"
  ],
  "complexity": "時間 O(NM)，空間 O(N)。",
  "pitfall": "不可邊覆蓋舊陣列邊繼續讀取；每回合都從前半先取。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n, m;\n    cin >> n >> m;\n    vector<int> a(n);\n    for (int &x : a)\n        cin >> x;\n    while (m--) {\n        vector<int> b(n);\n        for (int i = 0; i < n / 2; i++) {\n            b[2 * i] = a[i];\n            b[2 * i + 1] = a[n / 2 + i];\n        }\n        a = b;\n    }\n    for (int i = 0; i < n; i++)\n        cout << (i ? \" \" : \"\") << a[i];\n    cout << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn, m = next(it), next(it)\na = [next(it) for _ in range(n)]\nfor _ in range(m):\n    b = []\n    for i in range(n//2):\n        b.extend((a[i], a[n//2+i]))\n    a = b\nprint(*a)\n",
  "traceLabel": "洗牌・兩半交錯",
  "trace": [
    {
      "title": "原始牌序",
      "description": "分成前五張與後五張。",
      "cells": [
        "11 22 33 44 55",
        "66 77 88 99 100"
      ],
      "variables": [
        [
          "回合",
          "0"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "第一次交錯",
      "description": "前半一張、後半一張依序取出。",
      "cells": [
        "11 66 22 77 33 88 44 99 55 100"
      ],
      "variables": [
        [
          "回合",
          "1"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "第二次交錯",
      "description": "重新分半後交錯，得到公開輸出。",
      "cells": [
        "11 88 66 44 22 99 77 55 33 100"
      ],
      "variables": [
        [
          "回合",
          "2"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a183", {
  "topic": "simulation",
  "concept": "帶動商機・同步更新",
  "goal": "用舊人數計算一天所有增加量，再一起更新。",
  "explanation": [
    "第一列以 0 結束，0 不屬於商店；其後的整數是天數。",
    "每家店當作影響來源：端點向唯一較少的鄰店增加自身人數的 10%；內部向每個較少的鄰店各增加 5%。",
    "next 先複製當天人數，所有比較與百分比都讀舊陣列，完成一天後替換；單店無鄰居便不增加。"
  ],
  "complexity": "店數 K、天數 N：時間 O(NK)，空間 O(K)。",
  "pitfall": "百分比取來源店的人數並各自捨去小數，相等不影響。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    vector<long long> a;\n    long long x;\n    while (cin >> x && x)\n        a.push_back(x);\n    int days;\n    cin >> days;\n    int k = (int)a.size();\n    while (days--) {\n        auto b = a;\n        for (int i = 0; i < k; i++) {\n            long long inc = a[i] / ((i == 0 || i == k - 1) ? 10 : 20);\n            for (int j : {i - 1, i + 1})\n                if (j >= 0 && j < k && a[i] > a[j])\n                    b[j] += inc;\n        }\n        a = b;\n    }\n    for (int i = 0; i < k; i++)\n        cout << (i ? \" \" : \"\") << a[i];\n    cout << '\\n';\n}\n",
  "python": "import sys\ndata = list(map(int, sys.stdin.read().split()))\nend = data.index(0)\na, days = data[:end], data[end+1]\nfor _ in range(days):\n    b = a.copy()\n    for i, value in enumerate(a):\n        inc = value // (10 if i == 0 or i == len(a)-1 else 20)\n        for j in (i-1, i+1):\n            if 0 <= j < len(a) and value > a[j]:\n                b[j] += inc\n    a = b\nprint(*a)\n",
  "traceLabel": "帶動商機・同步更新",
  "trace": [
    {
      "title": "今日人數",
      "description": "兩端影響比例 10%，內部影響比例 5%。",
      "cells": [
        "40",
        "12",
        "80",
        "15",
        "29"
      ],
      "variables": [
        [
          "天數",
          "0"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    {
      "title": "第一天後",
      "description": "第 2 店增加 4+4，第 4 店增加 4+2。",
      "cells": [
        "40",
        "20",
        "80",
        "21",
        "29"
      ],
      "variables": [
        [
          "天數",
          "1"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    {
      "title": "第二天後",
      "description": "條件仍相同，兩店再各增加 8 與 6。",
      "cells": [
        "40",
        "28",
        "80",
        "27",
        "29"
      ],
      "variables": [
        [
          "天數",
          "2"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4
      ]
    },
    {
      "title": "第三天後",
      "description": "仍使用第二天舊值比較，得到最後人數。",
      "cells": [
        "40",
        "36",
        "80",
        "33",
        "29"
      ],
      "variables": [
        [
          "天數",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a184", {
  "topic": "text",
  "concept": "拼字遊戲・標記已取卡片",
  "goal": "依目標順序，找最左邊尚未用掉的相同字母。",
  "explanation": [
    "以整行讀入 S 與 T，保留空字串行，再把 S 存成可修改的卡片陣列；對 T 的每個字母重新從位置 0 掃描。",
    "遇到第一張相同字母就記錄 i+1，將該張標成空白，並停止本次掃描。",
    "整次掃描沒有找到則輸出 X；其他卡片位置不變，大小寫分開比較。"
  ],
  "complexity": "時間 O(|S|+|T|+|S||T|)，空間 O(|S|+|T|)。",
  "pitfall": "移除不能讓卡片向左補位，也不能重用同一張卡。S 為空時每個目標字母都輸出 X；T 為空時只輸出換行，讀取時不可略過空行。",
  "cpp": "#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string s, t;\n    getline(cin, s);\n    getline(cin, t);\n    if (!s.empty() && s.back() == '\\r') s.pop_back();\n    if (!t.empty() && t.back() == '\\r') t.pop_back();\n    vector<string> ans;\n    for (char c : t) {\n        string v = \"X\";\n        for (int i = 0; i < (int)s.size(); i++)\n            if (s[i] == c) {\n                v = to_string(i + 1);\n                s[i] = ' ';\n                break;\n            }\n        ans.push_back(v);\n    }\n    for (int i = 0; i < (int)ans.size(); i++)\n        cout << (i ? \" \" : \"\") << ans[i];\n    cout << '\\n';\n}\n",
  "python": "s = list(input().rstrip(\"\\r\"))\nt = input().rstrip(\"\\r\")\nanswer = []\nfor c in t:\n    result = \"X\"\n    for i in range(len(s)):\n        if s[i] == c:\n            result = str(i+1)\n            s[i] = \" \"\n            break\n    answer.append(result)\nprint(*answer)\n",
  "traceLabel": "拼字遊戲・標記已取卡片",
  "trace": [
    {
      "title": "取出 B",
      "description": "bBaBca 的第一張大寫 B 在位置 2。",
      "cells": [
        "b",
        "空",
        "a",
        "B",
        "c",
        "a"
      ],
      "variables": [
        [
          "輸出前綴",
          "2"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    {
      "title": "取出兩張 a",
      "description": "依序使用原位置 3、6。",
      "cells": [
        "b",
        "空",
        "空",
        "B",
        "c",
        "空"
      ],
      "variables": [
        [
          "輸出前綴",
          "2 3 6"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    {
      "title": "完成 b 與 A",
      "description": "小寫 b 用位置 1；大寫 A 不存在。",
      "cells": [
        "空",
        "空",
        "空",
        "B",
        "c",
        "空"
      ],
      "variables": [
        [
          "輸出",
          "2 3 6 1 X"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a185", {
  "topic": "arrays",
  "concept": "評分系統・對位比對",
  "goal": "逐生逐題與標準答案比較，答對才加 S 分。",
  "explanation": [
    "先保存 N 個標準答案，再讀學生數 M。",
    "每位學生的分數重新設為 0，依題號比較 N 個答案。",
    "相同就加 S，錯誤加 0；每位學生完成後各輸出一行。"
  ],
  "complexity": "時間 O(NM)，空間 O(N)（Python 輸入緩衝 O(NM)）。",
  "pitfall": "答案要依位置比對，不是計算相同數字的總個數。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n, s, m;\n    cin >> n >> s;\n    vector<int> key(n);\n    for (int &x : key)\n        cin >> x;\n    cin >> m;\n    while (m--) {\n        int score = 0;\n        for (int i = 0, x; i < n; i++) {\n            cin >> x;\n            if (x == key[i])\n                score += s;\n        }\n        cout << score << '\\n';\n    }\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn, s = next(it), next(it)\nkey = [next(it) for _ in range(n)]\nm = next(it)\nfor _ in range(m):\n    score = 0\n    for correct in key:\n        if next(it) == correct:\n            score += s\n    print(score)\n",
  "traceLabel": "評分系統・對位比對",
  "trace": [
    {
      "title": "第一位學生",
      "description": "4 2 3 與 4 1 3 的第 1、3 題相同。",
      "cells": [
        "✓",
        "✗",
        "✓"
      ],
      "variables": [
        [
          "得分",
          "14"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "第二位學生",
      "description": "1 1 1 只有第 2 題相同。",
      "cells": [
        "✗",
        "✓",
        "✗"
      ],
      "variables": [
        [
          "得分",
          "7"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "第三位學生",
      "description": "4 1 3 全部答對，每題 7 分。",
      "cells": [
        "✓",
        "✓",
        "✓"
      ],
      "variables": [
        [
          "得分",
          "21"
        ],
        [
          "輸出",
          "14 / 7 / 21"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a186", {
  "topic": "grid",
  "concept": "定向越野・按字母排序座標",
  "goal": "收集實際出現的目標，排序後取前 N 個。",
  "explanation": [
    "輸入 W 行、每行 H 個字元，將非 0 格記錄為字母及其列行座標。",
    "按字母由小到大排序，字母不保證由 a 開始或連續。",
    "若目標不足 N 個，只輸出 Mission fail.；否則依序列出前 N 個座標。"
  ],
  "complexity": "目標數 K：時間 O(WH+K log K)，空間 O(K)（Python 緩衝 O(WH)）。",
  "pitfall": "座標從 0 開始，第一個數是輸入的列索引；不足時不能先輸出部分座標。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <utility>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int w, h, n;\n    cin >> w >> h >> n;\n    vector<pair<char, pair<int, int>>> v;\n    for (int r = 0; r < w; r++)\n        for (int c = 0; c < h; c++) {\n            char x;\n            cin >> x;\n            if (x != '0')\n                v.push_back({x, {r, c}});\n        }\n    sort(v.begin(), v.end());\n    if ((int)v.size() < n)\n        cout << \"Mission fail.\\n\";\n    else\n        for (int i = 0; i < n; i++)\n            cout << v[i].second.first << ' ' << v[i].second.second << '\\n';\n}\n",
  "python": "import sys\nit = iter(sys.stdin.read().split())\nw, h, n = int(next(it)), int(next(it)), int(next(it))\ntargets = []\nfor r in range(w):\n    for c in range(h):\n        ch = next(it)\n        if ch != \"0\":\n            targets.append((ch, r, c))\ntargets.sort()\nif len(targets) < n:\n    print(\"Mission fail.\")\nelse:\n    for _, r, c in targets[:n]:\n        print(r, c)\n",
  "traceLabel": "定向越野・按字母排序座標",
  "trace": [
    {
      "title": "掃描地圖",
      "description": "記下 q、b、a、z 的座標。",
      "cells": [
        "q:(0,0)",
        "b:(0,2)",
        "a:(1,0)",
        "z:(1,1)"
      ],
      "variables": [
        [
          "目標數",
          "4"
        ],
        [
          "需求",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "按字母排序",
      "description": "實際存在的順序為 a、b、q、z。",
      "cells": [
        "a:(1,0)",
        "b:(0,2)",
        "q:(0,0)",
        "z:(1,1)"
      ],
      "variables": [
        [
          "是否足夠",
          "是"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "取前三個",
      "description": "輸出 a、b、q 的座標。",
      "cells": [
        "1 0",
        "0 2",
        "0 0"
      ],
      "variables": [
        [
          "輸出筆數",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a187", {
  "topic": "simulation",
  "concept": "點餐系統・表格查詢",
  "goal": "用兩份名稱價格表處理點餐指令並累計。",
  "explanation": [
    "指令 1 與 2 後面還有一個品項編號，分別查套餐表與單點表。",
    "每筆訂單立即輸出正確名稱與價格，同時累加總金額；允許重複訂購。",
    "指令 0 不再讀編號，只輸出 Total: 和總金額並結束。"
  ],
  "complexity": "訂單數 Q：時間 O(Q)，表格空間 O(1)（Python 緩衝 O(Q)）。",
  "pitfall": "品名的大小寫和空格必須逐字保留；Total: 的冒號後有一個空白。",
  "cpp": "#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    vector<string> name[2] = {\n        {\"Medium Wac\", \"WChicken Nugget\", \"Geez Burger\", \"ButtMilk Crispy Chicken\",\n         \"Plastic Toy\"},\n        {\"German Fries\", \"Durian Slices\", \"WcFurry\", \"Chocolate Sunday\"}};\n    vector<int> price[2] = {{4, 8, 7, 6, 3}, {2, 3, 5, 7}};\n    int cmd, total = 0;\n    while (cin >> cmd && cmd) {\n        int id;\n        cin >> id;\n        --id;\n        --cmd;\n        cout << name[cmd][id] << ' ' << price[cmd][id] << '\\n';\n        total += price[cmd][id];\n    }\n    cout << \"Total: \" << total << '\\n';\n}\n",
  "python": "import sys\nnames = [[\"Medium Wac\", \"WChicken Nugget\", \"Geez Burger\", \"ButtMilk Crispy Chicken\", \"Plastic Toy\"],\n         [\"German Fries\", \"Durian Slices\", \"WcFurry\", \"Chocolate Sunday\"]]\nprices = [[4, 8, 7, 6, 3], [2, 3, 5, 7]]\nit = iter(map(int, sys.stdin.read().split()))\ntotal = 0\nfor command in it:\n    if command == 0:\n        break\n    index = next(it)-1\n    cost = prices[command-1][index]\n    print(names[command-1][index], cost)\n    total += cost\nprint(f\"Total: {total}\")\n",
  "traceLabel": "點餐系統・表格查詢",
  "trace": [
    {
      "title": "套餐 3",
      "description": "指令 1、編號 3，點 Geez Burger。",
      "cells": [
        "Geez Burger 7"
      ],
      "variables": [
        [
          "total",
          "7"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "單點 2",
      "description": "指令 2、編號 2，點 Durian Slices。",
      "cells": [
        "Durian Slices 3"
      ],
      "variables": [
        [
          "total",
          "10"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "套餐 5 並結帳",
      "description": "加上 Plastic Toy 3，再處理 0。",
      "cells": [
        "Plastic Toy 3",
        "Total: 13"
      ],
      "variables": [
        [
          "total",
          "13"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a188", {
  "topic": "arrays",
  "concept": "商品擺設・隔板區間的極值交換",
  "goal": "只交換兩隔板之間最低與最高銷量商品的編號。",
  "explanation": [
    "先讀銷量列與編號列，保存最近一片隔板的位置。",
    "每遇到下一片隔板，前後隔板間就是可調整區間；非空時找銷量最小及最大的位置。",
    "只交換這兩位置的商品編號；外側未封閉的區間不調整，每個輸出整數後保留一個空白。"
  ],
  "complexity": "時間 O(N)，空間 O(N)。",
  "pitfall": "不是把整個區間排序，也不是交換銷量數值後輸出銷量。",
  "cpp": "#include <iostream>\n#include <utility>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    vector<int> s(n), id(n);\n    for (int &x : s)\n        cin >> x;\n    for (int &x : id)\n        cin >> x;\n    int left = -1;\n    for (int right = 0; right < n; right++)\n        if (s[right] == -1) {\n            if (left >= 0 && right > left + 1) {\n                int lo = left + 1, hi = lo;\n                for (int j = left + 1; j < right; j++) {\n                    if (s[j] < s[lo])\n                        lo = j;\n                    if (s[j] > s[hi])\n                        hi = j;\n                }\n                swap(id[lo], id[hi]);\n            }\n            left = right;\n        }\n    for (int x : id)\n        cout << x << ' ';\n    cout << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn = next(it)\nsales = [next(it) for _ in range(n)]\nids = [next(it) for _ in range(n)]\nleft = -1\nfor right in range(n):\n    if sales[right] == -1:\n        if left >= 0 and right > left+1:\n            indices = range(left+1, right)\n            lo = min(indices, key=lambda j: sales[j])\n            hi = max(indices, key=lambda j: sales[j])\n            ids[lo], ids[hi] = ids[hi], ids[lo]\n        left = right\nprint(\"\".join(f\"{x} \" for x in ids))\n",
  "traceLabel": "商品擺設・隔板區間的極值交換",
  "trace": [
    {
      "title": "找到封閉區間",
      "description": "隔板在原位置 2 與 6，中間銷量為 4、9、2。",
      "cells": [
        "8",
        "-1",
        "4",
        "9",
        "2",
        "-1",
        "7"
      ],
      "variables": [
        [
          "區間",
          "位置 3～5"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ]
    },
    {
      "title": "找最低與最高",
      "description": "銷量 2 的編號 4 與銷量 9 的編號 3 交換。",
      "cells": [
        "編號 2",
        "編號 3",
        "編號 4"
      ],
      "variables": [
        [
          "最低銷量",
          "2"
        ],
        [
          "最高銷量",
          "9"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "輸出編號",
      "description": "未封閉的兩端編號 1、5 不變。",
      "cells": [
        "1",
        "-1",
        "2",
        "4",
        "3",
        "-1",
        "5"
      ],
      "variables": [
        [
          "行尾空白",
          "保留"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a189", {
  "topic": "conditions",
  "concept": "刮刮樂・逐格加減",
  "goal": "逐格計算彩金，最後依 c 是否出現加倍及截為零。",
  "explanation": [
    "五個號碼與五筆金額按相同索引配對，相同號碼的不同格都要計入。",
    "符合 a 或 b 時金額只加一次；符合 c 時另扣該格金額，並記錄 c 曾出現。",
    "全部處理後，若從未遇到 c 就加倍，最後取與 0 的較大值。"
  ],
  "complexity": "時間 O(1)，空間 O(1)。",
  "pitfall": "a 或 b 用聯集判斷，不能在 a=b 時加兩次；扣款與加款分別判斷。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int a, b, c;\n    cin >> a >> b >> c;\n    vector<int> x(5);\n    for (int &v : x)\n        cin >> v;\n    long long total = 0;\n    bool bad = false;\n    for (int v : x) {\n        long long money;\n        cin >> money;\n        if (v == a || v == b)\n            total += money;\n        if (v == c) {\n            total -= money;\n            bad = true;\n        }\n    }\n    if (!bad)\n        total *= 2;\n    cout << max(0LL, total) << '\\n';\n}\n",
  "python": "a, b, c = map(int, input().split())\nnumbers = list(map(int, input().split()))\namounts = list(map(int, input().split()))\ntotal = 0\nseen_c = False\nfor x, money in zip(numbers, amounts):\n    if x == a or x == b:\n        total += money\n    if x == c:\n        total -= money\n        seen_c = True\nif not seen_c:\n    total *= 2\nprint(max(0, total))\n",
  "traceLabel": "刮刮樂・逐格加減",
  "trace": [
    {
      "title": "先加後扣",
      "description": "號碼 2 加 400，號碼 8 扣 300。",
      "cells": [
        "2: +400",
        "8: -300"
      ],
      "variables": [
        [
          "total",
          "100"
        ],
        [
          "遇到 c",
          "是"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "其餘格子",
      "description": "5 加 700、2 加 100、9 不影響。",
      "cells": [
        "5: +700",
        "2: +100",
        "9: 0"
      ],
      "variables": [
        [
          "total",
          "900"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "結算",
      "description": "c 已出現，不加倍；彩金為正。",
      "cells": [
        "輸出 900"
      ],
      "variables": [
        [
          "彩金",
          "900"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a190", {
  "topic": "number-theory",
  "concept": "韓信點兵・遞增合併同餘",
  "goal": "逐條合併餘數條件，用已滿足模數的乘積跳步。",
  "explanation": [
    "先令 x=0、step=1；處理一條 x mod a=b 時，反覆將 x 加 step，直到符合。",
    "因 step 是先前模數的乘積，加 step 不會破壞已滿足的餘數條件；兩兩互質保證最多試 a 次。",
    "合併後把 step 乘 a；最後 x 是一週期內最小非負解，若為 0 就改輸出 step 作為最小正解。"
  ],
  "complexity": "時間 O(a₁+a₂+a₃)，空間 O(1)。",
  "pitfall": "餘數要逐條同時滿足，不能只找其中一條；輸出必須是正整數。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    long long x = 0, step = 1;\n    for (int i = 0; i < 3; i++) {\n        long long a, b;\n        cin >> a >> b;\n        while (x % a != b)\n            x += step;\n        step *= a;\n    }\n    cout << (x ? x : step) << '\\n';\n}\n",
  "python": "x, step = 0, 1\nfor _ in range(3):\n    a, b = map(int, input().split())\n    while x % a != b:\n        x += step\n    step *= a\nprint(x if x else step)\n",
  "traceLabel": "韓信點兵・遞增合併同餘",
  "trace": [
    {
      "title": "第一條餘數",
      "description": "從 0 每次加 1，最先得到 3 mod 5=3。",
      "cells": [
        "x=3",
        "step=5"
      ],
      "variables": [
        [
          "已滿足",
          "mod 5 = 3"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "合併第二條",
      "description": "3、8、13、18 中，18 mod 7=4 尚不符；23、28、33 中 33 mod 7=5。",
      "cells": [
        "3",
        "8",
        "13",
        "18",
        "23",
        "28",
        "33"
      ],
      "variables": [
        [
          "x",
          "33"
        ],
        [
          "step",
          "35"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ]
    },
    {
      "title": "合併第三條",
      "description": "33 mod 11=0，下一個 68 mod 11=2，輸出 68。",
      "cells": [
        "33",
        "68"
      ],
      "variables": [
        [
          "x",
          "68"
        ],
        [
          "step",
          "385"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a191", {
  "topic": "text",
  "concept": "分組・從右分段及同分選大編號",
  "goal": "將 P 當字串，由右至左每 N 位計算一組總和。",
  "explanation": [
    "最右 N 位是第 1 組，之後每次向左移動 N 位；最左不足 N 位仍成一組。",
    "每組將字元轉成數字後相加，不是把整組當成一個整數比較。",
    "由小組號往大組號處理，總和大於等於目前最佳時更新，便能讓同分選最大組號。"
  ],
  "complexity": "位數 L：時間 O(L)，空間 O(L)。",
  "pitfall": "組別從右側編號；同分時要更新為較大的組別。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    string p;\n    cin >> n >> p;\n    int group = 0, best = -1, who = 0;\n    for (int end = (int)p.size(); end > 0; end -= n) {\n        ++group;\n        int sum = 0;\n        for (int i = max(0, end - n); i < end; i++)\n            sum += p[i] - '0';\n        if (sum >= best) {\n            best = sum;\n            who = group;\n        }\n    }\n    cout << who << ' ' << best << '\\n';\n}\n",
  "python": "n, p = input().split()\nn = int(n)\nbest, who, group = -1, 0, 0\nfor end in range(len(p), 0, -n):\n    group += 1\n    total = sum(map(int, p[max(0, end-n):end]))\n    if total >= best:\n        best, who = total, group\nprint(who, best)\n",
  "traceLabel": "分組・從右分段及同分選大編號",
  "trace": [
    {
      "title": "最右一組",
      "description": "72140588 的末三位是 588。",
      "cells": [
        "72",
        "140",
        "588"
      ],
      "variables": [
        [
          "組別",
          "1"
        ],
        [
          "總戰力",
          "21"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "第二組",
      "description": "140 的總和是 5，未超過 21。",
      "cells": [
        "140"
      ],
      "variables": [
        [
          "組別",
          "2"
        ],
        [
          "總戰力",
          "5"
        ],
        [
          "最佳組",
          "1"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "最左不足三位",
      "description": "72 仍是第 3 組，總和 9，輸出 1 21。",
      "cells": [
        "72",
        "輸出 1 21"
      ],
      "variables": [
        [
          "組別",
          "3"
        ],
        [
          "總戰力",
          "9"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a192", {
  "topic": "arrays",
  "concept": "家裡的後花園・界線與害蟲鄰格",
  "goal": "在最外兩片柵欄內，計算不鄰接害蟲的空地。",
  "explanation": [
    "先找第一片與最後一片柵欄；少於兩片時沒有可以種花的位置。",
    "兩片外側柵欄之間的格子才可能左右都找得到柵欄。",
    "逐格檢查原值為 0，且相鄰左、右格都不是 9，符合就計一朵；種花不會改變其他格條件。"
  ],
  "complexity": "時間 O(N)，空間 O(N)。",
  "pitfall": "不能把柵欄內所有 0 都計入；害蟲左右各一格也不能種。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    vector<int> a(n), f;\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n        if (a[i] == 1)\n            f.push_back(i);\n    }\n    int ans = 0;\n    if (f.size() >= 2)\n        for (int i = f.front() + 1; i < f.back(); i++)\n            if (a[i] == 0 && a[i - 1] != 9 && a[i + 1] != 9)\n                ++ans;\n    cout << ans << '\\n';\n}\n",
  "python": "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, a = data[0], data[1:]\nfences = [i for i in range(n) if a[i] == 1]\nanswer = 0\nif len(fences) >= 2:\n    for i in range(fences[0]+1, fences[-1]):\n        if a[i] == 0 and a[i-1] != 9 and a[i+1] != 9:\n            answer += 1\nprint(answer)\n",
  "traceLabel": "家裡的後花園・界線與害蟲鄰格",
  "trace": [
    {
      "title": "限定範圍",
      "description": "以 1 起算的位置 2 與 9 是最外兩片柵欄。",
      "cells": [
        "0",
        "1",
        "0",
        "0",
        "9",
        "0",
        "1",
        "0",
        "1",
        "0"
      ],
      "variables": [
        [
          "候選範圍",
          "位置 3～8"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ]
    },
    {
      "title": "排除害蟲影響",
      "description": "害蟲在位置 5，位置 4、5、6 均不可種花。",
      "cells": [
        "位置 4: 禁止",
        "位置 5: 害蟲",
        "位置 6: 禁止"
      ],
      "variables": [
        [
          "可種空地",
          "位置 3、8"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "計數",
      "description": "兩個合格空地各種一朵。",
      "cells": [
        "位置 3",
        "位置 8"
      ],
      "variables": [
        [
          "輸出",
          "2"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a193", {
  "topic": "grid",
  "concept": "舉旗遊戲・八鄰格同色判定",
  "goal": "每格在原隊形中找相同旗色的八方向鄰居。",
  "explanation": [
    "對每個學生列舉 dr、dc 屬於 -1、0、1 的位移，跳過 (0,0)。",
    "只檢查仍在隊伍範圍內的位置；找到任一同色鄰居就不淘汰。",
    "沒有同色鄰居才加到答案，判斷過程不修改原矩陣。"
  ],
  "complexity": "時間 O(RC)，空間 O(RC)。",
  "pitfall": "四個對角也算鄰居；不能因某人淘汰而連鎖改變別人的判定。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int r, c;\n    cin >> r >> c;\n    vector<vector<int>> a(r, vector<int>(c));\n    for (auto &row : a)\n        for (int &x : row)\n            cin >> x;\n    int ans = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++) {\n            bool same = false;\n            for (int dr = -1; dr <= 1; dr++)\n                for (int dc = -1; dc <= 1; dc++) {\n                    int x = i + dr, y = j + dc;\n                    if ((dr || dc) && x >= 0 && x < r && y >= 0 && y < c &&\n                        a[x][y] == a[i][j])\n                        same = true;\n                }\n            if (!same)\n                ++ans;\n        }\n    cout << ans << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nr, c = next(it), next(it)\na = [[next(it) for _ in range(c)] for _ in range(r)]\nanswer = 0\nfor i in range(r):\n    for j in range(c):\n        same = False\n        for dr in (-1, 0, 1):\n            for dc in (-1, 0, 1):\n                x, y = i+dr, j+dc\n                if (dr or dc) and 0 <= x < r and 0 <= y < c and a[x][y] == a[i][j]:\n                    same = True\n        answer += not same\nprint(answer)\n",
  "traceLabel": "舉旗遊戲・八鄰格同色判定",
  "trace": [
    {
      "title": "檢查旗子 1",
      "description": "所有 1 都至少鄰接另一個 1，包含對角方向。",
      "cells": [
        "1 1 2",
        "1 1 1",
        "2 1 2"
      ],
      "variables": [
        [
          "旗色 1 淘汰數",
          "0"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "檢查三個角落的 2",
      "description": "右上、左下、右下的 2 彼此都不是相鄰格。",
      "cells": [
        "(0,2): 2",
        "(2,0): 2",
        "(2,2): 2"
      ],
      "variables": [
        [
          "旗色 2 淘汰數",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "輸出總數",
      "description": "三位都沒有相同旗色鄰居。",
      "cells": [
        "輸出 3"
      ],
      "variables": [
        [
          "answer",
          "3"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a194", {
  "topic": "simulation",
  "concept": "神奇肥料・日初判定與隔日成長",
  "goal": "按照日曆先檢查達標，再處理耐性、休假及次日高度。",
  "explanation": [
    "第 1 天高度 S。每一天一開始若高度已達 E，立刻輸出當天天數，包括假日。",
    "仍未達標時，第 11、21、31…天扣耐性；降到 0 就輸出 unsalable。",
    "第 9、10、19、20…天不成長，優先於施肥；其他天依是否為 3 的倍數增加 floor(h/3) 或 floor(h/10)，然後進入次日。"
  ],
  "complexity": "時間 O(A×10)，空間 O(1)。",
  "pitfall": "處理當天的動作是讓隔天成長；第 11 天若已達標，不應先取消。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int h, e, a;\n    cin >> h >> e >> a;\n    int day = 1;\n    while (true) {\n        if (h >= e) {\n            cout << day << '\\n';\n            break;\n        }\n        if (day > 1 && day % 10 == 1) {\n            if (--a == 0) {\n                cout << \"unsalable\\n\";\n                break;\n            }\n        }\n        if (day % 10 != 9 && day % 10 != 0)\n            h += h / (day % 3 == 0 ? 3 : 10);\n        ++day;\n    }\n}\n",
  "python": "height, target, patience = map(int, input().split())\nday = 1\nwhile True:\n    if height >= target:\n        print(day)\n        break\n    if day > 1 and day % 10 == 1:\n        patience -= 1\n        if patience == 0:\n            print(\"unsalable\")\n            break\n    if day % 10 not in (9, 0):\n        height += height // (3 if day % 3 == 0 else 10)\n    day += 1\n",
  "traceLabel": "神奇肥料・日初判定與隔日成長",
  "trace": [
    {
      "title": "第一段成長",
      "description": "第 1～6 天日初高度為 15、16、17、22、24、26。",
      "cells": [
        "15",
        "16",
        "17",
        "22",
        "24",
        "26"
      ],
      "variables": [
        [
          "第 7 天高度",
          "34"
        ],
        [
          "耐性",
          "2"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    {
      "title": "遇到休假",
      "description": "第 7、8 天處理後，第 9 天高度 40；第 9、10 天不增加。",
      "cells": [
        "第7天 34",
        "第8天 37",
        "第9天 40",
        "第10天 40"
      ],
      "variables": [
        [
          "第 11 天高度",
          "40"
        ],
        [
          "耐性扣除後",
          "1"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "首次達標",
      "description": "第 11 天澆水使第 12 天高 44，第 12 天施肥使第 13 天高 58。",
      "cells": [
        "第11天 40",
        "第12天 44",
        "第13天 58"
      ],
      "variables": [
        [
          "需求高度",
          "45"
        ],
        [
          "輸出",
          "13"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a195", {
  "topic": "simulation",
  "concept": "老鷹抓小雞・位置索引交換",
  "goal": "以編號查出被抓位置，讓老鷹與該小雞互換角色。",
  "explanation": [
    "小雞陣列記錄隊伍順序，另外用編號到位置的表保存每隻小雞在哪裡。",
    "抓到編號 x 時，將目前老鷹放到 x 的位置，更新其位置；x 變成新老鷹。",
    "刪除 x 的小雞位置紀錄，其餘位置不變，完成 Q 回合後列出陣列。"
  ],
  "complexity": "時間 O(N+Q)，空間 O(U+N)，U=10001（Python 雜湊表期望時間）。",
  "pitfall": "輸入的是被抓者的編號，不是位置；新老鷹會在後續回合以老鷹身分出現。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    vector<int> a(n), pos(10001, -1);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n        pos[a[i]] = i;\n    }\n    int eagle, q;\n    cin >> eagle >> q;\n    while (q--) {\n        int x;\n        cin >> x;\n        int p = pos[x];\n        a[p] = eagle;\n        pos[eagle] = p;\n        pos[x] = -1;\n        eagle = x;\n    }\n    for (int i = 0; i < n; i++)\n        cout << (i ? \" \" : \"\") << a[i];\n    cout << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn = next(it)\na = [next(it) for _ in range(n)]\neagle, q = next(it), next(it)\nposition = {x: i for i, x in enumerate(a)}\nfor _ in range(q):\n    caught = next(it)\n    p = position.pop(caught)\n    a[p] = eagle\n    position[eagle] = p\n    eagle = caught\nprint(*a)\n",
  "traceLabel": "老鷹抓小雞・位置索引交換",
  "trace": [
    {
      "title": "抓到 20",
      "description": "初始老鷹 99 站進原本 20 的位置。",
      "cells": [
        "10",
        "99",
        "30",
        "40"
      ],
      "variables": [
        [
          "eagle",
          "20"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "抓到 40",
      "description": "老鷹 20 站進原本 40 的位置。",
      "cells": [
        "10",
        "99",
        "30",
        "20"
      ],
      "variables": [
        [
          "eagle",
          "40"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "抓到 99",
      "description": "老鷹 40 站進原本 99 的位置。",
      "cells": [
        "10",
        "40",
        "30",
        "20"
      ],
      "variables": [
        [
          "eagle",
          "99"
        ],
        [
          "輸出",
          "10 40 30 20"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a196", {
  "topic": "grid",
  "concept": "炸彈偵測器・先判失靈再標記",
  "goal": "以原矩陣判定正常偵測器，用布林格避免炸彈重複計數。",
  "explanation": [
    "每個值為 5 的格先查看八鄰格，有另一個 5 就失靈，否則正常。",
    "正常偵測器的八鄰格中，值為 1 的位置在 detected 矩陣標記為真。",
    "最後走訪所有炸彈，按 detected 分為可找到與不可找到；原矩陣完全不修改。"
  ],
  "complexity": "時間 O(RC)，空間 O(RC)。",
  "pitfall": "兩個相鄰偵測器會同時失靈；同一炸彈被多個正常偵測器找到只算一顆。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int r, c;\n    cin >> r >> c;\n    vector<vector<int>> a(r, vector<int>(c));\n    for (auto &row : a)\n        for (int &x : row)\n            cin >> x;\n    vector<vector<bool>> seen(r, vector<bool>(c));\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (a[i][j] == 5) {\n                bool ok = true;\n                for (int x = max(0, i - 1); x <= min(r - 1, i + 1); x++)\n                    for (int y = max(0, j - 1); y <= min(c - 1, j + 1); y++)\n                        if ((x != i || y != j) && a[x][y] == 5)\n                            ok = false;\n                if (ok)\n                    for (int x = max(0, i - 1); x <= min(r - 1, i + 1); x++)\n                        for (int y = max(0, j - 1); y <= min(c - 1, j + 1); y++)\n                            if (a[x][y] == 1)\n                                seen[x][y] = true;\n            }\n    int yes = 0, no = 0;\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            if (a[i][j] == 1) {\n                if (seen[i][j])\n                    ++yes;\n                else\n                    ++no;\n            }\n    cout << yes << ' ' << no << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nr, c = next(it), next(it)\na = [[next(it) for _ in range(c)] for _ in range(r)]\ndetected = set()\nfor i in range(r):\n    for j in range(c):\n        if a[i][j] != 5:\n            continue\n        neighbors = [(x, y) for x in range(max(0, i-1), min(r, i+2))\n                     for y in range(max(0, j-1), min(c, j+2)) if (x, y) != (i, j)]\n        if all(a[x][y] != 5 for x, y in neighbors):\n            detected.update((x, y) for x, y in neighbors if a[x][y] == 1)\nbombs = sum(row.count(1) for row in a)\nprint(len(detected), bombs-len(detected))\n",
  "traceLabel": "炸彈偵測器・先判失靈再標記",
  "trace": [
    {
      "title": "判定正常偵測器",
      "description": "(0,0) 與 (0,2) 相隔兩格，不在彼此八鄰格中。",
      "cells": [
        "5 0 5",
        "0 1 0",
        "1 0 1"
      ],
      "variables": [
        [
          "正常偵測器",
          "2"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "標記炸彈",
      "description": "兩個偵測器都找到 (1,1)，集合只留一個座標。",
      "cells": [
        "detected={(1,1)}"
      ],
      "variables": [
        [
          "可偵測",
          "1"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "統計未找到",
      "description": "(2,0) 與 (2,2) 都離偵測器超過一列。",
      "cells": [
        "(2,0)",
        "(2,2)"
      ],
      "variables": [
        [
          "輸出",
          "1 2"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a197", {
  "topic": "text",
  "concept": "身分驗證機制・全九位取前兩大",
  "goal": "保留九位字串，檢查最大兩位平方和是否等於末三位。",
  "explanation": [
    "將代號以字串讀入，保留前導零；九個字元全部參與最大兩位的選取。",
    "複製後排序，取末兩個數字，重複值只要來自不同位置就可同時使用。",
    "末三位轉成整數後比對平方和，依結果輸出 Good Morning! 或 SPY!。"
  ],
  "complexity": "九位固定：時間 O(1)，空間 O(1)。",
  "pitfall": "不能只檢查前六位，也不能把重複數字去重後找第二大。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string s;\n    cin >> s;\n    string t = s;\n    sort(t.begin(), t.end());\n    int a = t[8] - '0', b = t[7] - '0';\n    cout << (a * a + b * b == stoi(s.substr(6)) ? \"Good Morning!\" : \"SPY!\") << '\\n';\n}\n",
  "python": "code = input().strip()\ndigits = sorted(map(int, code))\nvalue = digits[-1]**2 + digits[-2]**2\nprint(\"Good Morning!\" if value == int(code[-3:]) else \"SPY!\")\n",
  "traceLabel": "身分驗證機制・全九位取前兩大",
  "trace": [
    {
      "title": "九位全部參與",
      "description": "代號是 980000145，末三位 145 也在選取範圍內。",
      "cells": [
        "9",
        "8",
        "0",
        "0",
        "0",
        "0",
        "1",
        "4",
        "5"
      ],
      "variables": [
        [
          "末三位",
          "145"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ]
    },
    {
      "title": "計算平方和",
      "description": "最大兩位是 9、8，平方和為 81+64。",
      "cells": [
        "9²=81",
        "8²=64"
      ],
      "variables": [
        [
          "平方和",
          "145"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "驗證成功",
      "description": "145 等於末三位，輸出指定訊息。",
      "cells": [
        "Good Morning!"
      ],
      "variables": [
        [
          "是否通過",
          "是"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a198", {
  "topic": "number-theory",
  "concept": "史萊姆生態區・總數倍增",
  "goal": "把比例換成實際總數，再計算倍增次數。",
  "explanation": [
    "史萊姆王始終一隻，所以小史萊姆數是 T/N，總數是 1+T/N。",
    "每一天原有的每隻都再生一隻，因此總數每日乘 2，第 d 天共有 2^d 隻。",
    "從總數 1 開始倍增，直到等於目標總數；輸入保證比例對應合法天數。"
  ],
  "complexity": "時間 O(log(1+T/N))，空間 O(1)。",
  "pitfall": "比例可能沒有約分；T=0 表示還是最初狀態，答案為 0 天。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    long long n, t;\n    cin >> n >> t;\n    long long target = 1 + t / n, total = 1;\n    int day = 0;\n    while (total < target) {\n        total *= 2;\n        ++day;\n    }\n    cout << day << '\\n';\n}\n",
  "python": "n, t = map(int, input().split())\ntarget = 1+t//n\ntotal, days = 1, 0\nwhile total < target:\n    total *= 2\n    days += 1\nprint(days)\n",
  "traceLabel": "史萊姆生態區・總數倍增",
  "trace": [
    {
      "title": "換算比例",
      "description": "3:45 約成 1:15，實際共有 1+15=16 隻。",
      "cells": [
        "王 1",
        "小史萊姆 15"
      ],
      "variables": [
        [
          "目標總數",
          "16"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "前兩天",
      "description": "從 1 隻倍增到 2、4 隻。",
      "cells": [
        "第0天 1",
        "第1天 2",
        "第2天 4"
      ],
      "variables": [
        [
          "days",
          "2"
        ],
        [
          "total",
          "4"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "再倍增兩天",
      "description": "第 3 天 8 隻，第 4 天 16 隻，輸出 4。",
      "cells": [
        "第3天 8",
        "第4天 16"
      ],
      "variables": [
        [
          "days",
          "4"
        ],
        [
          "小史萊姆",
          "15"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a199", {
  "topic": "read-calculate",
  "concept": "小豪的回家作業・補加數再排序",
  "goal": "先套用相等時減三的規則，再輸出由小到大的兩加數。",
  "explanation": [
    "輸入的 R 是和，A 是其中一個加數；R=A 時先把 A 改為 A-3。",
    "另一加數是 R-A，兩個加數仍然相加等於原來的 R。",
    "以較小者、較大者的順序組成 a+b=R，中間完全不加空白。"
  ],
  "complexity": "時間 O(1)，空間 O(1)。",
  "pitfall": "R=A 的特別規則只修改 A，不能把結果 R 也減三。",
  "cpp": "#include <algorithm>\n#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    long long r, a;\n    cin >> r >> a;\n    if (r == a)\n        a -= 3;\n    long long b = r - a;\n    cout << min(a, b) << '+' << max(a, b) << '=' << r << '\\n';\n}\n",
  "python": "r, a = map(int, input().split())\nif r == a:\n    a -= 3\nb = r-a\nprint(f\"{min(a,b)}+{max(a,b)}={r}\")\n",
  "traceLabel": "小豪的回家作業・補加數再排序",
  "trace": [
    {
      "title": "讀取已知值",
      "description": "R=18、A=18，符合相等特例。",
      "cells": [
        "R=18",
        "A=18"
      ],
      "variables": [
        [
          "R=A",
          "是"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "修正加數",
      "description": "將 A 減 3 成為 15，另一加數是 18-15=3。",
      "cells": [
        "A=15",
        "B=3"
      ],
      "variables": [
        [
          "總和",
          "18"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "排序輸出",
      "description": "較小加數 3 在前，沒有空白。",
      "cells": [
        "3+15=18"
      ],
      "variables": [
        [
          "輸出",
          "3+15=18"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a200", {
  "topic": "conditions",
  "concept": "週年慶・兩種門檻折抵",
  "goal": "用原價整除門檻，分別算結帳金額後比較。",
  "explanation": [
    "天天金額為 N-200×floor(N/2000)，琪琪金額為 N-100×floor(N/1000)。",
    "折抵次數都根據原價，不能扣完一次後再判斷門檻。",
    "若天天金額小於等於琪琪，輸出天天編號 0；否則輸出琪琪編號 1。"
  ],
  "complexity": "時間 O(1)，空間 O(1)。",
  "pitfall": "同價選編號 0；門檻恰好達成時也有折抵。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    int a = n - n / 2000 * 200, b = n - n / 1000 * 100;\n    if (a <= b)\n        cout << a << \" 0\\n\";\n    else\n        cout << b << \" 1\\n\";\n}\n",
  "python": "n = int(input())\na = n-(n//2000)*200\nb = n-(n//1000)*100\nprint(a, 0) if a <= b else print(b, 1)\n",
  "traceLabel": "週年慶・兩種門檻折抵",
  "trace": [
    {
      "title": "天天折抵",
      "description": "3456 元可滿一次 2000，折抵 200。",
      "cells": [
        "3456-200"
      ],
      "variables": [
        [
          "天天金額",
          "3256"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "琪琪折抵",
      "description": "3456 元可滿三次 1000，折抵 300。",
      "cells": [
        "3456-300"
      ],
      "variables": [
        [
          "琪琪金額",
          "3156"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "比較",
      "description": "3156 小於 3256，選琪琪。",
      "cells": [
        "3156 1"
      ],
      "variables": [
        [
          "輸出",
          "3156 1"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a201", {
  "topic": "text",
  "concept": "英文縮寫・特殊字典與首字母",
  "goal": "每個單字先判特殊替換，否則取大寫首字母。",
  "explanation": [
    "按空白切出單字，保持原先順序。",
    "將單字轉小寫後檢查 for、to、and、you，分別產生 4、2、n、u。",
    "其他單字取原首字母的大寫，最後將結果直接串接，沒有分隔空白。"
  ],
  "complexity": "總字元數 L：時間 O(L)，空間 O(L)。",
  "pitfall": "特殊單字不分大小寫，但 n、u 的輸出必須是小寫。",
  "cpp": "#include <cctype>\n#include <iostream>\n#include <map>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    map<string, string> special = {{\"for\", \"4\"}, {\"to\", \"2\"}, {\"and\", \"n\"}, {\"you\", \"u\"}};\n    string w, ans;\n    while (cin >> w) {\n        string low = w;\n        for (char &c : low)\n            c = (char)tolower((unsigned char)c);\n        if (special.count(low))\n            ans += special[low];\n        else\n            ans += (char)toupper((unsigned char)w[0]);\n    }\n    cout << ans << '\\n';\n}\n",
  "python": "special = {\"for\": \"4\", \"to\": \"2\", \"and\": \"n\", \"you\": \"u\"}\nanswer = []\nfor word in input().split():\n    key = word.lower()\n    answer.append(special[key] if key in special else word[0].upper())\nprint(\"\".join(answer))\n",
  "traceLabel": "英文縮寫・特殊字典與首字母",
  "trace": [
    {
      "title": "一般字首",
      "description": "Time 取首字 T。",
      "cells": [
        "Time→T"
      ],
      "variables": [
        [
          "answer",
          "T"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "特殊替換",
      "description": "for→4、You→u、and→n。",
      "cells": [
        "for→4",
        "You→u",
        "and→n"
      ],
      "variables": [
        [
          "answer",
          "T4un"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "完成縮寫",
      "description": "Me 取 M，接在前綴後。",
      "cells": [
        "Me→M",
        "T4unM"
      ],
      "variables": [
        [
          "輸出",
          "T4unM"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a202", {
  "topic": "count-frequency",
  "concept": "滿意度調查・頻率排序",
  "goal": "統計十種數字，依次數降序及數值升序輸出。",
  "explanation": [
    "將正整數當字串讀取，逐字統計 0 到 9 的出現次數。",
    "只把次數大於 0 的數字加入候選，排序鍵為 (-次數, 數字)。",
    "每種數字只輸出一次，不輸出次數本身；同頻時小數字優先。"
  ],
  "complexity": "位數 L：時間 O(L+10 log 10)，空間 O(L+10)。",
  "pitfall": "0 也必須統計；不是將原來所有數字逐一排序輸出。",
  "cpp": "#include <algorithm>\n#include <array>\n#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string s;\n    cin >> s;\n    array<int, 10> cnt{};\n    for (char c : s)\n        cnt[c - '0']++;\n    vector<int> v;\n    for (int d = 0; d < 10; d++)\n        if (cnt[d])\n            v.push_back(d);\n    sort(v.begin(), v.end(),\n         [&](int x, int y) { return cnt[x] != cnt[y] ? cnt[x] > cnt[y] : x < y; });\n    for (int i = 0; i < (int)v.size(); i++)\n        cout << (i ? \" \" : \"\") << v[i];\n    cout << '\\n';\n}\n",
  "python": "s = input().strip()\ncount = [0]*10\nfor ch in s:\n    count[int(ch)] += 1\ndigits = [d for d in range(10) if count[d] > 0]\ndigits.sort(key=lambda d: (-count[d], d))\nprint(*digits)\n",
  "traceLabel": "滿意度調查・頻率排序",
  "trace": [
    {
      "title": "統計 7727003",
      "description": "7 出現 3 次、0 出現 2 次、2 與 3 各一次。",
      "cells": [
        "7:3",
        "0:2",
        "2:1",
        "3:1"
      ],
      "variables": [
        [
          "不同數字",
          "4"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "按次數排列",
      "description": "先列 7，再列 0。",
      "cells": [
        "7",
        "0"
      ],
      "variables": [
        [
          "頻率",
          "3、2"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "同頻比較數值",
      "description": "2 與 3 同為一次，因此 2 在前。",
      "cells": [
        "7",
        "0",
        "2",
        "3"
      ],
      "variables": [
        [
          "輸出",
          "7 0 2 3"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a203", {
  "topic": "arrays",
  "concept": "班級名單・倒序排除缺席",
  "goal": "由 N 遞減到 1，略過三位缺席者。",
  "explanation": [
    "將三個請假座號存入集合或標記表，方便檢查某座號是否缺席。",
    "從 N 向下走到 1，只有不在請假集合裡的座號才輸出。",
    "每人一行，固定前綴為 No. 加一個空白，總行數應為 N-3。"
  ],
  "complexity": "時間 O(N)，空間 O(N)（Python 集合 O(1)）。",
  "pitfall": "從大到小輸出；No. 的句點和後方空白都要保留。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    vector<bool> absent(n + 1);\n    for (int i = 0, x; i < 3; i++) {\n        cin >> x;\n        absent[x] = true;\n    }\n    for (int x = n; x >= 1; x--)\n        if (!absent[x])\n            cout << \"No. \" << x << '\\n';\n}\n",
  "python": "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, absent = data[0], set(data[1:])\nfor seat in range(n, 0, -1):\n    if seat not in absent:\n        print(f\"No. {seat}\")\n",
  "traceLabel": "班級名單・倒序排除缺席",
  "trace": [
    {
      "title": "建立缺席集合",
      "description": "班級有 7 人，2、5、7 請假。",
      "cells": [
        "2",
        "5",
        "7"
      ],
      "variables": [
        [
          "應輸出人數",
          "4"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "由 7 往下",
      "description": "跳過 7，列 6；跳過 5，列 4。",
      "cells": [
        "No. 6",
        "No. 4"
      ],
      "variables": [
        [
          "已輸出",
          "2"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "繼續倒序",
      "description": "列 3，跳過 2，最後列 1。",
      "cells": [
        "No. 3",
        "No. 1"
      ],
      "variables": [
        [
          "已輸出",
          "4"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a204", {
  "topic": "grid",
  "concept": "座位安排・循環位移反推原座位",
  "goal": "計算橫移與縱移次數，反推每個座位原本的學生。",
  "explanation": [
    "第 2～N 週中雙數週共有 floor(N/2) 次右移，單數週共有 floor((N-1)/2) 次後移。",
    "這兩種循環位移彼此可交換，所以只需各自對欄數、列數取餘數，不必逐週搬動矩陣。",
    "輸出位置 (r,c) 的原位置是 ((r-down) mod R,(c-right) mod C)，原座號為原列×C+原欄+1。"
  ],
  "complexity": "時間 O(RC)，C++ 額外空間 O(1)，Python 每列輸出 O(C)。",
  "pitfall": "第 1 週不移動；反推座標要減位移，C++ 取模前要加上維度避免負數。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int r, c, n;\n    cin >> r >> c >> n;\n    int down = ((n - 1) / 2) % r, right = (n / 2) % c;\n    for (int i = 0; i < r; i++) {\n        for (int j = 0; j < c; j++) {\n            int x = (i - down + r) % r, y = (j - right + c) % c;\n            cout << (j ? \" \" : \"\") << x * c + y + 1;\n        }\n        cout << '\\n';\n    }\n}\n",
  "python": "r, c, n = map(int, input().split())\ndown, right = ((n-1)//2) % r, (n//2) % c\nfor i in range(r):\n    row = [((i-down) % r)*c + (j-right) % c + 1 for j in range(c)]\n    print(*row)\n",
  "traceLabel": "座位安排・循環位移反推原座位",
  "trace": [
    {
      "title": "計算週次",
      "description": "第 2、4 週右移，第 3、5 週後移。",
      "cells": [
        "right=2",
        "down=2"
      ],
      "variables": [
        [
          "R",
          "3"
        ],
        [
          "C",
          "4"
        ],
        [
          "N",
          "5"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "反推第一列",
      "description": "輸出第 0 列來自原第 1 列，欄序為 2、3、0、1。",
      "cells": [
        "7",
        "8",
        "5",
        "6"
      ],
      "variables": [
        [
          "原列",
          "1"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "完整座位表",
      "description": "依相同反推公式產生其餘兩列。",
      "cells": [
        "7 8 5 6",
        "11 12 9 10",
        "3 4 1 2"
      ],
      "variables": [
        [
          "輸出列數",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a205", {
  "topic": "arrays",
  "concept": "降雨量統計・列和與欄和",
  "goal": "同時計算每日與各時段的累計雨量。",
  "explanation": [
    "每筆雨量只有一位小數，移除小數點即得到十分之一毫米整數，避免浮點數比較誤差。",
    "對七列各加總四筆得到每日雨量，並按四個欄位累加得到各時段週雨量。",
    "分別找兩個陣列最大值的位置，日索引加 1，時段名稱由固定表查出；最大值保證唯一。"
  ],
  "complexity": "固定 7×4 筆：時間 O(1)，空間 O(1)。",
  "pitfall": "清晨名稱是 early morning，內含空白；時段順序不能與日索引混用。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    vector<int> days(7), slots(4);\n    for (int i = 0; i < 7; i++)\n        for (int j = 0; j < 4; j++) {\n            string s;\n            cin >> s;\n            s.erase(remove(s.begin(), s.end(), '.'), s.end());\n            int x = stoi(s);\n            days[i] += x;\n            slots[j] += x;\n        }\n    vector<string> names = {\"morning\", \"afternoon\", \"night\", \"early morning\"};\n    cout << max_element(days.begin(), days.end()) - days.begin() + 1 << '\\n'\n         << names[max_element(slots.begin(), slots.end()) - slots.begin()] << '\\n';\n}\n",
  "python": "import sys\nvalues = [int(x.replace(\".\", \"\")) for x in sys.stdin.read().split()]\ndays = [sum(values[i*4:i*4+4]) for i in range(7)]\nslots = [sum(values[j::4]) for j in range(4)]\nnames = [\"morning\", \"afternoon\", \"night\", \"early morning\"]\nprint(max(range(7), key=lambda i: days[i])+1)\nprint(names[max(range(4), key=lambda j: slots[j])])\n",
  "traceLabel": "降雨量統計・列和與欄和",
  "trace": [
    {
      "title": "轉成整數",
      "description": "星期三下午 12.3 毫米轉為 123，其餘皆為 0。",
      "cells": [
        "週三下午=123"
      ],
      "variables": [
        [
          "單位",
          "0.1 毫米"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "找每日最大",
      "description": "每日總雨量只有星期三非零。",
      "cells": [
        "0",
        "0",
        "123",
        "0",
        "0",
        "0",
        "0"
      ],
      "variables": [
        [
          "最大星期",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ]
    },
    {
      "title": "找時段最大",
      "description": "四時段總量為 0、123、0、0。",
      "cells": [
        "morning:0",
        "afternoon:123",
        "night:0",
        "early morning:0"
      ],
      "variables": [
        [
          "輸出",
          "3 / afternoon"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a206", {
  "topic": "simulation",
  "concept": "PPAP・逐輪扣除後定位",
  "goal": "扣掉完整輪次，再以每組 k 個判斷物品。",
  "explanation": [
    "第 k 輪有四種物品，每種連續發 k 個，因此整輪長度為 4k。",
    "當 N 大於整輪長度就扣除 4k，並進入 k+1 輪。",
    "落在某輪時，(N-1)//k 是 0～3 的種類索引，查表輸出正確名稱。"
  ],
  "complexity": "時間 O(√N)，空間 O(1)。",
  "pitfall": "輪內位置是從 1 起算，種類索引要用 N-1，避免恰在邊界時跳到下一類。",
  "cpp": "#include <iostream>\n#include <string>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    int k = 1;\n    while (n > 4 * k) {\n        n -= 4 * k;\n        ++k;\n    }\n    vector<string> v = {\"Pen\", \"Pineapple\", \"Apple\", \"Pineapple pen\"};\n    cout << v[(n - 1) / k] << '\\n';\n}\n",
  "python": "n = int(input())\nk = 1\nwhile n > 4*k:\n    n -= 4*k\n    k += 1\nitems = [\"Pen\", \"Pineapple\", \"Apple\", \"Pineapple pen\"]\nprint(items[(n-1)//k])\n",
  "traceLabel": "PPAP・逐輪扣除後定位",
  "trace": [
    {
      "title": "扣除前兩輪",
      "description": "號碼 30 扣第 1 輪 4 個及第 2 輪 8 個，剩 18。",
      "cells": [
        "30-4-8=18"
      ],
      "variables": [
        [
          "下一輪",
          "3"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "扣除第三輪",
      "description": "再扣 12，剩第 4 輪的第 6 個。",
      "cells": [
        "18-12=6"
      ],
      "variables": [
        [
          "k",
          "4"
        ],
        [
          "輪內位置",
          "6"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "判斷種類",
      "description": "第 4 輪 1～4 是 Pen，5～8 是 Pineapple。",
      "cells": [
        "索引 (6-1)//4=1",
        "Pineapple"
      ],
      "variables": [
        [
          "輸出",
          "Pineapple"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a207", {
  "topic": "count-frequency",
  "concept": "多項式計算・依次方累加係數",
  "goal": "將兩個多項式各項累加到相同次方的桶。",
  "explanation": [
    "建立 0～1000 次方的係數陣列，初始全部為零。",
    "對兩組資料，各讀項數後再讀對應的 p、c，把 c 加到 coefficient[p]；同一組內重複次方也能合併。",
    "由 1000 倒序輸出非零項 p:c；若一項都沒有則輸出 NULL!。C++ 用 long long 防止累加溢位。"
  ],
  "complexity": "總項數 K、最大次方 P=1000：時間 O(K+P)，空間 O(P)（Python 輸入緩衝 O(K)）。",
  "pitfall": "抵銷為零的項不可輸出；大量係數累加可能超過 32 位元整數。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    vector<long long> coef(1001);\n    for (int group = 0; group < 2; group++) {\n        int n;\n        cin >> n;\n        while (n--) {\n            int p;\n            long long c;\n            cin >> p >> c;\n            coef[p] += c;\n        }\n    }\n    bool any = false;\n    for (int p = 1000; p >= 0; p--)\n        if (coef[p]) {\n            cout << p << ':' << coef[p] << '\\n';\n            any = true;\n        }\n    if (!any)\n        cout << \"NULL!\\n\";\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\ncoeff = [0]*1001\nfor _ in range(2):\n    n = next(it)\n    for _ in range(n):\n        power, value = next(it), next(it)\n        coeff[power] += value\nlines = [f\"{p}:{coeff[p]}\" for p in range(1000, -1, -1) if coeff[p]]\nprint(\"\\n\".join(lines) if lines else \"NULL!\")\n",
  "traceLabel": "多項式計算・依次方累加係數",
  "trace": [
    {
      "title": "第一個多項式",
      "description": "4 次項 7、1 次項 2、常數 -5。",
      "cells": [
        "4:7",
        "1:2",
        "0:-5"
      ],
      "variables": [
        [
          "已讀多項式",
          "1"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "合併第二個",
      "description": "3 次項加 6，4 次項加 -7 抵銷，常數加 8 成 3。",
      "cells": [
        "4:0",
        "3:6",
        "1:2",
        "0:3"
      ],
      "variables": [
        [
          "非零項數",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "由高次輸出",
      "description": "略過 4 次項與其他零係數項。",
      "cells": [
        "3:6",
        "1:2",
        "0:3"
      ],
      "variables": [
        [
          "輸出順序",
          "3、1、0"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a208", {
  "topic": "text",
  "concept": "修辭迴文・偶數長度與鏡像",
  "goal": "先檢查長度偶數，再確認前後字元鏡像相等。",
  "explanation": [
    "本題要求長度為偶數；一般奇數迴文仍要輸出 NO。",
    "對偶數長度字串，比較 s[i] 與 s[n-1-i]，全部相同才符合。",
    "符合時輸出 YES 並另起一行印前半段，否則只輸出 NO；大小寫視為不同。"
  ],
  "complexity": "長度 L：時間 O(L)，空間 O(L)。",
  "pitfall": "不能只判斷一般迴文而漏掉偶數限制，也不能轉小寫後比較。",
  "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string s;\n    getline(cin, s);\n    bool ok = s.size() % 2 == 0;\n    for (int i = 0; i < (int)s.size() / 2; i++)\n        if (s[i] != s[s.size() - 1 - i])\n            ok = false;\n    if (ok)\n        cout << \"YES\\n\" << s.substr(0, s.size() / 2) << '\\n';\n    else\n        cout << \"NO\\n\";\n}\n",
  "python": "s = input()\nif len(s) % 2 == 0 and s == s[::-1]:\n    print(\"YES\")\n    print(s[:len(s)//2])\nelse:\n    print(\"NO\")\n",
  "traceLabel": "修辭迴文・偶數長度與鏡像",
  "trace": [
    {
      "title": "檢查長度",
      "description": "Ab33bA 有 6 個字元，是偶數。",
      "cells": [
        "A",
        "b",
        "3",
        "3",
        "b",
        "A"
      ],
      "variables": [
        [
          "長度",
          "6"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    {
      "title": "鏡像比較",
      "description": "A=A、b=b、3=3，三對都相同。",
      "cells": [
        "A↔A",
        "b↔b",
        "3↔3"
      ],
      "variables": [
        [
          "符合",
          "是"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "輸出前半段",
      "description": "前 3 個字元是 Ab3。",
      "cells": [
        "YES",
        "Ab3"
      ],
      "variables": [
        [
          "前半段",
          "Ab3"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a209", {
  "topic": "search-optimization",
  "concept": "虛擬寵物大師・逐一計算最佳值",
  "goal": "計算每隻寵物用完可用升級次數後的 CP，再找最大者。",
  "explanation": [
    "星塵只能每 1000 單位升一等，所以所有候選可升的等數都是 S//1000。",
    "IV 小於 30、介於 30～39、至少 40，分別每等增加 10、50、100 CP。",
    "對每隻計算原 CP+等數×增幅，保留最高 CP 與其從 1 起算的輸入編號；最佳者保證唯一。"
  ],
  "complexity": "時間 O(n)，C++ 額外空間 O(1)（Python 輸入緩衝 O(n)）。",
  "pitfall": "不能只挑 IV 最大或初始 CP 最大的；不足 1000 的星塵不能使用。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n, s;\n    cin >> n >> s;\n    int best = -1, who = 0;\n    for (int i = 1; i <= n; i++) {\n        int cp, iv;\n        cin >> cp >> iv;\n        int gain = iv < 30 ? 10 : (iv < 40 ? 50 : 100);\n        int end = cp + s / 1000 * gain;\n        if (end > best) {\n            best = end;\n            who = i;\n        }\n    }\n    cout << who << ' ' << best << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn, s = next(it), next(it)\nlevels = s//1000\nbest, who = -1, 0\nfor i in range(1, n+1):\n    cp, iv = next(it), next(it)\n    gain = 10 if iv < 30 else 50 if iv < 40 else 100\n    final = cp+levels*gain\n    if final > best:\n        best, who = final, i\nprint(who, best)\n",
  "traceLabel": "虛擬寵物大師・逐一計算最佳值",
  "trace": [
    {
      "title": "可升兩等",
      "description": "2500 單位星塵只可使用 2000。",
      "cells": [
        "2500//1000=2"
      ],
      "variables": [
        [
          "levels",
          "2"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "計算三隻結果",
      "description": "900+20=920，830+100=930，700+200=900。",
      "cells": [
        "1:920",
        "2:930",
        "3:900"
      ],
      "variables": [
        [
          "最大 CP",
          "930"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "輸出最佳者",
      "description": "第 2 隻最強，雖非原 CP 或 IV 最大。",
      "cells": [
        "2 930"
      ],
      "variables": [
        [
          "who",
          "2"
        ],
        [
          "best",
          "930"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a210", {
  "topic": "grid",
  "concept": "尋寶地圖・列欄和與交會去重",
  "goal": "用列和加欄和減交會格，決定是否翻轉。",
  "explanation": [
    "先讀藏寶圖 A，再讀轉換圖 B；用空白分詞可自然略過兩圖間空白行。",
    "預先算 B 的每列總和 row[r] 與每欄總和 col[c]；兩者相加把 B[r][c] 算了兩次，所以要減一次。",
    "若 row[r]+col[c]-B[r][c] 為奇數，輸出 1-A[r][c]，否則輸出 A[r][c]；每格後面都加一個空白。"
  ],
  "complexity": "時間 O(NM)，空間 O(NM)。",
  "pitfall": "交會格應只計一次；所有判斷都依原轉換圖，不是依已修改的藏寶圖。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n, m;\n    cin >> n >> m;\n    vector<vector<int>> a(n, vector<int>(m)), b = a;\n    for (auto &row : a)\n        for (int &x : row)\n            cin >> x;\n    vector<int> rs(n), cs(m);\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < m; j++) {\n            cin >> b[i][j];\n            rs[i] += b[i][j];\n            cs[j] += b[i][j];\n        }\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < m; j++)\n            cout << (a[i][j] ^ ((rs[i] + cs[j] - b[i][j]) % 2)) << ' ';\n        cout << '\\n';\n    }\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn, m = next(it), next(it)\na = [[next(it) for _ in range(m)] for _ in range(n)]\nb = [[next(it) for _ in range(m)] for _ in range(n)]\nrows = [sum(row) for row in b]\ncols = [sum(b[i][j] for i in range(n)) for j in range(m)]\nfor i in range(n):\n    row = [a[i][j] ^ ((rows[i]+cols[j]-b[i][j]) % 2) for j in range(m)]\n    print(\"\".join(f\"{x} \" for x in row))\n",
  "traceLabel": "尋寶地圖・列欄和與交會去重",
  "trace": [
    {
      "title": "預計算",
      "description": "轉換圖列和為 1、0、1，欄和為 1、1、0。",
      "cells": [
        "row:1 0 1",
        "col:1 1 0"
      ],
      "variables": [
        [
          "來源",
          "原轉換圖"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "第一列翻轉",
      "description": "各格同列同行去重後的總和為 2、1、1，因此翻轉後兩格。",
      "cells": [
        "原 1 0 1",
        "新 1 1 0"
      ],
      "variables": [
        [
          "第一列",
          "1 1 0"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "完成其餘列",
      "description": "第二列同列同行去重後的總和為 1、1、0；第三列為 1、2、1。",
      "cells": [
        "1 1 0",
        "1 0 0",
        "0 1 1"
      ],
      "variables": [
        [
          "輸出列數",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a211", {
  "topic": "arrays",
  "concept": "粉專抽獎・餘數篩選與索引",
  "goal": "按編號篩選隨機數總和，再換算中獎編號。",
  "explanation": [
    "基數 B 取最後一個隨機數，編號由 1 到 N。",
    "累加所有編號 i 滿足 i%B=1 的 r[i]，也可直接走訪 1、1+B、1+2B…。",
    "令 M=總和%N；M=0 時改為 N，最後用編號 M 取出對應的隨機數。"
  ],
  "complexity": "時間 O(N)，空間 O(N)。",
  "pitfall": "篩選的是留言編號，不是隨機數本身的餘數；結果 0 代表最後一則。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int &x : a)\n        cin >> x;\n    long long sum = 0;\n    int b = a.back();\n    for (int i = 1; i <= n; i += b)\n        sum += a[i - 1];\n    int m = (int)(sum % n);\n    if (m == 0)\n        m = n;\n    cout << m << ' ' << a[m - 1] << '\\n';\n}\n",
  "python": "import sys\ndata = list(map(int, sys.stdin.read().split()))\nn, a = data[0], data[1:]\nbase = a[-1]\ntotal = sum(a[i-1] for i in range(1, n+1, base))\nwinner = total % n or n\nprint(winner, a[winner-1])\n",
  "traceLabel": "粉專抽獎・餘數篩選與索引",
  "trace": [
    {
      "title": "選基數",
      "description": "最後一個隨機數是 2。",
      "cells": [
        "9",
        "7",
        "5",
        "6",
        "3",
        "2"
      ],
      "variables": [
        [
          "B",
          "2"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5
      ]
    },
    {
      "title": "選留言並累加",
      "description": "編號 1、3、5 除 2 餘 1，累加 9+5+3=17。",
      "cells": [
        "r1=9",
        "r3=5",
        "r5=3"
      ],
      "variables": [
        [
          "total",
          "17"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "決定中獎",
      "description": "17 mod 6=5，編號 5 的隨機數為 3。",
      "cells": [
        "5 3"
      ],
      "variables": [
        [
          "winner",
          "5"
        ],
        [
          "隨機數",
          "3"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a212", {
  "topic": "text",
  "concept": "情書解密・枚舉凱薩位移",
  "goal": "依序試 0～25，找首次出現 Love 或 love 的位移。",
  "explanation": [
    "整行讀取信件，包含空白與標點；對每個 k 產生轉換後文字。",
    "大寫字母以 A、小寫字母以 a 為基準，索引加 k 再模 26；其他字元原樣保留。",
    "用連續子字串搜尋 Love 或 love，從小到大枚舉保證第一次成功就是最小 k。"
  ],
  "complexity": "信長 L：時間 O(26L)，空間 O(L)。",
  "pitfall": "本題是索引加 k 的方向，z 會繞到 a；只接受 Love、love 兩種大小寫。",
  "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string s;\n    getline(cin, s);\n    for (int k = 0; k < 26; k++) {\n        string t = s;\n        for (char &c : t) {\n            if (c >= 'a' && c <= 'z')\n                c = (char)('a' + (c - 'a' + k) % 26);\n            else if (c >= 'A' && c <= 'Z')\n                c = (char)('A' + (c - 'A' + k) % 26);\n        }\n        if (t.find(\"Love\") != string::npos || t.find(\"love\") != string::npos) {\n            cout << k << '\\n';\n            break;\n        }\n    }\n}\n",
  "python": "s = input()\nfor k in range(26):\n    converted = []\n    for ch in s:\n        if \"a\" <= ch <= \"z\":\n            ch = chr(ord(\"a\")+(ord(ch)-ord(\"a\")+k) % 26)\n        elif \"A\" <= ch <= \"Z\":\n            ch = chr(ord(\"A\")+(ord(ch)-ord(\"A\")+k) % 26)\n        converted.append(ch)\n    text = \"\".join(converted)\n    if \"Love\" in text or \"love\" in text:\n        print(k)\n        break\n",
  "traceLabel": "情書解密・枚舉凱薩位移",
  "trace": [
    {
      "title": "原始信件",
      "description": "原文 Px ehox vhwbgz! 中沒有 love 或 Love。",
      "cells": [
        "Px ehox vhwbgz!"
      ],
      "variables": [
        [
          "k",
          "0"
        ],
        [
          "找到",
          "否"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "試到 k=6",
      "description": "所有字母加 6，保留原空白與標點後為 Vd knud bnchmf!，仍不含指定子字串。",
      "cells": [
        "Vd knud bnchmf!"
      ],
      "variables": [
        [
          "k",
          "6"
        ],
        [
          "找到",
          "否"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "k=7 成功",
      "description": "轉成 We love coding!，其中有連續的 love；較小位移都未成功。",
      "cells": [
        "We love coding!"
      ],
      "variables": [
        [
          "k",
          "7"
        ],
        [
          "輸出",
          "7"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a213", {
  "topic": "conditions",
  "concept": "免費停車・開區間篩選",
  "goal": "逐天列出嚴格介於界線間且不被 C 整除的號碼。",
  "explanation": [
    "每天枚舉 A+1 到 B-1，不包含左右兩個界線。",
    "只保留 x%C 不等於 0 的車位，按枚舉順序自然由小到大排列。",
    "候選清單空白時輸出 No free parking spaces.，否則用單一空白串接。"
  ],
  "complexity": "時間 O(Σ(B-A))，空間 O(max(B-A))。",
  "pitfall": "C=1 時所有整數都被排除；沒有結果不能只印空白行。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    while (n--) {\n        int a, b, c;\n        cin >> a >> b >> c;\n        vector<int> v;\n        for (int x = a + 1; x < b; x++)\n            if (x % c)\n                v.push_back(x);\n        if (v.empty())\n            cout << \"No free parking spaces.\";\n        else\n            for (int i = 0; i < (int)v.size(); i++)\n                cout << (i ? \" \" : \"\") << v[i];\n        cout << '\\n';\n    }\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn = next(it)\nfor _ in range(n):\n    a, b, c = next(it), next(it), next(it)\n    free = [str(x) for x in range(a+1, b) if x % c != 0]\n    print(\" \".join(free) if free else \"No free parking spaces.\")\n",
  "traceLabel": "免費停車・開區間篩選",
  "trace": [
    {
      "title": "第一天開區間",
      "description": "2 與 12 之間是 3～11。",
      "cells": [
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11"
      ],
      "variables": [
        [
          "C",
          "4"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ]
    },
    {
      "title": "排除整除者",
      "description": "排除 4、8，保留其他車位。",
      "cells": [
        "3",
        "5",
        "6",
        "7",
        "9",
        "10",
        "11"
      ],
      "variables": [
        [
          "第一行",
          "3 5 6 7 9 10 11"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ]
    },
    {
      "title": "第二天沒有車位",
      "description": "9 與 11 間只有 10，可被 5 整除。",
      "cells": [
        "10: 排除",
        "No free parking spaces."
      ],
      "variables": [
        [
          "第二天結果數",
          "0"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a214", {
  "topic": "read-calculate",
  "concept": "貨幣轉換・整數分數與四捨五入",
  "goal": "用整數表示匯率，精確比較預算與處理輸出規則。",
  "explanation": [
    "把每單位匯率乘 100：T=100、U=3090、J=28、E=3450；剩餘外幣為 (100n-m×rate)/rate。",
    "分子負數就輸出 No Money；正數但小於 rate/20，表示剩餘小於 0.05，直接輸出 0.00。",
    "其他情況將剩餘換成分後四捨五入，用 (200×分子+rate)//(2×rate) 得到分數，再拆成元與兩位小數。"
  ],
  "complexity": "時間 O(1)，空間 O(1)。",
  "pitfall": "小於 0.05 的特規在一般四捨五入之前；不能先四捨五入預算再扣款。",
  "cpp": "#include <iomanip>\n#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    long long n, m;\n    char code;\n    cin >> n >> m >> code;\n    long long rate = code == 'T' ? 100 : code == 'U' ? 3090 : code == 'J' ? 28 : 3450;\n    long long rem = 100 * n - m * rate;\n    if (rem < 0) {\n        cout << \"No Money\\n\";\n        return 0;\n    }\n    long long cents = (rem > 0 && 20 * rem < rate) ? 0 : (200 * rem + rate) / (2 * rate);\n    cout << code << ' ' << cents / 100 << '.' << setw(2) << setfill('0') << cents % 100\n         << '\\n';\n}\n",
  "python": "n = int(input())\nm, code = input().split()\nrate = {\"T\": 100, \"U\": 3090, \"J\": 28, \"E\": 3450}[code]\nremaining = 100*n-int(m)*rate\nif remaining < 0:\n    print(\"No Money\")\nelse:\n    cents = 0 if 0 < 20*remaining < rate else (200*remaining+rate)//(2*rate)\n    print(f\"{code} {cents//100}.{cents%100:02d}\")\n",
  "traceLabel": "貨幣轉換・整數分數與四捨五入",
  "trace": [
    {
      "title": "以百分台幣表達",
      "description": "預算 42000 台幣，花費 100 美元，每美元匯率整數 3090。",
      "cells": [
        "100n=4200000",
        "m×rate=309000"
      ],
      "variables": [
        [
          "rate",
          "3090"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "精確剩餘",
      "description": "分子為 3891000，剩餘美元是 3891000/3090。",
      "cells": [
        "3891000/3090"
      ],
      "variables": [
        [
          "是否不足",
          "否"
        ],
        [
          "是否小於0.05",
          "否"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "輸出至分",
      "description": "四捨五入得到 125922 分，也就是 1259.22 美元。",
      "cells": [
        "U 1259.22"
      ],
      "variables": [
        [
          "cents",
          "125922"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a215", {
  "topic": "grid",
  "concept": "梗圖著色・原黑格兩兩配對",
  "goal": "先收集每列原本黑格的位置，再成對填滿。",
  "explanation": [
    "對每列建立原黑格的位置清單，維持由左至右順序。",
    "每兩個位置成一對，把兩端之間所有格改成 1；清單不能因填色而新增黑格。",
    "若黑格數為奇數，最後未配對的黑格不延伸，右側維持原狀。"
  ],
  "complexity": "時間 O(mn)，空間 O(n)（Python 輸入緩衝 O(mn)）。",
  "pitfall": "不能把新塗黑的格子再當作配對端點；未配對的最後黑格不代表塗到最右端。",
  "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int m, n;\n    cin >> m >> n;\n    while (m--) {\n        vector<int> a(n), p;\n        for (int j = 0; j < n; j++) {\n            cin >> a[j];\n            if (a[j])\n                p.push_back(j);\n        }\n        for (int k = 0; k + 1 < (int)p.size(); k += 2)\n            for (int j = p[k]; j <= p[k + 1]; j++)\n                a[j] = 1;\n        for (int j = 0; j < n; j++)\n            cout << (j ? \" \" : \"\") << a[j];\n        cout << '\\n';\n    }\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nm, n = next(it), next(it)\nfor _ in range(m):\n    row = [next(it) for _ in range(n)]\n    black = [j for j in range(n) if row[j] == 1]\n    for k in range(0, len(black)-1, 2):\n        for j in range(black[k], black[k+1]+1):\n            row[j] = 1\n    print(*row)\n",
  "traceLabel": "梗圖著色・原黑格兩兩配對",
  "trace": [
    {
      "title": "第一列原黑格",
      "description": "原位置（從 1 起算）為 1、4、6、8。",
      "cells": [
        "1",
        "0",
        "0",
        "1",
        "0",
        "1",
        "0",
        "1"
      ],
      "variables": [
        [
          "配對",
          "(1,4)、(6,8)"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "title": "填滿兩對間隙",
      "description": "位置 2、3、7 塗黑，位置 5 保持 0。",
      "cells": [
        "1",
        "1",
        "1",
        "1",
        "0",
        "1",
        "1",
        "1"
      ],
      "variables": [
        [
          "第一列",
          "1 1 1 1 0 1 1 1"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "title": "第二列未配對",
      "description": "只有位置 2 是黑格，因此整列不延伸。",
      "cells": [
        "0",
        "1",
        "0",
        "0",
        "0",
        "0",
        "0",
        "0"
      ],
      "variables": [
        [
          "第二列",
          "0 1 0 0 0 0 0 0"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a216", {
  "topic": "arrays",
  "concept": "畢業典禮・穩定排序",
  "goal": "以學院及學制排序，相同鍵保持報名順序。",
  "explanation": [
    "讀入人數後逐行讀取報名資料，只在第一個分隔空白拆出學號與完整姓名，保留姓名內部的空白。從九碼學號取最後字元當學院，第一字元 4、6、8 當學制順序。",
    "學院字母升序優先，再依第一字元升序即為學士、碩士、博士。",
    "使用穩定排序，使兩項鍵都相同的學生維持原輸入順序；輸出學院: 姓名。"
  ],
  "complexity": "時間 O(N log N)，空間 O(N)。",
  "pitfall": "不要用完整學號作第三排序鍵，否則會破壞同學院同學制的報名順序。姓名是一整行中學號及第一個分隔空白後的所有內容，不能按全部空白切成多筆資料。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <limits>\n#include <string>\n#include <utility>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    cin.ignore(numeric_limits<streamsize>::max(), '\\n');\n    vector<pair<string, string>> v(n);\n    for (auto &x : v) {\n        string record;\n        getline(cin, record);\n        if (!record.empty() && record.back() == '\\r') record.pop_back();\n        size_t delimiter = record.find(' ');\n        x.first = record.substr(0, delimiter);\n        x.second = record.substr(delimiter + 1);\n    }\n    stable_sort(v.begin(), v.end(), [](const auto &a, const auto &b) {\n        return make_pair(a.first.back(), a.first[0]) <\n               make_pair(b.first.back(), b.first[0]);\n    });\n    for (auto &x : v)\n        cout << x.first.back() << \": \" << x.second << '\\n';\n}\n",
  "python": "import sys\nread = sys.stdin.readline\nn = int(read())\nstudents = [tuple(read().rstrip(\"\\r\\n\").split(\" \", 1)) for _ in range(n)]\nstudents.sort(key=lambda item: (item[0][-1], item[0][0]))\nfor student_id, name in students:\n    print(f\"{student_id[-1]}: {name}\")\n",
  "traceLabel": "畢業典禮・穩定排序",
  "trace": [
    {
      "title": "讀取排序鍵",
      "description": "Cora 是 S 博士，Avery 是 A 碩士，Luca 是 S 學士，Nora 是 A 學士。",
      "cells": [
        "Cora:S8",
        "Avery:A6",
        "Luca:S4",
        "Nora:A4"
      ],
      "variables": [
        [
          "學生數",
          "4"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "依學院與學制",
      "description": "A 學院先上台，同院學士先於碩士；S 學院學士先於博士。",
      "cells": [
        "Nora:A4",
        "Avery:A6",
        "Luca:S4",
        "Cora:S8"
      ],
      "variables": [
        [
          "排序鍵",
          "(學院,學制)"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "格式輸出",
      "description": "只輸出學院與姓名，不印學號。",
      "cells": [
        "A: Nora",
        "A: Avery",
        "S: Luca",
        "S: Cora"
      ],
      "variables": [
        [
          "輸出行數",
          "4"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a217", {
  "topic": "arrays",
  "concept": "不再傻傻等公車・前綴時間",
  "goal": "累加每段分鐘數，查詢時取模一天並補零。",
  "explanation": [
    "出發時刻先轉成 h×60+m 分鐘，每讀一段行車時間就累加並保存本站到達分鐘。",
    "第一站也需要加第一段行車時間，不能直接使用出發時刻。",
    "查詢以 0 結束；每站分鐘對 1440 取餘數，除 60 得時、餘數得分，兩者都補兩位。"
  ],
  "complexity": "時間 O(n+p)，空間 O(n)。",
  "pitfall": "跨過午夜甚至多天都要對 1440 取模；查詢站號從 1 開始。",
  "cpp": "#include <iomanip>\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n, h, m;\n    cin >> n >> h >> m;\n    int now = h * 60 + m;\n    vector<int> arrival(n + 1);\n    for (int i = 1, t; i <= n; i++) {\n        cin >> t;\n        now += t;\n        arrival[i] = now;\n    }\n    int p;\n    while (cin >> p && p) {\n        int t = arrival[p] % 1440;\n        cout << setfill('0') << setw(2) << t / 60 << ':' << setw(2) << t % 60 << '\\n';\n    }\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn, h, m = next(it), next(it), next(it)\nnow = 60*h+m\narrival = [now]\nfor _ in range(n):\n    now += next(it)\n    arrival.append(now)\nfor station in it:\n    if station == 0:\n        break\n    value = arrival[station] % 1440\n    print(f\"{value//60:02d}:{value%60:02d}\")\n",
  "traceLabel": "不再傻傻等公車・前綴時間",
  "trace": [
    {
      "title": "第一站",
      "description": "08:45 加 20 分鐘，09:05 到站。",
      "cells": [
        "出發525分",
        "第1站545分"
      ],
      "variables": [
        [
          "輸出",
          "09:05"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "第三站",
      "description": "第 2 站加 10 分為 09:15，第 3 站再加 60 分為 10:15。",
      "cells": [
        "第2站555分",
        "第3站615分"
      ],
      "variables": [
        [
          "輸出",
          "10:15"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "第四站",
      "description": "再加 25 分鐘，得到 10:40。",
      "cells": [
        "第4站640分",
        "查詢結束0"
      ],
      "variables": [
        [
          "輸出",
          "10:40"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a218", {
  "topic": "read-calculate",
  "concept": "基礎代謝率・十分位整數公式",
  "goal": "依性別選公式，先算十倍 BMR 再精確格式化。",
  "explanation": [
    "輸入順序是性別 G、年齡 A、身高 H、體重 W，要正確對應公式。",
    "所有係數只有一位小數，可用十倍公式：男性 137W+50H-68A+660，女性 96W+18H-47A+6550。",
    "結果一定是十分之一的倍數，所以小數第二位補 0 即可；分開處理正負號，避免負值被向下整除。"
  ],
  "complexity": "時間 O(N)，額外空間 O(1)（Python 輸入緩衝 O(N)）。",
  "pitfall": "G=1 是男性、G=0 是女性；輸出固定兩位小數，即使是整數也要 .00。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    while (n--) {\n        long long g, a, h, w;\n        cin >> g >> a >> h >> w;\n        long long value =\n            g ? 137 * w + 50 * h - 68 * a + 660 : 96 * w + 18 * h - 47 * a + 6550;\n        if (value < 0) {\n            cout << '-';\n            value = -value;\n        }\n        cout << value / 10 << '.' << value % 10 << '0' << '\\n';\n    }\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn = next(it)\nfor _ in range(n):\n    g, a, h, w = next(it), next(it), next(it), next(it)\n    value = 137*w+50*h-68*a+660 if g == 1 else 96*w+18*h-47*a+6550\n    sign = \"-\" if value < 0 else \"\"\n    value = abs(value)\n    print(f\"{sign}{value//10}.{value%10}0\")\n",
  "traceLabel": "基礎代謝率・十分位整數公式",
  "trace": [
    {
      "title": "男性資料",
      "description": "25 歲、175 公分、70 公斤，以男性公式。",
      "cells": [
        "137×70",
        "50×175",
        "-68×25",
        "+660"
      ],
      "variables": [
        [
          "十倍 BMR",
          "17300"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "女性資料",
      "description": "31 歲、163 公分、58 公斤，以女性公式。",
      "cells": [
        "96×58",
        "18×163",
        "-47×31",
        "+6550"
      ],
      "variables": [
        [
          "十倍 BMR",
          "13595"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "固定兩位小數",
      "description": "十倍值除以 10 後，輸出至百分位。",
      "cells": [
        "1730.00",
        "1359.50"
      ],
      "variables": [
        [
          "輸出行數",
          "2"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a219", {
  "topic": "simulation",
  "concept": "大吃大喝・交替購買與精確文句",
  "goal": "從時間零開始交替購買，當指定食物買不起便停止。",
  "explanation": [
    "兩種食物價格為 32、55，初始種類是 K；若錢足夠，先扣款再輸出該次紀錄。",
    "剩餘金額大於 1、等於 1、等於 0 分別使用 dollars、dollar、doesn't have money.。",
    "成功後時間加 M、種類切換；一開始就買不起才輸出 Wayne can't eat and drink.，買過後停止不加其他文字。"
  ],
  "complexity": "成功次數 Q：時間 O(Q)，C++ 額外空間 O(1)（Python 輸出清單 O(Q)）。",
  "pitfall": "第一次是時間 0；買不起當次種類就停，不能跳過改買另一種。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int money, m, k;\n    cin >> money >> m >> k;\n    int cost[2] = {32, 55}, t = 0;\n    bool any = false;\n    while (money >= cost[k]) {\n        money -= cost[k];\n        any = true;\n        cout << t << \": Wayne \" << (k == 0 ? \"eats an Apple pie\" : \"drinks a Corn soup\")\n             << \", and now he \";\n        if (money == 0)\n            cout << \"doesn't have money.\";\n        else\n            cout << \"has \" << money << (money == 1 ? \" dollar.\" : \" dollars.\");\n        cout << '\\n';\n        t += m;\n        k = 1 - k;\n    }\n    if (!any)\n        cout << \"Wayne can't eat and drink.\\n\";\n}\n",
  "python": "money, interval, kind = map(int, input().split())\ncosts = [32, 55]\nactions = [\"eats an Apple pie\", \"drinks a Corn soup\"]\ntime = 0\nlines = []\nwhile money >= costs[kind]:\n    money -= costs[kind]\n    if money == 0:\n        tail = \"doesn't have money.\"\n    elif money == 1:\n        tail = \"has 1 dollar.\"\n    else:\n        tail = f\"has {money} dollars.\"\n    lines.append(f\"{time}: Wayne {actions[kind]}, and now he {tail}\")\n    time += interval\n    kind = 1-kind\nprint(\"\\n\".join(lines) if lines else \"Wayne can't eat and drink.\")\n",
  "traceLabel": "大吃大喝・交替購買與精確文句",
  "trace": [
    {
      "title": "時間 0",
      "description": "先吃 32 元蘋果派，200-32=168。",
      "cells": [
        "Apple pie",
        "剩168"
      ],
      "variables": [
        [
          "時間",
          "0"
        ],
        [
          "money",
          "168"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "時間 7 與 14",
      "description": "喝湯後剩 113，再吃派後剩 81。",
      "cells": [
        "7:剩113",
        "14:剩81"
      ],
      "variables": [
        [
          "下一種類",
          "玉米濃湯"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "時間 21 並停止",
      "description": "喝湯後剩 26，下一份派要 32 元，不能繼續。",
      "cells": [
        "21:剩26",
        "下一份派32"
      ],
      "variables": [
        [
          "成功次數",
          "4"
        ],
        [
          "停止時間檢查",
          "28"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a220", {
  "topic": "search-optimization",
  "concept": "比對卡片・每位置找最近同值",
  "goal": "對每張老師卡片枚舉學生位置，取同值距離的最小值。",
  "explanation": [
    "老師第 i 張只與學生數字相同的位置比較，候選距離為 |i-j|。",
    "枚舉全部學生卡片取最小距離，沒有同值就輸出 -1。",
    "每張老師卡片獨立計算，學生卡片不會用掉，重複數字可以被多次匹配。"
  ],
  "complexity": "時間 O(N²)，空間 O(N)。",
  "pitfall": "不能只取第一次同值位置；有多張相同卡片時應選距離最近者。",
  "cpp": "#include <algorithm>\n#include <cstdlib>\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    vector<int> a(n), b(n);\n    for (int &x : a)\n        cin >> x;\n    for (int &x : b)\n        cin >> x;\n    for (int i = 0; i < n; i++) {\n        int best = n;\n        for (int j = 0; j < n; j++)\n            if (a[i] == b[j])\n                best = min(best, abs(i - j));\n        cout << (i ? \" \" : \"\") << (best == n ? -1 : best);\n    }\n    cout << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nn = next(it)\nteacher = [next(it) for _ in range(n)]\nstudent = [next(it) for _ in range(n)]\nanswer = []\nfor i, value in enumerate(teacher):\n    distances = [abs(i-j) for j in range(n) if student[j] == value]\n    answer.append(min(distances) if distances else -1)\nprint(*answer)\n",
  "traceLabel": "比對卡片・每位置找最近同值",
  "trace": [
    {
      "title": "老師第一張 4",
      "description": "學生的 4 在第 2、4 張，距離 1、3，選 1。",
      "cells": [
        "距離1",
        "距離3"
      ],
      "variables": [
        [
          "answer[1]",
          "1"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "中間兩張",
      "description": "老師第 2 張 8 距離 1；第 3 張 4 的兩個匹配距離皆為 1。",
      "cells": [
        "8→1",
        "4→1"
      ],
      "variables": [
        [
          "答案前綴",
          "1 1 1"
        ]
      ],
      "active": [
        0,
        1
      ]
    },
    {
      "title": "老師最後一張 1",
      "description": "學生的 1 在第 1 張，距離 3。",
      "cells": [
        "1→3",
        "1 1 1 3"
      ],
      "variables": [
        [
          "輸出",
          "1 1 1 3"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a221", {
  "topic": "simulation",
  "concept": "戰備存糧・每日最少守衛",
  "goal": "每日把糧食集中到最少倉庫，以剩餘總量模擬消耗。",
  "explanation": [
    "剩下 food 單位時，至少需 ceil(food/E) 間倉庫，因每間容量為 E；集中搬運可實現這個下界。",
    "每天用最少守衛可以讓當天消耗最小，而且下一天剩餘糧食越多就不會更早耗盡，因此每天都集中是最優策略。",
    "初始 food=N×E，非零時每天減去 ceil(food/E) 並累加天數；N 或 E 為零直接輸出 0，避免除零。多筆輸入以單獨 -1 結束。"
  ],
  "complexity": "耗盡天數 D：時間 O(D)，空間 O(1)（Python 輸入緩衝 O(資料筆數)）。",
  "pitfall": "守衛數不是一直等於 N；可搬糧食後，空倉庫不需要守衛。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n, e;\n    while (cin >> n && n != -1) {\n        cin >> e;\n        int food = n * e, days = 0;\n        while (food > 0) {\n            int guards = (food + e - 1) / e;\n            food -= guards;\n            ++days;\n        }\n        cout << days << '\\n';\n    }\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nfor n in it:\n    if n == -1:\n        break\n    e = next(it)\n    food, days = n*e, 0\n    while food > 0:\n        guards = (food+e-1)//e\n        food -= guards\n        days += 1\n    print(days)\n",
  "traceLabel": "戰備存糧・每日最少守衛",
  "trace": [
    {
      "title": "第一筆 2 間容量 6",
      "description": "初始 12，第 1～3 天各用 2 名守衛，剩 10、8、6。",
      "cells": [
        "12",
        "10",
        "8",
        "6"
      ],
      "variables": [
        [
          "經過天數",
          "3"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "集中到一間",
      "description": "剩 6 只需 1 名守衛，再用 6 天，總共 9 天。",
      "cells": [
        "6→5→4→3→2→1→0"
      ],
      "variables": [
        [
          "第一筆輸出",
          "9"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "第二筆 4 間容量 4",
      "description": "每日剩餘為 16→12→9→6→4→3→2→1→0，共 8 天。",
      "cells": [
        "16",
        "12",
        "9",
        "6",
        "4",
        "3",
        "2",
        "1",
        "0"
      ],
      "variables": [
        [
          "第二筆輸出",
          "8"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a222", {
  "topic": "simulation",
  "concept": "資料分類・分組乘積與字串串接",
  "goal": "依目前整數位數套規則，每次轉回整數去掉前導零。",
  "explanation": [
    "四位數拆成兩組，先將各組轉成整數：小於 10 原樣保留，否則用十位乘個位，再將兩組結果串接。",
    "三位數 abc 產生 a×b 與 b×c 的十進位結果並串接；兩位數直接相乘。",
    "每回合把串接結果轉成整數，再判斷新位數，直到小於 10。像 03 應視為 3，不能錯算成 0。"
  ],
  "complexity": "回合數 I、每回合至多四位：時間 O(I)，空間 O(1)。",
  "pitfall": "串接不是相加；四位數每組要先去前導零，這與三位數的規則不同。",
  "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int n;\n    cin >> n;\n    auto part = [](int x) { return x < 10 ? x : (x / 10) * (x % 10); };\n    while (n >= 10) {\n        string s = to_string(n);\n        if (s.size() == 4)\n            n = stoi(to_string(part(n / 100)) + to_string(part(n % 100)));\n        else if (s.size() == 3) {\n            int a = n / 100, b = n / 10 % 10, c = n % 10;\n            n = stoi(to_string(a * b) + to_string(b * c));\n        } else\n            n = (n / 10) * (n % 10);\n    }\n    cout << n << '\\n';\n}\n",
  "python": "n = int(input())\ndef group_value(x):\n    return x if x < 10 else (x//10)*(x % 10)\nwhile n >= 10:\n    if n >= 1000:\n        n = int(str(group_value(n//100))+str(group_value(n % 100)))\n    elif n >= 100:\n        a, b, c = n//100, (n//10) % 10, n % 10\n        n = int(str(a*b)+str(b*c))\n    else:\n        n = (n//10)*(n % 10)\nprint(n)\n",
  "traceLabel": "資料分類・分組乘積與字串串接",
  "trace": [
    {
      "title": "四位數 1234",
      "description": "12 得 1×2=2，34 得 3×4=12，串接為 212。",
      "cells": [
        "12→2",
        "34→12",
        "212"
      ],
      "variables": [
        [
          "n",
          "212"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "三位數 212",
      "description": "2×1=2，1×2=2，串接為 22。",
      "cells": [
        "2",
        "2",
        "22"
      ],
      "variables": [
        [
          "n",
          "22"
        ]
      ],
      "active": [
        0,
        1,
        2
      ]
    },
    {
      "title": "兩位數 22",
      "description": "2×2=4，已為一位數，停止。",
      "cells": [
        "22→4"
      ],
      "variables": [
        [
          "輸出",
          "4"
        ]
      ],
      "active": [
        0
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a223", {
  "topic": "text",
  "concept": "雜訊移除・保留字元後判迴文",
  "goal": "刪掉指定數字字元，保持其餘字元原順序再鏡像比較。",
  "explanation": [
    "T 應以字串讀入，指定的 N 也以一字元處理。",
    "逐字保留不等於 N 的字元，得到刪除雜訊後的字串。",
    "將保留字串與反轉結果比較，相等輸出 Yes，否則輸出 No；前導零不能丟失。"
  ],
  "complexity": "時間 O(|T|)，空間 O(|T|)。",
  "pitfall": "這題不要求偶數長度；也不能把保留字串轉成整數而消除開頭的 0。",
  "cpp": "#include <algorithm>\n#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    string t, n, s;\n    cin >> t >> n;\n    for (char c : t)\n        if (c != n[0])\n            s += c;\n    string rev = s;\n    reverse(rev.begin(), rev.end());\n    cout << (s == rev ? \"Yes\" : \"No\") << '\\n';\n}\n",
  "python": "text, noise = input().split()\nclean = \"\".join(ch for ch in text if ch != noise)\nprint(\"Yes\" if clean == clean[::-1] else \"No\")\n",
  "traceLabel": "雜訊移除・保留字元後判迴文",
  "trace": [
    {
      "title": "指定雜訊",
      "description": "8081708 中所有 8 都要刪除。",
      "cells": [
        "8",
        "0",
        "8",
        "1",
        "7",
        "0",
        "8"
      ],
      "variables": [
        [
          "noise",
          "8"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ]
    },
    {
      "title": "保留原順序",
      "description": "留下 0、1、7、0，前導 0 仍存在。",
      "cells": [
        "0",
        "1",
        "7",
        "0"
      ],
      "variables": [
        [
          "clean",
          "0170"
        ]
      ],
      "active": [
        0,
        1,
        2,
        3
      ]
    },
    {
      "title": "鏡像比較",
      "description": "0170 反轉為 0710，中間 1 與 7 不相等。",
      "cells": [
        "0170",
        "0710"
      ],
      "variables": [
        [
          "輸出",
          "No"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
  defineToiBeginnerLesson("a224", {
  "topic": "simulation",
  "concept": "手遊廣告・順序挑戰與立即停止",
  "goal": "只在戰力嚴格較大時吸收怪物，失敗立即停止。",
  "explanation": [
    "依輸入順序處理怪物，不能先排序或跳過較強的怪物。",
    "若 A>T，擊敗後執行 A+=T；否則直接結束迴圈，不再挑戰後方。",
    "最後輸出當時戰力；相等也算失敗，不會增加任何戰力。"
  ],
  "complexity": "時間 O(M)，額外空間 O(1)（Python 輸入緩衝 O(M)）。",
  "pitfall": "比較條件必須是嚴格大於；失敗後即使後面較弱也不能再打。",
  "cpp": "#include <iostream>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    int m;\n    long long a;\n    cin >> m >> a;\n    for (int i = 0; i < m; i++) {\n        long long t;\n        cin >> t;\n        if (a <= t)\n            break;\n        a += t;\n    }\n    cout << a << '\\n';\n}\n",
  "python": "import sys\nit = iter(map(int, sys.stdin.read().split()))\nm, power = next(it), next(it)\nfor _ in range(m):\n    monster = next(it)\n    if power <= monster:\n        break\n    power += monster\nprint(power)\n",
  "traceLabel": "手遊廣告・順序挑戰與立即停止",
  "trace": [
    {
      "title": "第一隻 2",
      "description": "6>2，可以擊敗並吸收為 8。",
      "cells": [
        "6 + 2 = 8"
      ],
      "variables": [
        [
          "power",
          "8"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "第二隻 7",
      "description": "8>7，再吸收為 15。",
      "cells": [
        "8 + 7 = 15"
      ],
      "variables": [
        [
          "power",
          "15"
        ]
      ],
      "active": [
        0
      ]
    },
    {
      "title": "第三隻 20",
      "description": "15≤20，立即停止，最後一隻 1 不再處理。",
      "cells": [
        "20:失敗",
        "1:不挑戰"
      ],
      "variables": [
        [
          "輸出",
          "15"
        ]
      ],
      "active": [
        0,
        1
      ]
    }
  ]
}),
];

