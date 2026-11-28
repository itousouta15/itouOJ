// Standalone CPE audit: no registry, catalog, judge, or database writes.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cpeLessons } from "../../src/lib/cpeLessons.ts";
import { cpeProblemCatalog } from "../../src/lib/cpeProblemCatalog.ts";

const args = process.argv.slice(2);
const option = (key) => {
  const index = args.indexOf(key);
  return index < 0 ? undefined : args[index + 1];
};
const selected = option("--codes")?.split(",");
const lessons = Object.values(cpeLessons).filter(
  (lesson) => !selected || selected.includes(lesson.code),
);
assert.equal(lessons.length, selected ? new Set(selected).size : 388);

if (args.includes("--traces")) {
  if (lessons.some((lesson) => lesson.code === "a559")) {
    const sequence = [1, 2, 3];
    while (sequence.length < 6)
      sequence.push(
        ((sequence.at(-1) + sequence.at(-2) + sequence.at(-3)) % 5) + 1,
      );
    const lesson = cpeLessons.a559;
    assert.ok(
      lesson.traceLabel.endsWith(sequence.join("、")),
      "a559: animation label violates the stated recurrence",
    );
    assert.deepEqual(
      lesson.trace.at(-1).cells,
      sequence.slice(1).map(String),
      "a559: final animation window violates the recurrence",
    );
    console.log("a559: animation seed, recurrence, and final window agree.");
  }
}

if (args.includes("--live")) {
  const snapshot = JSON.parse(
    readFileSync(
      option("--snapshot") ??
        new URL(
          "../../../tutorial-audit-source/all-problems.json",
          import.meta.url,
        ),
      "utf8",
    ),
  );
  const saved = new Map(snapshot.map((problem) => [problem.code, problem]));
  const decode = (value) =>
    value.replace(
      /&(?:amp|lt|gt|quot|apos|#39|nbsp);|&#(?:x[0-9a-f]+|[0-9]+);/gi,
      (entity) => {
        const named = {
          "&amp;": "&",
          "&lt;": "<",
          "&gt;": ">",
          "&quot;": '"',
          "&apos;": "'",
          "&#39;": "'",
          "&nbsp;": " ",
        };
        return (
          named[entity] ??
          String.fromCodePoint(
            entity[2].toLowerCase() === "x"
              ? parseInt(entity.slice(3), 16)
              : Number(entity.slice(2, -1)),
          )
        );
      },
    );
  const plain = (value) =>
    decode(
      value
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<br\s*\/?\s*>/g, "\n")
        .replace(/<\/(p|h[1-6]|li|tr)>/g, "\n")
        .replace(/<[^>]+>/g, ""),
    );
  let next = 0;
  const mismatches = [];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (next < lessons.length) {
        const { code } = lessons[next++];
        const response = await fetch(
          `https://oj.itousouta.me/problems/${code}`,
          { signal: AbortSignal.timeout(30000) },
        );
        assert.ok(response.ok, `${code}: HTTP ${response.status}`);
        const html = await response.text();
        const main = (
          /<main[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1] ?? ""
        ).replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
        const title = plain(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(main)?.[1] ?? "");
        const start = main.indexOf("題目描述"),
          end = main.indexOf("出題者");
        assert.ok(
          start >= 0 && main.includes("範例測資"),
          `${code}: missing public statement/sample section`,
        );
        const statement = plain(
          main.slice(start, end > start ? end : main.indexOf("範例測資")),
        ).trim();
        const values = [
          ...main
            .slice(main.indexOf("範例測資"))
            .matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g),
        ].map((match) => plain(match[1]).replace(/\r\n/g, "\n"));
        assert.ok(
          values.length && values.length % 2 === 0,
          `${code}: incomplete public samples`,
        );
        const samples = [];
        for (let i = 0; i < values.length; i += 2)
          samples.push({ input: values[i], output: values[i + 1] });
        const original = saved.get(code);
        if (
          title !== original?.title ||
          statement !== original?.statement ||
          JSON.stringify(samples) !== JSON.stringify(original?.samples)
        )
          mismatches.push(code);
        assert.deepEqual(
          samples,
          cpeProblemCatalog.find((problem) => problem.code === code)?.samples,
          `${code}: live/catalog sample drift`,
        );
      }
    }),
  );
  assert.deepEqual(
    mismatches.sort(),
    [],
    "Live statements/samples changed since snapshot; review before using saved evidence",
  );
  console.log(
    `Live title, statement, and sample comparison: ${lessons.length} pages unchanged. This is source freshness, not semantic verification.`,
  );
}

if (option("--python")) {
  const runnerArgs = [
    fileURLToPath(new URL("./check-cpe-tutorial-audit.py", import.meta.url)),
  ];
  if (option("--cxx")) runnerArgs.push("--cxx", option("--cxx"));
  if (args.includes("--compile-only-cxx"))
    runnerArgs.push("--compile-only-cxx");
  execFileSync(option("--python"), runnerArgs, {
    input: JSON.stringify(lessons),
    stdio: ["pipe", "inherit", "inherit"],
    timeout: 1200000,
  });
}
assert.ok(
  args.includes("--live") || args.includes("--traces") || option("--python"),
  "Use --live, --traces, and/or --python <executable>",
);
