export type TutorialFrame = {caption:string; prompt:string; cards:string[]};
export type ProblemTutorial = {title:string; frames:TutorialFrame[]};
const lessons:Record<string,ProblemTutorial>={
 a001:{title:'哈囉，資訊！',frames:[
  {caption:'新生帶著兩份資料走進資訊課',cards:['姓名：文字','年齡：整數'],prompt:'哪份資料是文字？哪份是數字？'},
  {caption:'兩行輸入依照先後順序抵達',cards:['第 1 行 → 姓名','第 2 行 → 年齡'],prompt:'如果交換順序，資料的意義會不會改變？'},
  {caption:'自我介紹有固定文字與待填欄位',cards:['固定的介紹文字','姓名欄位','年齡欄位'],prompt:'回到題目確認空白、標點與換行；自己完成整句介紹。'}]},
 a002:{title:'幫 Jason 應援',frames:[
  {caption:'Jason 沒有聲音，需要一張應援提示卡',cards:['舞台','Jason','應援提示卡'],prompt:'這題需要使用者提供資料嗎？'},
  {caption:'不會有任何輸入送進程式',cards:['輸入：無','題目已給定口號'],prompt:'沒有輸入時，等待輸入會發生什麼事？'},
  {caption:'舞台前有三個應援位置',cards:['口號位置 ①','分隔空白','口號位置 ②','分隔空白','口號位置 ③'],prompt:'請自己從題目找出口號；留意重複次數與半形空白。'}]},
 a003:{title:'班級點名卡',frames:[
  {caption:'導師收到學生的三張資料卡',cards:['姓名','座號','分組代號'],prompt:'三種資料的型態與意義各是什麼？'},
  {caption:'資料按三行順序放入對應的格子',cards:['第 1 行 → 姓名','第 2 行 → 座號','第 3 行 → 分組'],prompt:'同樣是文字，姓名和分組代號有什麼不同？'},
  {caption:'點名卡的排版不一定等於讀入順序',cards:['待排版的點名卡','姓名欄','座號欄','分組欄'],prompt:'對照輸出格式，自己決定欄位順序、空白與括號；這裡不展示完成品。'}]},
 a004:{title:'攝氏轉華氏',frames:[
  {caption:'氣象站與國外資料庫使用不同溫度刻度',cards:['氣象站：攝氏 C','國外資料庫：華氏 F'],prompt:'它們描述的是同一個溫度，不是兩筆獨立量測。'},
  {caption:'輸入可能包含小數，也可能低於零',cards:['攝氏資料','負溫度','小數部分'],prompt:'選擇資料型態時，哪些資訊不能被捨去？'},
  {caption:'兩種刻度的間距與起點不同',cards:['攝氏刻度','不同的間距','不同的起點','華氏刻度：待求'],prompt:'請回題目閱讀給定公式，自己推算；動畫不代入數字或顯示換算結果。'}]},
 a005:{title:'奇數還是偶數',frames:[
  {caption:'一個很大的整數來到分類入口',cards:['整數 N','可能為負數','可能超過 32 位元'],prompt:'先想想資料能否完整存下來，不要只用小數近似。'},
  {caption:'兩個分類盒等待你的判斷',cards:['偶數盒','待分類的 N','奇數盒'],prompt:'用自己的話描述奇數與偶數；零與負數也要考慮。'},
  {caption:'分類後需要使用題目指定的英文標籤',cards:['分類：由你決定','輸出標籤：回題目確認'],prompt:'自己設計判斷方式；這裡不提供判斷公式、分支程式或分類答案。'}]}
};
export function getProblemTutorial(code:string,title:string):ProblemTutorial|null {
 const lesson=lessons[code];
 return lesson?.title===title?lesson:null;
}
