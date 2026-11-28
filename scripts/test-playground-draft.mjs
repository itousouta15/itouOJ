import test from "node:test";
import assert from "node:assert/strict";
import { createPlaygroundDraft, restorePlaygroundDraft } from "../src/lib/playgroundDraft.ts";
import { PLAYGROUND_TEMPLATES } from "../src/lib/playground.ts";
import { ITOULANG_PREVIOUS_PLAYGROUND_TEMPLATE } from "../src/lib/itoulangTemplates.ts";

const legacy = '喵("Hello, world!");\n';

test("fresh playground drafts use the Chinese main/stream template", () => {
  const draft = createPlaygroundDraft();
  assert.equal(draft.version, 3);
  assert.match(draft.codes.itoulang, /你好，喵\+\+！/);
  assert.match(draft.codes.itoulang, /整數 主程式\(\)/);
  assert.match(draft.codes.itoulang, /喵out.*喵endl/);
  assert.doesNotMatch(draft.codes.itoulang, /喵\("Hello, world!"\)/);
});

test("old untouched Hello World upgrades while keeping language, input and other drafts", () => {
  for (const version of [undefined, 1]) {
    const result = restorePlaygroundDraft({ version, language: "itoulang", input: "20 22\n", codes: {
      itoulang: legacy, cpp: "int main() { return 42; }", python: "print('my program')",
    } });
    assert.equal(result.templateUpgraded, true);
    assert.equal(result.draft.version, 3);
    assert.equal(result.draft.codes.itoulang, PLAYGROUND_TEMPLATES.itoulang);
    assert.equal(result.draft.language, "itoulang");
    assert.equal(result.draft.input, "20 22\n");
    assert.equal(result.draft.codes.cpp, "int main() { return 42; }");
    assert.equal(result.draft.codes.python, "print('my program')");
  }
});

test("old default migrates even when stored from editing another language", () => {
  const result = restorePlaygroundDraft({ language: "cpp", codes: { cpp: "my C++ draft", itoulang: legacy } });
  assert.equal(result.templateUpgraded, true);
  assert.equal(result.draft.language, "cpp");
  assert.equal(result.draft.codes.cpp, "my C++ draft");
});

test("custom, commented and intentionally empty 喵++ programs remain exact", () => {
  for (const code of [
    '喵("Hello, world!");\n喵(42);',
    '喵("Hello, world!"); // 我的註解',
    '喵("我的程式");\n',
    "",
  ]) {
    const result = restorePlaygroundDraft({ language: "itoulang", codes: { itoulang: code } });
    assert.equal(result.templateUpgraded, false);
    assert.equal(result.draft.codes.itoulang, code);
  }
});

test("migration is one-time and does not rewrite explicitly edited current-version code", () => {
  const upgraded = restorePlaygroundDraft({ codes: { itoulang: legacy } }).draft;
  assert.equal(restorePlaygroundDraft(upgraded).templateUpgraded, false);
  for (const version of [2, 3]) {
    const edited = { ...upgraded, version, codes: { ...upgraded.codes, itoulang: legacy } };
    const result = restorePlaygroundDraft(edited);
    assert.equal(result.templateUpgraded, false);
    assert.equal(result.draft.codes.itoulang, legacy);
  }
});

test("CRLF defaults upgrade and malformed saved values do not become program data", () => {
  assert.equal(restorePlaygroundDraft({ codes: { itoulang: '喵("Hello, world!");\r\n' } }).templateUpgraded, true);
  for (const value of [null, "not a draft", [], { language: "constructor", codes: null, input: 42 }]) {
    const result = restorePlaygroundDraft(value);
    assert.equal(result.draft.language, "cpp");
    assert.equal(result.draft.codes.itoulang, PLAYGROUND_TEMPLATES.itoulang);
    assert.equal(result.draft.input, "");
    assert.equal(result.templateUpgraded, false);
  }
});

test("untouched former-brand templates upgrade once without rewriting custom code", () => {
  const result = restorePlaygroundDraft({ version: 2, language: "itoulang", input: "20 22", codes: {
    itoulang: ITOULANG_PREVIOUS_PLAYGROUND_TEMPLATE, cpp: "my C++ draft",
  } });
  assert.equal(result.templateUpgraded, true);
  assert.equal(result.draft.version, 3);
  assert.equal(result.draft.codes.itoulang, PLAYGROUND_TEMPLATES.itoulang);
  assert.equal(result.draft.codes.cpp, "my C++ draft");
  assert.equal(result.draft.input, "20 22");
  for (const saved of [
    { version: 2, codes: { itoulang: ITOULANG_PREVIOUS_PLAYGROUND_TEMPLATE + '喵out << "我的程式";' } },
    { version: 3, codes: { itoulang: ITOULANG_PREVIOUS_PLAYGROUND_TEMPLATE } },
  ]) {
    const preserved = restorePlaygroundDraft(saved);
    assert.equal(preserved.templateUpgraded, false);
    assert.equal(preserved.draft.codes.itoulang, saved.codes.itoulang);
  }
});
