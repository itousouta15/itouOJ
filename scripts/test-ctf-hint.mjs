import test from 'node:test';
import assert from 'node:assert/strict';
import { splitCtfHint } from '../src/lib/ctfHint.ts';
test('extracts multiline hint while keeping following learning points outside',()=>{
 const source='## 題目描述\n\n請閱讀內容。\n\n## 小提示\n\n試試 `檢視原始碼`。\n\n**練習重點：** HTML。';
 assert.deepEqual(splitCtfHint(source),{description:'## 題目描述\n\n請閱讀內容。\n\n**練習重點：** HTML。',hint:'試試 `檢視原始碼`。'});
});
test('no hint remains unchanged and does not render an empty toggle',()=>{
 const source='## 題目描述\n\n內容。';
 assert.deepEqual(splitCtfHint(source),{description:source,hint:null});
});
test('only a real heading is extracted, not inline text or fenced code',()=>{
 const source='內容包含 ## 小提示 字樣。\n\n```md\n## 小提示\n秘密\n```';
 assert.deepEqual(splitCtfHint(source),{description:source,hint:null});
});
test('next heading terminates the hint without losing later sections',()=>{
 const source='內容\n\n## 小提示\n\n第一行\n第二行\n\n## 附加資訊\n\n更多資訊';
 assert.deepEqual(splitCtfHint(source),{description:'內容\n\n## 附加資訊\n\n更多資訊',hint:'第一行\n第二行'});
});
