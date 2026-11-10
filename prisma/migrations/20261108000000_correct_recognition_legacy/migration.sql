-- Correct ONLY exact legacy signatures; preserve IDs, answer keys and learner progress.
-- Shared by deploy migration and the recognition importer.

UPDATE "Problem"
SET "code" = replace(('struct student_info{' ||
char(10) ||
'    int math, chinese, english ;' ||
char(10) ||
'} std[20];' ||
char(10) ||
'int main () {' ||
char(10) ||
'    int n = 20 ;' ||
char(10) ||
'    int best_ID = 0 ;' ||
char(10) ||
'    int best_sum = std[0].math + std[0].chinese + std[0].english;' ||
char(10) ||
'    for ( int i = 1 ; i < n ; i = i + 1 ) {' ||
char(10) ||
'        int sum = std[i].math + std[i].chinese + std[i].english ;' ||
char(32) ||
char(10) ||
'        if ( sum > best_sum ) {' ||
char(10) ||
'            best_ID = i ;' ||
char(10) ||
'            best_sum = sum ;' ||
char(10) ||
'        }else if ( ___________ ){' ||
char(10) ||
'            best_ID = i ;' ||
char(10) ||
'        }' ||
char(10) ||
'    }' ||
char(10) ||
'}'), char(13), ''),
    "explanation" = replace('std 是含 20 位學生的結構陣列變數，不是 typedef 型別別名。總分較高時已在前一分支更新；總分相同時只在數學嚴格較高才換人，數學也相同則保留先掃到、學號較小者，因此選第 2 個判斷式。選項的 and 表示邏輯且，C11 可使用 <iso646.h> 或改寫成 &&。', char(13), '')
WHERE "type" IS replace('RECOGNITION', char(13), '')
  AND "title" IS replace('APCS 2021/01 B 卷 第 11 題', char(13), '')
  AND "paper" IS replace('B 卷', char(13), '')
  AND "sourceNumber" IS 11
  AND "category" IS replace('C', char(13), '')
  AND "statement" IS replace('為了找到 n 位學生的成績當中成績最好的，先比總分高的，若總分相同時則比照數學成績，數學成績相同時則依照學號較小的為主，下列的判斷式應該如何選擇才能保證達成條件？', char(13), '')
  AND "code" IS replace(('typedef struct student_info{' ||
char(10) ||
'    int math, chinese, english ;' ||
char(10) ||
'} std[20];' ||
char(10) ||
'int main () {' ||
char(10) ||
'    int n = 20 ;' ||
char(10) ||
'    int best_ID = 0 ;' ||
char(10) ||
'    int best_sum = std[0].math + std[0].chinese + std[0].english;' ||
char(10) ||
'    for ( int i = 1 ; i < n ; i = i + 1 ) {' ||
char(10) ||
'        int sum = std[i].math + std[i].chinese + std[i].english ;' ||
char(32) ||
char(10) ||
'        if ( sum > best_sum ) {' ||
char(10) ||
'            best_ID = i ;' ||
char(10) ||
'            best_sum = sum ;' ||
char(10) ||
'        }else if ( ___________ ){' ||
char(10) ||
'            best_ID = i ;' ||
char(10) ||
'        }' ||
char(10) ||
'    }' ||
char(10) ||
'}'), char(13), '')
  AND "options" IS replace('["sum >= best_sum and std[ i ].math >= std[ best_ID ].math","sum >= best_sum and std[ i ].math >  std[ best_ID ].math","sum > best_sum  and std[ i ].math >  std[ best_ID ].math","sum > best_sum  and std[ i ].math >= std[ best_ID ].math"]', char(13), '')
  AND "answerIndex" IS 1
  AND "explanation" IS NULL;

