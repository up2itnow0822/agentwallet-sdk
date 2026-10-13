import { describe, it, expect, afterEach, vi } from "vitest";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
const execute = promisify(execFile);
import { X402BudgetTracker, MemoryBudgetStore } from "../x402/budget.js";
const directories: string[] = [];
const scope = {
  wallet: "0x1111111111111111111111111111111111111111",
  chainId: 84532,
  asset: "0x3333333333333333333333333333333333333333",
} as const;
const limits = {
  scope,
  globalDailyLimit: 10n,
  globalPerRequestMax: 10n,
  serviceBudgets: [
    {
      service: "https://merchant.example",
      dailyLimit: 10n,
      maxPerRequest: 10n,
    },
  ],
};
afterEach(() =>
  directories
    .splice(0)
    .forEach((d) => rmSync(d, { recursive: true, force: true })),
);
afterEach(() => vi.useRealTimers());
describe("payment atomic durable budget", () => {
  it("keeps unknown submissions charged across daily resets", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    const tracker = new X402BudgetTracker({
      ...limits,
      memoryStore: new MemoryBudgetStore(),
    });
    const id = tracker.reserve("https://merchant.example", 7n);
    tracker.markSubmitting(id);
    vi.setSystemTime(new Date("2026-01-03T12:00:00Z"));
    expect(tracker.getDailySpendSummary().global).toBe(7n);
    expect(() => tracker.reserve("https://merchant.example", 7n)).toThrow();
  });
  it("shares reservations between clients and retains unknown submissions", () => {
    const memoryStore = new MemoryBudgetStore();
    const a = new X402BudgetTracker({ ...limits, memoryStore });
    const b = new X402BudgetTracker({ ...limits, memoryStore });
    const id = a.reserve("https://merchant.example", 7n);
    a.markSubmitting(id);
    a.markSubmitted(id, `0x${"4".repeat(64)}`);
    expect(b.getReservations()[0]?.txHash).toBe(`0x${"4".repeat(64)}`);
    expect(Object.isFrozen(b.getReservations()[0])).toBe(true);
    expect(() => b.reserve("https://merchant.example", 7n)).toThrow();
    expect(() => a.release(id)).toThrow();
    expect(b.getDailySpendSummary().global).toBe(7n);
  });
  it("survives restart and corruption or held locks fail closed", () => {
    const durableDirectory = mkdtempSync(join(tmpdir(), "wallet-budget-"));
    directories.push(durableDirectory);
    const a = new X402BudgetTracker({ ...limits, durableDirectory });
    a.reserve("https://merchant.example", 7n);
    const b = new X402BudgetTracker({ ...limits, durableDirectory });
    expect(() => b.reserve("https://merchant.example", 7n)).toThrow();
    writeFileSync(join(durableDirectory, "budget-ledger.json"), "{}");
    expect(() => b.reserve("https://merchant.example", 1n)).toThrow();
    mkdirSync(join(durableDirectory, "budget-ledger.lock"));
    expect(() => b.reserve("https://merchant.example", 1n)).toThrow();
  });
  it("shares reservations across actual processes without racing", async () => {
    const durableDirectory = mkdtempSync(join(tmpdir(), "wallet-budget-"));
    directories.push(durableDirectory);
    const modulePath = fileURLToPath(
      new URL("../x402/budget.ts", import.meta.url),
    );
    const script = `import { X402BudgetTracker } from ${JSON.stringify(modulePath)}; const tracker = new X402BudgetTracker({ scope: ${JSON.stringify(scope)},globalDailyLimit:10n,globalPerRequestMax:10n,serviceBudgets:[{service:'https://merchant.example',dailyLimit:10n,maxPerRequest:10n}],durableDirectory:${JSON.stringify(durableDirectory)}}); try { tracker.reserve('https://merchant.example',7n); } catch { process.exitCode=2; }`;
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        execute(process.execPath, ["--input-type=module", "-e", script]),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const tracker = new X402BudgetTracker({ ...limits, durableDirectory });
    expect(tracker.getDailySpendSummary().global).toBe(7n);
  });
  it("rejects dangling ledger symlinks instead of resetting accounting", () => {
    const durableDirectory = mkdtempSync(join(tmpdir(), "wallet-budget-"));
    directories.push(durableDirectory);
    symlinkSync(
      join(durableDirectory, "missing-ledger"),
      join(durableDirectory, "budget-ledger.json"),
    );
    const tracker = new X402BudgetTracker({ ...limits, durableDirectory });
    expect(() => tracker.reserve("https://merchant.example", 1n)).toThrow();
  });
  it("does not silently reset a deleted initialized ledger", () => {
    const durableDirectory = mkdtempSync(join(tmpdir(), "wallet-budget-"));
    directories.push(durableDirectory);
    const tracker = new X402BudgetTracker({ ...limits, durableDirectory });
    tracker.reserve("https://merchant.example", 7n);
    unlinkSync(join(durableDirectory, "budget-ledger.json"));
    expect(() =>
      new X402BudgetTracker({ ...limits, durableDirectory }).reserve(
        "https://merchant.example",
        7n,
      ),
    ).toThrow("mismatch");
  });
  it("denies missing storage, missing limits, unknown services and bad amounts", () => {
    expect(() => new X402BudgetTracker({ ...limits })).toThrow();
    const tracker = new X402BudgetTracker({
      ...limits,
      memoryStore: new MemoryBudgetStore(),
    });
    expect(() => tracker.reserve("https://unknown.example", 1n)).toThrow();
    for (const amount of [-1n, 0n, NaN, Infinity, 1])
      expect(() =>
        tracker.reserve("https://merchant.example", amount as bigint),
      ).toThrow();
  });
});
