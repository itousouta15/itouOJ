export const LEARNING_CHAPTERS = [
  {id:'conditions',title:'條件判斷',description:'條件、邏輯運算與邊界值',tags:['條件判斷','條件','if','邏輯運算']},
  {id:'loops',title:'迴圈與累加',description:'重複執行、累加器與索引',tags:['迴圈','loops','loop','累加']},
  {id:'arrays',title:'陣列與極值',description:'走訪資料、最大最小與計數',tags:['陣列','array','極值','計數']},
  {id:'simulation',title:'規則檢查與模擬',description:'依規則逐步更新狀態',tags:['模擬','simulation','規則檢查','計分']},
  {id:'strings',title:'字串處理',description:'字元走訪、切割與比對',tags:['字串','string','strings']},
  {id:'matrix',title:'二維陣列與矩陣',description:'網格、座標與矩陣操作',tags:['二維陣列','矩陣','matrix','網格']},
  {id:'sorting',title:'排序與搜尋',description:'建立順序、二分搜尋與比較',tags:['排序','sort','sorting','二分搜尋','binary search','二分搜']},
  {id:'prefix',title:'前綴和與差分',description:'預先累計與區間更新',tags:['前綴和','prefix sum','差分']},
  {id:'greedy',title:'貪心策略',description:'選擇局部最優並證明策略',tags:['貪心','貪婪','greedy']},
  {id:'structures',title:'資料結構',description:'堆疊、佇列、集合與堆積',tags:['資料結構','堆疊','stack','佇列','queue','heap','堆積']},
  {id:'recursion',title:'遞迴與分治',description:'拆解子問題、遞迴與回溯',tags:['遞迴','recursion','分治','回溯','backtracking']},
  {id:'trees',title:'樹',description:'樹的走訪、高度與子樹',tags:['樹','tree','trees','樹狀結構']},
  {id:'graphs',title:'圖與連通',description:'圖的走訪、最短路與連通性',tags:['圖論','圖','graph','bfs','dfs','最短路','最短路徑','拓樸排序','拓撲排序','並查集']},
  {id:'dp',title:'動態規劃',description:'定義狀態、轉移與重複子問題',tags:['動態規劃','dp','dynamic programming','背包']},
] as const;
export type LearningProblem = {id:number;title:string;problemCode:string|null;type:string;isPublic:boolean;difficulty:string;tags:{tag:{name:string}}[]};
export function buildLearningPath(problems:LearningProblem[], solvedIds:ReadonlySet<number>) {
  const chapters = [...LEARNING_CHAPTERS.map(c=>({id:c.id as string,title:c.title,description:c.description,problems:[] as (LearningProblem & {solved:boolean})[]})),{id:'other',title:'其他練習',description:'尚未對應觀念標籤；可由管理員補上題目標籤',problems:[] as (LearningProblem & {solved:boolean})[]}];
  const seen = new Set<number>();
  const rank:Record<string,number>={easy:0,medium:1,hard:2};
  for (const p of [...problems].sort((a,b)=>(rank[a.difficulty]??3)-(rank[b.difficulty]??3)||(a.problemCode??'').localeCompare(b.problemCode??'')||a.id-b.id)) {
    if (seen.has(p.id)||!p.isPublic||p.type!=='PROGRAMMING'||!p.problemCode) continue;
    seen.add(p.id);
    const tags=new Set(p.tags.map(t=>t.tag.name.trim().toLowerCase()));
    // Assign once to the most advanced matching concept: prerequisites remain earlier.
    let index:number=LEARNING_CHAPTERS.length;
    for(let i=LEARNING_CHAPTERS.length-1;i>=0;i--) {
      if(LEARNING_CHAPTERS[i].tags.some(t=>tags.has(t))) {index=i;break;}
    }
    chapters[index].problems.push({...p,solved:solvedIds.has(p.id)});
  }
  const ordered=chapters.flatMap(c=>c.problems);
  return {chapters:chapters.map(c=>({...c,solved:c.problems.filter(p=>p.solved).length})),total:ordered.length,solved:ordered.filter(p=>p.solved).length,next:ordered.find(p=>!p.solved)??null};
}
