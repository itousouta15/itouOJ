-- Correct only the two unchanged APCS 2016/03 seed questions.
-- Preserve custom explanations, edited questions, answer keys, IDs and progress.
-- Fresh imports receive the same corrections from the JSON seed.
-- Normalize only SQL literal CRs so LF and CRLF checkouts match JSON strings.

UPDATE "Problem"
SET "explanation" = replace('要移除 current 的下一個節點，應讓 list[current].next 直接指向被略過節點的下一個節點：

```cpp
list[current].next = list[list[current].next].next;
```

外層的 if 已確認 list[current].next != -1，因此可以存取這個下一個節點。current 是陣列索引，必須先以 list[current] 取得節點，再讀取它的 next 欄位。

以 current = 3 為例，原本的連結是 3 → 1 → 2 → -1。因為 list[3].next = 1、list[1].next = 2，賦值後 list[3].next = 2，連結變成 3 → 2 → -1，其餘節點的順序不變。這只改變連結、略過 list[1]，不會清除或搬動陣列中的資料。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = 'APCS 2016/03 第 6 題'
  AND "sourceNumber" = 6
  AND "statement" = replace('List 是一個陣列，裡面的元素是 element，它的定義如下。
List 中的每一個 element 利用 next 這個整數變數來記錄下一個 element 在陣列中的位置，如果沒有下一個 element，next 就會記錄 -1。所有的 element 串成了一個串列 (linked list)。例如在 list 中有三筆資料：

| 1                    | 2                    | 3                   |
| -------------------- | -------------------- | ------------------- |
| data=''a''<br>next=''2'' | data=''b''<br>next=''-1'' | data=''c''<br>next=''1'' |

它所代表的串列如下圖：
![image](https://hackmd.io/_uploads/SJb7OSRJ0.png)
RemoveNextElement 是一個程序，用來移除串列中 current 所指向的下一個元素，但是必須保持原始串列的順序。例如，若 current 為 3 （對應到 list[3]），呼叫完 RemoveNextElement 後，串列應為：
![image](https://hackmd.io/_uploads/r17V_BRJR.png)
請問在空格中應該填入的程式碼為何？', char(13), '')
  AND "answerIndex" = 1
  AND "code" = replace('struct element {
   char data;
   int next;
}

void RemoveNextElement (element list[], int current) {
   if (list[current].next != -1) {
   /*移除 current 的下一個 element*/
   ________________________________
    }
}', char(13), '')
  AND "options" = '["list[current].next = current ;","list[current].next = list[list[current].next].next ;","current = list[list[current].next].next ;","list[list[current].next].next = list[current].next ;"]'
  AND "explanation" = replace('將 current 的下一個元素（list[current].next） 設為「下一個元素（list[current].next）的下一個元素」：list[list[current.next].next 即可。

以題目中的例子說明：current 為 3（list[3]），list[3].next 為 1，則：
    list[list[3].next].next = list[1].next = 2
![image](https://hackmd.io/_uploads/rJDpYSRkC.png)
（這只是移動串列的指標跳過 list[1]，實際上資料並未移除。）', char(13), '');

UPDATE "Problem"
SET "explanation" = replace('在 i % j 中，i 是被除數，j 是除數。例如 76 = 1 × 48 + 28，所以 76 % 48 = 28。

輾轉相除法利用 gcd(i, j) = gcd(j, i % j)。餘數不為 0 時，要先保存餘數，再把原除數 j 當作新的被除數、把餘數當作新的除數：

```cpp
k = i % j;
i = j;
j = k;
```

必須先保存餘數；若先覆寫 i，就無法使用原本的 i 計算 i % j。

| 被除數 i | 除數 j | 餘數 i % j |
| --- | --- | --- |
| 76 | 48 | 28 |
| 48 | 28 | 20 |
| 28 | 20 | 8 |
| 20 | 8 | 4 |
| 8 | 4 | 0 |

當 i % j = 0 時，while 不再執行，當時的除數 j 就是最大公因數，因此最後輸出 4。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = 'APCS 2016/03 第 13 題'
  AND "sourceNumber" = 13
  AND "statement" = replace('下方程式片段擬以輾轉除法求 i 與 j 的最大公因數。
請問 while 迴圈內容何者正確？', char(13), '')
  AND "answerIndex" = 0
  AND "code" = replace('i = 76;
j = 48;
while ((i % j) != 0) {
 ________________
 ________________
 ________________
}
printf ("%d\n", j);', char(13), '')
  AND "options" = '["k = i % j;\ni = j;\nj = k;","i = j;\nj = k;\nk = i % j;","i = j;\nj = i % k;\nk = i;","k = i;\ni = j;\nj = i % k;"]'
  AND "explanation" = replace('輾轉除法：以大數做為除數，小數做為被除數，若整除則小數就是最大公因數；若未整除就以原來的被除數（小數）做為除數，相除的餘數做為被除數，繼續做除法運算，直到整除為止。

以題目中的數值為例：第一次除法「76/48」未整除數，餘數為28；第二次除法「48/28」未整除，餘數為20；……；第五次除法「8/4」整除，最大公因數為 4。

程式碼中「while((i%j)!=0)」表示 i 為除數，j 為被除數，迴圈中為未整除時的處理程式碼，故其程序應為：
(1) 求餘數 -> k = i % j;（第一個空格）
(2) 以原來的被除數（小數）做為除數 -> i = j;（第二個空格）
(3) 以相除的餘數做為被除數 -> j = k;（第三個空格）', char(13), '');
