import assert from "node:assert/strict";
import test from "node:test";
import { SandboxBusyError, withSandboxTurn } from "../src/lib/sandboxQueue.ts";

test("judging goes ahead of waiting sample runs without overlapping execution", async () => {
  const order = [];
  let releaseActive;
  const active = withSandboxTurn("test", () => new Promise((resolve) => {
    releaseActive = () => { order.push("first finished"); resolve(); };
  }));
  const waitingTest = withSandboxTurn("test", async () => { order.push("test"); });
  const waitingJudge = withSandboxTurn("judge", async () => { order.push("judge"); });
  releaseActive();
  await Promise.all([active, waitingTest, waitingJudge]);
  assert.deepEqual(order, ["first finished", "judge", "test"]);
});

test("sample waiters are bounded, cancellation frees a place", async () => {
  let releaseActive;
  const active = withSandboxTurn("judge", () => new Promise((resolve) => { releaseActive = resolve; }));
  const controller = new AbortController();
  const canceled = withSandboxTurn("test", async () => {}, controller.signal);
  const second = withSandboxTurn("test", async () => {});
  await assert.rejects(withSandboxTurn("test", async () => {}), SandboxBusyError);
  controller.abort();
  await assert.rejects(canceled, SandboxBusyError);
  const replacement = withSandboxTurn("test", async () => {});
  releaseActive();
  await Promise.all([active, second, replacement]);
});

test("failed work releases the sandbox for the next request", async () => {
  await assert.rejects(withSandboxTurn("judge", async () => { throw new Error("failed"); }));
  assert.equal(await withSandboxTurn("test", async () => "ok"), "ok");
});

test("a burst stays single-flight with bounded waiting", async () => {
  let releaseActive;
  let concurrent = 0;
  let peak = 0;
  const active = withSandboxTurn("test", () => new Promise((resolve) => {
    concurrent++;
    releaseActive = () => { concurrent--; resolve(); };
  }));
  const requests = Array.from({ length: 100 }, (_, index) =>
    withSandboxTurn(index % 2 ? "judge" : "test", async () => {
      peak = Math.max(peak, ++concurrent);
      await Promise.resolve();
      concurrent--;
      return "ran";
    }).catch((error) => {
      assert.ok(error instanceof SandboxBusyError);
      return "busy";
    }));
  // The active request still owns the sandbox, so admitted work has not run.
  assert.equal(peak, 0);
  releaseActive();
  await active;
  const outcomes = await Promise.all(requests);
  assert.equal(peak, 1);
  assert.ok(outcomes.includes("busy"));
  assert.ok(outcomes.filter((outcome) => outcome === "ran").length <= 6);
});
