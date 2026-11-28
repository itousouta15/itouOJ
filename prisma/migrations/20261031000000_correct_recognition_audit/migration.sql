-- Correct only exact, unchanged legacy recognition rows.
-- Never change answer indices, identities, custom content or learner progress.
-- Magic-square exercise is explicitly reconstructed; it is not an original-paper claim.
-- SQL literal CRs are normalized for LF/CRLF checkouts.

UPDATE "Problem"
SET "explanation" = replace('前兩層迴圈共有 n+(n−1)+…+1 = n(n+1)/2 組 (i,j)。第三層的 k 依序為 1,2,4,…，對 n≥1 恰執行 $\lfloor\log_2 n\rfloor+1$ 次，因此總次數為 $n(n+1)(\lfloor\log_2 n\rfloor+1)/2$。

例如 n=3，k 只有 1、2，總次數為 6×2=12；不能直接使用沒有取整的 log₂(3)+1。n=8 時 k 為 1、2、4、8，共 4 次。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2017/03 第 17 題', char(13), '')
  AND "paper" IS NULL
  AND "sourceNumber" = 17
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('給定右側函式 F( )，F( ) 執行完所回傳的 x 值為何？', char(13), '')
  AND "code" IS replace('int F (int n) {
   int x = 0;
   for (int i=1; i<=n; i=i+1)
      for (int j=i; j<=n; j=j+1)
         for (int k=1; k<=n; k=k*2)
            x = x + 1;
   return x;
}', char(13), '')
  AND "options" IS replace('["$n(n+1)\\sqrt{\\lfloor \\log_2 n \\rfloor}$","$n^2(n+1)/2$","$n(n+1)\\lfloor \\log_2 (n)+1 \\rfloor/2$","$n(n+1)/2$"]', char(13), '')
  AND "answerIndex" IS replace('2', char(13), '')
  AND "explanation" IS replace('+ 前兩個迴圈(i 及 j)執行次數：
    i=1 時，j = 1, 2, ......, n，共執行 n 次。
    i=2 時，j = 2, ......, n，共執行(n-1)次。
    ......
    i=n 時，j = n，共執行 1 次。
    前兩個迴圈執行 $n+(n-1)+(n-2)+......+2+1 = n(n+1)/2$
+ 第三個迴圈 (k) 執行次數：$\log_2(n)+1$。以 n=8 為例：
    第 1 次迴圈：k = 1。
    第 2 次圈 ： k = 1 * 2 = 2。
    第 3 次圈 ： k = 2 * 2 = 4。
    第 4 次迴圈：k = 4 * 2 = 8，迴圈結束。
    執行次數：$\log_2(8) + 1 = 3 + 1 = 4$。
+ 所以解答為：$n(n+1)/2 * (log_2(n)+1) = n(n+1)\lfloor \log_2 (n)+1 \rfloor/2$', char(13), '');

UPDATE "Problem"
SET "explanation" = replace('輸出為 0。外層 i 從 3 開始且每次加 2，所以 i 一定是奇數；內層從奇數 i² 開始，每次加偶數 2i，故只會把奇數索引的 a[j] 設為 1。最後累加的是偶數索引 a[0],a[2],…,a[1000]，它們仍全為 0。

這不是因為「質數沒有偶數」：2 本身就是偶質數。輸出為 0 的原因是程式沒有標記任何偶數索引。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2020/10 第一場 第 3 題', char(13), '')
  AND "paper" IS replace('第一場', char(13), '')
  AND "sourceNumber" = 3
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('請問該程式碼執行後輸出為何？', char(13), '')
  AND "code" IS replace('int a[1001] = {0};
    for (int i = 3; i <= 1000; i = i + 2) {
        for (int j = i*i; j <= 1000; j = j + i + i) {
            a[j] = 1;
        }
    }
    int sum = 0;
    for(int i = 0; i <= 1000; i = i + 2) {
        sum = sum + a[i];
    }
    printf("%d",sum);', char(13), '')
  AND "options" IS replace('["332","0","168","1"]', char(13), '')
  AND "answerIndex" IS replace('1', char(13), '')
  AND "explanation" IS replace('質數有 0 個偶數', char(13), '');

UPDATE "Problem"
SET "code" = replace('// 程式碼1
char f(int x, int y) {
    if(x>10){
        if(y<3){
            return ''B'';
        }
        else{
            if(x>y)return ''A'';
            else return ''B'';
        }
    }
    else return ''A'';
}

// 程式碼2
char f(int x, int y) {
    if(____________________)
        return ''B'';
    else return ''A'';
}', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2020/10 第一場 第 7 題', char(13), '')
  AND "paper" IS replace('第一場', char(13), '')
  AND "sourceNumber" = 7
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('將上述 程式碼1 化簡成 程式碼2 ，請問空格中應該填入的程式碼為何？', char(13), '')
  AND "code" IS replace('// 程式碼1
char f(int x, int y) {
    if(x>10){
        if(y<3){
            return "B";
        }
        else{
            if(x>y)return "A";
            else return "B";
        }
    }
    else return "A";
}

// 程式碼2
char f(int x, int y) {
    if(____________________)
        return ''B'';
    else return ''A'';
}', char(13), '')
  AND "options" IS replace('["`x>10 || y<3 && x<=y`","`x>10 && y<3 && x<=y`","`x>10 && y<3 || x>10 && x<=y`","`x>10 && y<3 || x<=y`"]', char(13), '')
  AND "answerIndex" IS replace('2', char(13), '')
  AND "explanation" IS replace('```
    ''B'' : x>10 && y<3 || x>10 && y>=3 && x<=y
          A    *  B   +  A    *  B''   *  C
    AB + AB''C
    A(B+B''C)
    A(B+C)
    AB+AC
    x>10 && y<3 || x>10 && x<=y
```', char(13), '');

UPDATE "Problem"
SET "code" = replace('int f ( int n ){
    if ( n < 2 )
        return n ;    
    else
        return n + f(__________) ;
}', char(13), ''),
    "explanation" = replace('選 (n+1)/2，這裡採 C 整數除法。呼叫依序為 14→7→4→2→1，總和 28；10→5→3→2→1，總和 21；6→3→2→1，總和 12。n<2 時直接回傳 n，使遞迴終止。程式使用一般 ASCII 空白，可將空格填成 (n+1)/2 後編譯。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2021/01 A 卷 第 5 題', char(13), '')
  AND "paper" IS replace('A 卷', char(13), '')
  AND "sourceNumber" = 5
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('執行上述的函數時回傳的結果： $f$(14) = 28 ，$f$(10) = 21 ， $f$(6) = 12，判斷式該如何選擇才能符合對應關係？', char(13), '')
  AND "code" IS replace('int f ( int n ){
    if ( n < 2 )
        return n ;    
    else
        return n + f(__________) ;
}', char(13), '')
  AND "options" IS replace('["$\\frac{n+1}{2}$","$\\frac{n}{2}$","$\\frac{n-1}{2}$","$\\frac{n}{2}+1$"]', char(13), '')
  AND "answerIndex" IS replace('0', char(13), '')
  AND "explanation" IS NULL;

UPDATE "Problem"
SET "options" = replace('["35621*/+-","*/+-35621","35621-+/*","*35/9+2-1"]', char(13), ''),
    "explanation" = replace('掃描時把數字依原順序存進 b，得到 35621；運算子依序存進 a，得到 */+-。接著從 a 的尾端取出運算子，依序附加 -、+、/、*，所以精確輸出為 35621-+/*，中間沒有空格，最後換行。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2021/01 A 卷 第 13 題', char(13), '')
  AND "paper" IS replace('A 卷', char(13), '')
  AND "sourceNumber" = 13
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('輸出的字串為何？', char(13), '')
  AND "code" IS replace('int main(){
    char s[] = "3*5/6+2-1" ;
    char a[10] = {} ;
    char b[10] = {} ;
    int la = 0, lb = 0 ;
    for ( int i = 0 ; i < strlen(s) ; i += 1 ){
        switch( s[i] ){
            case ''+'': 
            case ''-'': 
            case ''*'': 
            case ''/'':
                a[la] = s[i] ;
                la = la + 1 ;
                break ;
            default : 
                b[lb] = s[i] ;
                lb = lb + 1 ;
        }
    }
    while( la ){
        la = la - 1 ;
        b[ lb ] = a[ la ] ;
        lb = lb + 1 ;
    }
    b[lb] = ''\0'' ;
    printf("%s\n",b ) ;
}
', char(13), '')
  AND "options" IS replace('["35621*/+ -","*/+ -35621","35621- +/*","*35/9+2-1"]', char(13), '')
  AND "answerIndex" IS replace('2', char(13), '')
  AND "explanation" IS NULL;

UPDATE "Problem"
SET "statement" = replace('【本站修正版練習，非原卷逐字轉錄】原收錄的起點、移動方向與程式落子順序互相矛盾，以下統一為可驗證的規則。

給定奇數 N（1≤N≤99），建立 N×N 魔方陣，使每列、每欄及兩條主對角線總和皆為 N(N²+1)/2。mat[x][y] 的 x 從上往下增加，y 從左往右增加。

先在最上列中央填入 1；之後嘗試往右上移一格，超出邊界時循環到另一側。若該格已填數字，則從原格往下移一格、欄不變。請選出兩個空格依序應填入的式子。', char(13), ''),
    "code" = replace('#include <stdio.h>

int main(void) {
    int n;
    scanf("%d", &n);
    int mat[99][99] = {0};
    int x = 0, y = (n - 1) / 2;
    mat[x][y] = 1;
    for (int i = 2; i <= n * n; ++i) {
        int a = _____;
        int b = _____;
        if (mat[a][b]) {
            a = (x + 1) % n;
            b = y;
        }
        x = a;
        y = b;
        mat[x][y] = i;
    }
}
', char(13), ''),
    "explanation" = replace('依本題明確定義的索引，往右上移動是 x−1、y+1，加上 n 再取餘可處理邊界，因此選 (x−1+n)%n 與 (y+1+n)%n。必須先把 1 放在最上列中央，再從 2 開始移動與落子；遇到已填格才改從原格往下。

N=3 時得到：

```text
8 1 6
3 5 7
4 9 2
```

每列、每欄及兩條對角線均為 15。原收錄版本在 N=3 的反對角線會得到 24，不能視為正確魔方陣；此修正版不宣稱還原原卷。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2021/01 A 卷 第 14 題', char(13), '')
  AND "paper" IS replace('A 卷', char(13), '')
  AND "sourceNumber" = 14
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('邊長Ｎ為奇數的魔方陣，依照下列規則填入１到 $N^{2}$ 的數字就能保證每一行和每一列以及斜對角的數字總和都相同。
(1) 由最下面那一列的中間格開始填入1
(2) 接續格在前一格的左下方，除非超出邊界或格內已填數字
(3) 超出下邊界，則接續格改為左邊一行的最上面一列，除非超出左邊界如說明(6)
(4) 超出左邊界，則接續格改為下面一列的最右邊一行，除非超出下邊界如說明(6)
(5) 若接續格已填有數字，接續格改為原格上方一格
(6) 若下面及左邊同時超出邊界時，接續格改為原格的上方一格', char(13), '')
  AND "code" IS replace('int main(){
    int n ;
    scanf("%d", &n) ;
    int mat[n][n] = {};
    int x = n-1 , y = (n - 1) / 2 ;
    for(int i = 1 ; i <= n * n ; i = i + 1 ){
        int a = _____ ;
        int b = _____ ;
        if ( mat[a][b] ){
            a = ( x + 1 )% n;
            b = y ;
        }
        x = a ;
        y = b ;
        mat[x][y] = i ;
    }
}', char(13), '')
  AND "options" IS replace('["(x-1+n)%n , (y+1+n)%n","(x-1+n)%n , (y-1+n)%n","(x+1+n)%n , (y+1+n)%n","(x+1+n)%n , (y-1+n)%n"]', char(13), '')
  AND "answerIndex" IS replace('0', char(13), '')
  AND "explanation" IS NULL;

UPDATE "Problem"
SET "code" = replace('int num[ 10 ] ;
for( int i = 0 ; i < 10 ; i = i + 1 ) 
    scanf( "%d", &num[ ( i + 6 ) % 10 ] ) ;', char(13), ''),
    "explanation" = replace('第 i 筆輸入放在 (i+6)%10。10、9、8、7 分別進入索引 6、7、8、9，接著 6、5、4、3、2、1 進入索引 0 到 5。因此陣列依索引順序為 {6,5,4,3,2,1,10,9,8,7}。scanf 的格式字串須用一般雙引號。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2021/01 B 卷 第 4 題', char(13), '')
  AND "paper" IS replace('B 卷', char(13), '')
  AND "sourceNumber" = 4
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('執行上述程式碼時依序輸入 10, 9, 8, ..., 1 ，請問陣列內的數字為何？', char(13), '')
  AND "code" IS replace('int num[ 10 ] ;
for( int i = 0 ; i < 10 ; i = i + 1 ) 
    scanf( “%d”, &num[ ( i + 6 ) % 10 ] ) ;', char(13), '')
  AND "options" IS replace('["{ 6, 5, 4, 3, 2, 1, 10, 9, 8, 7 }","{ 5, 6, 7, 8, 9, 10, 1, 2, 3, 4 }","{ 4, 5, 6, 7, 8, 9, 10, 1, 2, 3 }","{ 9, 8, 7, 6, 5, 4, 3, 2, 1, 10 }"]', char(13), '')
  AND "answerIndex" IS replace('0', char(13), '')
  AND "explanation" IS NULL;

UPDATE "Problem"
SET "code" = replace('int a[10] = { 10, 9, 7, 2, 3, 4, 5, 6, 1, 8 } ;
int b[10] = { 2, 1, 3, 4, 5, 6, 7, 2, 4, 5 } ;
for (int i = 0 ; i < 10 ; i = i + 1 ) {
    a[ b[i] - 1 ] = b[ a[i] ] + 1;
}
printf("%d", a[7]);', char(13), ''),
    "explanation" = replace('第一輪 i=0 時，左側 a[b[0]−1] 是 a[1]，索引合法；但右側 a[0]=10，因此會讀取 b[10]。b 只有 10 個元素，合法索引為 0 到 9，所以答案是 b[] 的索引值錯誤。這是未定義行為，不能推算某個固定輸出；不要為了試算答案而執行這個越界存取。賦值敘述本身仍須以分號結尾。', char(13), '')
WHERE "type" = 'RECOGNITION'
  AND "title" = replace('APCS 2021/01 B 卷 第 7 題', char(13), '')
  AND "paper" IS replace('B 卷', char(13), '')
  AND "sourceNumber" = 7
  AND "category" = replace('C', char(13), '')
  AND "statement" IS replace('以下選項敘述何者正確？', char(13), '')
  AND "code" IS replace('int a[10] = { 10, 9, 7, 2, 3, 4, 5, 6, 1, 8 } ;
int b[10] = { 2, 1, 3, 4, 5, 6, 7, 2, 4, 5 } ;
for (int i = 0 ; i < 10 ; i = i + 1 ) {
    a[ b[i] - 1 ] = b[ a[i] ] + 1
}
printf("%d", a[7]);', char(13), '')
  AND "options" IS replace('["輸出 2","輸出 6","a[ ] 的索引值錯誤","b[ ] 的索引值錯誤"]', char(13), '')
  AND "answerIndex" IS replace('3', char(13), '')
  AND "explanation" IS NULL;

