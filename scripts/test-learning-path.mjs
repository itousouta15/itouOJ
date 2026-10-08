import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLearningPath, LEARNING_CHAPTERS } from '../src/lib/learningPath.ts';
const problem = (id, tags, extra={}) => ({id, title:`題目 ${id}`, problemCode:`a00${id}`, type:'PROGRAMMING', isPublic:true, difficulty:'easy', tags:tags.map(name=>({tag:{name}})), ...extra});
test('dependency order groups public programming problems exactly once',()=>{
 const path=buildLearningPath([problem(1,['迴圈']),problem(2,['DP','陣列']),problem(3,['BFS']),problem(4,['未知']),problem(5,['迴圈'],{isPublic:false}),problem(6,['迴圈'],{type:'RECOGNITION'})],new Set([1,5]));
 assert.equal(path.total,4); assert.equal(path.solved,1);
 assert.equal(path.chapters.find(c=>c.id==='loops').problems[0].id,1);
 assert.equal(path.chapters.find(c=>c.id==='dp').problems[0].id,2);
 assert.equal(path.chapters.find(c=>c.id==='graphs').problems[0].id,3);
 assert.equal(path.chapters.at(-1).problems[0].id,4);
 assert.equal(path.next.id,3);
});
test('empty and completed paths do not invent recommendations',()=>{
 assert.equal(buildLearningPath([],new Set()).next,null);
 const path=buildLearningPath([problem(1,['字串']),problem(1,['字串'])],new Set([1]));
 assert.equal(path.total,1); assert.equal(path.solved,1); assert.equal(path.next,null);
 assert.ok(LEARNING_CHAPTERS.length>10);
});
test('title alone is not used to falsely classify problems',()=>{
 const path=buildLearningPath([problem(1,[],{title:'動態規劃'})],new Set());
 assert.equal(path.chapters.at(-1).problems.length,1);
});