UPDATE "Problem"
SET "code" = replace(('bool isPalindrome(char *s, int len) {' ||
char(10) ||
'	Init(&X);' ||
char(10) ||
'	for (int i = 0; i < len; i = i + 1)' ||
char(10) ||
'		Add(X, s[i]);' ||
char(10) ||
'' ||
char(9) ||
char(10) ||
'	int n = len;' ||
char(10) ||
'	while (n > 1) {' ||
char(10) ||
'		if (getFirst(X) != getLast(X))' ||
char(10) ||
'			return 0;' ||
char(10) ||
'		n = n - 2;' ||
char(10) ||
'	}' ||
char(10) ||
'	Clear(&X);' ||
char(10) ||
'	return 1;' ||
char(10) ||
'}'), char(13), ''),
    "explanation" = replace('需要從兩端取出資料比較，因此 X 應為雙向佇列。每次比較首尾字元，直到剩下至多一個；這是抽象資料結構片段，Init、Clear、Add、getFirst、getLast 由實作提供，C11 的 bool 需引入 <stdbool.h>。', char(13), '')
WHERE "type" IS replace('RECOGNITION', char(13), '')
  AND "title" IS replace('APCS 2021/11 A 卷 第 11 題', char(13), '')
  AND "paper" IS replace('A 卷', char(13), '')
  AND "sourceNumber" IS 11
  AND "category" IS replace('C', char(13), '')
  AND "statement" IS replace('上述的程式碼透過資料結構Ｘ實作，可以判斷傳入的字串ｓ是不是迴文的結構，以下是資料結構Ｘ支援的功能，請問哪個選項最符合資料結構Ｘ：

- Init(&X): 初始化資料結構Ｘ
- Clear(&X): 清除資料結構Ｘ
- Add(X, d): 將資料ｄ放入Ｘ內
- getFirst(X): 將Ｘ第一個資料回傳並從中移除
- getLast(X): 將Ｘ最後一個資料回傳並從中移除', char(13), '')
  AND "code" IS replace(('bool isPalindrome(char *s, int len) {' ||
char(10) ||
'	Init(&X);' ||
char(10) ||
'	for (int i = 0; i < len; i = i + 1)' ||
char(10) ||
'		Add(X, s[i]);' ||
char(10) ||
'' ||
char(9) ||
char(10) ||
'	int n = len;' ||
char(10) ||
'	while (n > 1) {' ||
char(10) ||
'		if (getFirst(X) != getLast(X)))' ||
char(10) ||
'			return 0;' ||
char(10) ||
'		n = n - 2;' ||
char(10) ||
'	}' ||
char(10) ||
'	Clear(&X);' ||
char(10) ||
'	return 1;' ||
char(10) ||
'}'), char(13), '')
  AND "options" IS replace('["堆疊( stack )","佇列( queue )","雙向佇列( double ended queue )","優先佇列( priority_queue )"]', char(13), '')
  AND "answerIndex" IS 2
  AND "explanation" IS NULL;

UPDATE "Problem"
SET "statement" = replace('下段函式為檢查一個陣列(array)內的數字是否「剛好」覆蓋一段區域，若符合回傳 1，否則回傳 0。例如 {5, 3, 4, 2, 6} 完美覆蓋 2 ~ 6，回傳 1，而 {3, 5, 2, 6, 7} 缺了 4，以及 {2, 3, 2, 4, 5} 多了一個 2，需回傳 0。

請問在空格中應該填入的程式碼為何?

值域前提：1 ≤ n ≤ MAXN，且每個 a[i] 都滿足 0 ≤ a[i] < MAXN。', char(13), ''),
    "code" = replace(('enum { MAXN = 100000 };' ||
char(10) ||
'int f(int a[], int n) {' ||
char(10) ||
'    int iMax = a[0];' ||
char(10) ||
'    for (int i = 1; i < n; i++){' ||
char(10) ||
'        if (a[i] > iMax){' ||
char(10) ||
'            iMax = a[i];' ||
char(32) ||
char(32) ||
char(32) ||
char(32) ||
char(10) ||
'        }' ||
char(10) ||
'    }' ||
char(10) ||
'    int iMin = a[0];' ||
char(10) ||
'    for (int i = 1; i < n; i++){' ||
char(10) ||
'        if (a[i] < iMin){' ||
char(10) ||
'            iMin = a[i];' ||
char(10) ||
'        }' ||
char(10) ||
'    }' ||
char(10) ||
'' ||
char(32) ||
char(32) ||
char(32) ||
char(32) ||
char(10) ||
'   int ok = 1;' ||
char(10) ||
'   if (iMax - iMin == n-1) {' ||
char(10) ||
'        int cnt[MAXN] = {0};' ||
char(10) ||
'        for (int i = 0; i < n; i++) {' ||
char(10) ||
'            if (cnt[a[i]] == 1){' ||
char(10) ||
'                __1__;' ||
char(32) ||
char(10) ||
'            }' ||
char(10) ||
'            cnt[a[i]] = 1;' ||
char(10) ||
'        }' ||
char(10) ||
'        if (ok){' ||
char(10) ||
'            __2__;' ||
char(10) ||
'        }' ||
char(10) ||
'   }' ||
char(10) ||
'   __3__;' ||
char(10) ||
'}'), char(13), ''),
    "explanation" = replace('先確認最大值與最小值之差為 n−1，再檢查每個值只出現一次；重複時令 ok=0，掃完仍為真才回傳 1，其餘回傳 0。cnt 每次呼叫都必須清零；題目已限定非空陣列及 0 ≤ a[i] < MAXN，才能安全使用 a[0] 與 cnt[a[i]]。enum 常數讓 C11 的 cnt 成為可零初始化的固定大小陣列。', char(13), '')
WHERE "type" IS replace('RECOGNITION', char(13), '')
  AND "title" IS replace('APCS 2022/01 第一場 第 20 題', char(13), '')
  AND "paper" IS replace('第一場', char(13), '')
  AND "sourceNumber" IS 20
  AND "category" IS replace('C', char(13), '')
  AND "statement" IS replace('下段函式為檢查一個陣列(array)內的數字是否「剛好」覆蓋一段區域，若符合回傳 1，否則回傳 0。例如 {5, 3, 4, 2, 6} 完美覆蓋 2 ~ 6，回傳 1，而 {3, 5, 2, 6, 7} 缺了 4，以及 {2, 3, 2, 4, 5} 多了一個 2，需回傳 0。

請問在空格中應該填入的程式碼為何?', char(13), '')
  AND "code" IS replace(('const int MAXN = 1e5;' ||
char(10) ||
'int f(int a[], int n) {' ||
char(10) ||
'    int iMax = a[0];' ||
char(10) ||
'    for (int i = 1; i < n; i++){' ||
char(10) ||
'        if (a[i] > iMax){' ||
char(10) ||
'            iMax = a[i];' ||
char(32) ||
char(32) ||
char(32) ||
char(32) ||
char(10) ||
'        }' ||
char(10) ||
'    }' ||
char(10) ||
'    int iMin = a[0];' ||
char(10) ||
'    for (int i = 1; i < n; i++){' ||
char(10) ||
'        if (a[i] < iMin){' ||
char(10) ||
'            iMin = a[i];' ||
char(10) ||
'        }' ||
char(10) ||
'    }' ||
char(10) ||
'' ||
char(32) ||
char(32) ||
char(32) ||
char(32) ||
char(10) ||
'   int ok = 1;' ||
char(10) ||
'   if (iMax - iMin == n-1) {' ||
char(10) ||
'        int cnt[MAXN];' ||
char(10) ||
'        for (int i = 0; i < n; i++) {' ||
char(10) ||
'            if (cnt[a[i]] == 1){' ||
char(10) ||
'                __1__;' ||
char(32) ||
char(10) ||
'            }' ||
char(10) ||
'            cnt[a[i]] = 1;' ||
char(10) ||
'        }' ||
char(10) ||
'        if (ok){' ||
char(10) ||
'            __2__;' ||
char(10) ||
'        }' ||
char(10) ||
'   }' ||
char(10) ||
'   __3__;' ||
char(10) ||
'}'), char(13), '')
  AND "options" IS replace('["ok = 0\nreturn 1\nreturn 0","return 1\nok = 0\nreturn 0","return 0\nok = 0\nreturn 1","return 1\nreturn 0\nok = 0"]', char(13), '')
  AND "answerIndex" IS 0
  AND "explanation" IS NULL;

UPDATE "Problem"
SET "code" = replace('int f(int pay) {
    if (pay <= 40)
        return 0;
    if (pay <= 100)
        return (pay - 40) * 0.1;
    if (pay <= 150)
        return pay * 0.2;
    return (pay - 150) * 0.3 + 12.5 + 6;
}', char(13), '')
WHERE "type" IS replace('RECOGNITION', char(13), '')
  AND "title" IS replace('APCS 2022/01 第二場 第 13 題', char(13), '')
  AND "paper" IS replace('第二場', char(13), '')
  AND "sourceNumber" IS 13
  AND "category" IS replace('C', char(13), '')
  AND "statement" IS replace('規則：
+ 40 以下免稅
+ 40 ~ 100 稅率 0.1
+ 100 ~ 150 稅率 0.25
+ 超過部分 稅率 0.3

上方程式碼是錯的，要如何更改？', char(13), '')
  AND "code" IS replace('int f(int pay) {
    if (pay <= 40)
        return 0;
    if (pay <= 100)
        return (pay - 40) * 0.1
    if (pay <= 150)
        return pay * 0.2;
    return (pay - 150) * 0.3 + 12.5 + 6;
}', char(13), '')
  AND "options" IS replace('["第 4 和 6 行要變成 else if","第 7 行為 pay * 0.25 - 19","第 7 行為 (pay - 100) * 0.25 + 10","第 7 行為 (pay - 100) * 0.25 + 14"]', char(13), '')
  AND "answerIndex" IS 1
  AND "explanation" IS replace('減掉多算的：$40\times0.25+60(0.25-0.1) = 19$', char(13), '');

UPDATE "Problem"
SET "options" = replace('["第 3 行要改成 return 0;","第 4 行要改成 return (n - 1) * n + sum(n - 1);","第 2 行要改成 if (n == 2)","程式碼沒有錯"]', char(13), ''),
    "explanation" = replace('行號依畫面完整程式從函式宣告開始計算：第 2 行是 if，第 3 行才是 return 1。目標總和為 Σ(j(j+1)), j=1…9，共 330；原函式 sum(10) 回傳 331，多算了基底的 1。因此將第 3 行改為 return 0;，保留第 2 行的條件，即可回傳 330。若改第 2 行會直接回傳 0。原 main 僅呼叫函式，沒有印出回傳值。', char(13), '')
WHERE "type" IS replace('RECOGNITION', char(13), '')
  AND "title" IS replace('APCS 2022/06 第二場 第 7 題', char(13), '')
  AND "paper" IS replace('第二場', char(13), '')
  AND "sourceNumber" IS 7
  AND "category" IS replace('C', char(13), '')
  AND "statement" IS replace('該程式碼想要計算 $(1\times2) + (2\times3) + (3\times4)\ +\ ...\ + \ (9\times10)$， 但程式碼有錯，請問下列除錯方法何者正確？', char(13), '')
  AND "code" IS replace('int sum(int n) {
    if (n == 1)
        return 1;
    return n * (n - 1) + sum(n - 1);
}

int main() {
    sum(10);
}', char(13), '')
  AND "options" IS replace('["第 2 行要改成 return 0;","第 3 行要改成 return (n - 1) * n + sum(n - 1);","第 1 行要改成 if (n == 2)","程式碼沒有錯"]', char(13), '')
  AND "answerIndex" IS 0
  AND "explanation" IS NULL;
