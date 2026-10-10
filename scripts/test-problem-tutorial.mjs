import test from 'node:test';
import assert from 'node:assert/strict';
import { getProblemTutorial } from '../src/lib/problemTutorial.ts';
test('first five actual titles have distinct non-answer storyboard',()=>{
 const titles=['哈囉，資訊！','幫 Jason 應援','班級點名卡','攝氏轉華氏','奇數還是偶數'];
 const lessons=titles.map((t,i)=>getProblemTutorial(`a00${i+1}`,t));
 assert.ok(lessons.every(t=>t&&t.frames.length>=3));
 assert.equal(new Set(lessons.map(t=>t.frames[0].caption)).size,5);
 for(const lesson of lessons){
  assert.ok(!/cin|cout|console\.log|print\(|N\s*%|Hello, my name is|Leeseo！/.test(JSON.stringify(lesson)));
 }
});
test('unsupported or changed title cannot receive an unrelated tutorial',()=>{
 assert.equal(getProblemTutorial('a006','未知'),null);
 assert.equal(getProblemTutorial('a001','不同題目'),null);
});
