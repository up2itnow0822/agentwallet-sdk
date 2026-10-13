import { expect, test, type Page } from "@playwright/test";
import { encodeFunctionData, type Hex } from "viem";
import { AgentVaultAbi } from "../../../src/contracts/AgentVaultAbi";
import { fixture } from "./local-vm";
import { attach, installWallet, reconnect, settleWallet, type LocalFixture } from "./injected-wallet";
const journalKey = "agentwallet-public-intents-v1";
async function journal(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]"), journalKey);
}
async function paymentReview(page: Page, f: LocalFixture) {
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page.getByLabel("Recipient address").fill(f.receiver);
  await page.getByLabel("Amount", { exact: true }).fill("0.01");
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function deploymentReview(page: Page, f: LocalFixture) {
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await page.getByLabel("Initial operator address").fill(f.accounts[1]);
  await page.getByRole("button", { name: "Review deployment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function burnReview(page: Page, f: LocalFixture) {
  await page.getByRole("button", { name: "Bridge & recovery", exact: true }).click();
  await page.getByLabel("Amount", { exact: true }).fill("1");
  await page.getByLabel("Destination domain", { exact: true }).fill("0");
  await page.getByLabel("Destination recipient (bytes32)", { exact: true }).fill("0x" + "0".repeat(24) + String(f.destinationManifest!.vault).slice(2));
  await page.getByLabel("Maximum fee", { exact: true }).fill("0.01");
  await page.getByRole("button", { name: "Review bridge" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function mintReview(page: Page, f: LocalFixture) {
  await burnReview(page, f);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  const hash = f.lastHash!;
  await page.getByLabel("Source transaction hash", { exact: true }).fill(hash);
  await page.route("https://iris-api-sandbox.circle.com/**", async (route) => route.fulfill({ json: f.getAttested(hash) }));
  await page.getByRole("button", { name: "Check Circle attestation" }).click();
  await expect(page.getByText(/Matching Circle attestation available/)).toBeVisible();
  f.setChain(11155111);
  await page.getByLabel("Destination manifest JSON").fill(JSON.stringify(f.destinationManifest));
  await page.getByRole("button", { name: "Review destination mint" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
test("accepted receiving with no hash retains a durable public latch without its attestation", async ({ page }) => {
  const f = await fixture(true);
  await attach(page, f);
  await mintReview(page, f);
  f.loseNextSendResponse();
  await page.getByRole("button", { name: "Confirm destination mint in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("response lost");
  const records = await journal(page);
  expect(records[0]).toMatchObject({ kind: "mint", status: "unknown", chainId: 11155111 });
  expect(JSON.stringify(records)).not.toMatch(/privateKey|signature|attestation/);
  expect(JSON.stringify(records)).not.toContain("11".repeat(65));
  await expect(page.getByRole("button", { name: "Confirm destination mint in wallet" })).toBeDisabled();
  expect(f.writes).toBe(2);
  const hash = f.lastHash!;
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await page.getByLabel("Recovered transaction hash").fill(hash);
  await page.getByRole("button", { name: "Verify recovered transaction" }).click();
  await expect(page.getByText("Receipt confirmed", { exact: true })).toHaveCount(2);
  expect((await journal(page))[0]).toMatchObject({ status: "confirmed", hash });
  expect(f.writes).toBe(2);
});
test("numeric wallet rejection clears the durable latch and permits an explicitly retried review", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await paymentReview(page, f);
  f.setReject(true);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("declined");
  expect(await journal(page)).toMatchObject([{ status: "rejected" }]);
  expect(f.writes).toBe(0);
  await expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeEnabled();
  f.setReject(false);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  expect(f.writes).toBe(1);
});
test("a hashless error message containing 4001 or rejected is still an unknown actual payment", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await paymentReview(page, f);
  f.loseNextSendResponse("4001 rejected response after broadcast");
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await settleWallet(page);
  expect(f.writes).toBe(1);
  await expect(page.getByRole("dialog").getByRole("alert")).not.toContainText("No transaction was sent");
  expect(await journal(page)).toMatchObject([{ status: "unknown" }]);
  await expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled();
});
test("failed hash persistence preserves unknown intent and exposes the returned public hash", async ({ page }) => {
  const f = await fixture();
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === "agentwallet-public-intents-v1" && JSON.parse(value).some((record: { hash?: string; status: string }) => record.hash && record.status === "unknown"))
        throw Error("Known hash storage unavailable");
      original.call(this, key, value);
    };
  });
  await attach(page, f);
  await paymentReview(page, f);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await settleWallet(page);
  expect(f.writes).toBe(1);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(f.lastHash!);
  expect(await journal(page)).toMatchObject([{ status: "unknown" }]);
  expect((await journal(page))[0].hash).toBeUndefined();
  await expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled();
});
test("an unsupported receipt status cannot clear the original unknown latch", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await paymentReview(page, f);
  f.setReceiptStatus("0x2");
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await settleWallet(page);
  expect(f.writes).toBe(1);
  expect(await journal(page)).toMatchObject([{ status: "unknown", hash: f.lastHash! }]);
  await expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled();
  await page.getByRole("button", { name: "Close review" }).click();
  await page.getByRole("button", { name: "Verify recovered transaction" }).click();
  await settleWallet(page);
  expect(await journal(page)).toMatchObject([{ status: "unknown" }]);
  await expect(page.getByRole("button", { name: "Review payment" })).toBeDisabled();
  f.setReceiptStatus();
  await page.getByRole("button", { name: "Verify recovered transaction" }).click();
  await expect(page.getByText("Receipt confirmed", { exact: true })).toBeVisible();
  expect(f.writes).toBe(1);
});
for (const thrown of ["error", "undefined"] as const) {
test(`a submitted callback failure (${thrown}) preserves the known hash and original unknown intent`, async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await paymentReview(page, f);
  const data = encodeFunctionData({ abi: AgentVaultAbi, functionName: "agentExecute", args: [f.receiver, 10n ** 16n, "0x"] });
  const failure = await page.evaluate(async ({ manifest, from, data, thrown }) => {
    const modulePath = "/src/intents.ts";
    const { broadcastIntent } = await import(modulePath) as typeof import("../src/intents");
    try {
      await broadcastIntent(window.ethereum!, {
        kind: "vault", chainId: manifest.chainId, from, to: manifest.vault,
        data, gas: 3_000_000n, label: "Reviewed payment", meta: { vaultRuntimeHash: manifest.runtimeCodeHash },
      }, () => { throw thrown === "error" ? Error("Public activity callback failed") : undefined; });
      return null;
    } catch (error) {
      const reported = error as { name: string; message: string; hash?: Hex; intentId?: string };
      return { name: reported.name, message: reported.message, hash: reported.hash, intentId: reported.intentId };
    }
  }, { manifest: f.manifest, from: f.accounts[0], data, thrown });
  expect(failure).toMatchObject({ name: "IntentSubmissionError", hash: f.lastHash! });
  expect(failure?.intentId).toBeTruthy();
  expect(await journal(page)).toMatchObject([{ hash: f.lastHash!, status: "unknown" }]);
  expect(f.writes).toBe(1);
  await expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled();
});
}
test("accepted payment with no hash stays unknown across close and reload until exact hash recovery", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await paymentReview(page, f);
  f.loseNextSendResponse();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("response lost");
  expect(f.writes).toBe(1);
  expect(await journal(page)).toMatchObject([{ kind: "vault", status: "unknown", from: f.accounts[0] }]);
  await expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled();
  const hash = f.lastHash!;
  await page.getByRole("button", { name: "Close review" }).click();
  await page.reload();
  await reconnect(page, f);
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await expect(page.getByRole("button", { name: "Review payment" })).toBeDisabled();
  await page.getByLabel("Recovered transaction hash").fill(hash);
  await page.getByRole("button", { name: "Verify recovered transaction" }).click();
  await expect(page.getByText("Receipt confirmed", { exact: true })).toBeVisible();
  expect(await journal(page)).toMatchObject([{ status: "confirmed", hash }]);
  expect(f.writes).toBe(1);
  await expect(page.getByRole("button", { name: "Review payment" })).toBeEnabled();
});
test("accepted source burn with no hash journals only public intent and cannot be burned again", async ({ page }) => {
  const f = await fixture(true);
  await attach(page, f);
  await burnReview(page, f);
  f.loseNextSendResponse();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("response lost");
  expect(await journal(page)).toMatchObject([{ kind: "source", status: "unknown" }]);
  await expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled();
  expect(f.writes).toBe(1);
  await page.getByRole("button", { name: "Close review" }).click();
  await expect(page.getByRole("button", { name: "Review bridge" })).toBeDisabled();
  await page.getByLabel("Recovered transaction hash").fill(f.lastHash!);
  await page.getByRole("button", { name: "Verify recovered transaction" }).click();
  await expect(page.getByText("Receipt confirmed", { exact: true })).toBeVisible();
  expect(f.writes).toBe(1);
  expect(JSON.stringify(await journal(page))).not.toMatch(/privateKey|signature|attestation/);
});
test("accepted creation with no hash survives wizard remount and reload with useful public metadata", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await deploymentReview(page, f);
  f.loseNextSendResponse();
  await page.getByRole("button", { name: "Confirm deployment in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("response lost");
  expect(await journal(page)).toMatchObject([{ kind: "deployment", status: "unknown", meta: { owner: f.accounts[0] } }]);
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await page.getByRole("button", { name: "Close setup" }).click();
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await expect(page.getByRole("button", { name: "Review deployment" })).toBeDisabled();
  await page.reload();
  await reconnect(page, f);
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await expect(page.getByRole("button", { name: "Review deployment" })).toBeDisabled();
  await page.getByLabel("Recovered transaction hash").fill(f.lastHash!);
  await page.getByRole("button", { name: "Verify recovered transaction" }).click();
  await expect(page.getByText("Receipt confirmed", { exact: true })).toBeVisible();
  expect((await journal(page))[0].contractAddress).toMatch(/^0x[\da-f]{40}$/i);
  await expect(page.getByRole("button", { name: "Download recovery metadata" })).toBeEnabled();
  expect(f.writes).toBe(1);
});
test("known unresolved deployment hash and lock survive closing and reopening setup", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await deploymentReview(page, f);
  f.setReceiptError(true);
  await page.getByRole("button", { name: "Confirm deployment in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("network unavailable", { timeout: 15000 });
  const hash = f.lastHash!;
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await page.getByRole("button", { name: "Close setup" }).click();
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await expect(page.getByRole("button", { name: "Review deployment" })).toBeDisabled();
  expect(await journal(page)).toMatchObject([{ kind: "deployment", hash }]);
  expect(f.writes).toBe(1);
});
test("unavailable intent storage blocks before any wallet broadcast", async ({ page }) => {
  const f = await fixture();
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === "agentwallet-public-intents-v1") throw Error("Intent storage unavailable");
      original.call(this, key, value);
    };
  });
  await attach(page, f);
  await paymentReview(page, f);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await settleWallet(page);
  expect(f.writes).toBe(0);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("storage");
});
test("missing origin locks blocks before any wallet broadcast", async ({ page }) => {
  const f = await fixture();
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { configurable: true, value: undefined }));
  await attach(page, f);
  await paymentReview(page, f);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await settleWallet(page);
  expect(f.writes).toBe(0);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("locks");
});
test("two prepared tabs cannot broadcast two payments while the first wallet response is outstanding", async ({ page, context }) => {
  const f = await fixture();
  await attach(page, f);
  await paymentReview(page, f);
  const second = await context.newPage();
  await attach(second, f);
  await paymentReview(second, f);
  await page.evaluate(async () => {
    const runtime = window as Window & { releaseIntentLock?: () => void };
    await new Promise<void>((held) => {
      void navigator.locks.request("agentwallet-public-intents-v1", () => new Promise<void>((release) => {
        runtime.releaseIntentLock = release;
        held();
      }));
    });
  });
  const gate = f.deferNext("eth_sendTransaction");
  await Promise.all([
    page.getByRole("button", { name: "Confirm in wallet" }).click(),
    second.getByRole("button", { name: "Confirm in wallet" }).click(),
  ]);
  await expect.poll(() => page.evaluate(async () => (await navigator.locks.query()).pending?.filter((lock) => lock.name === "agentwallet-public-intents-v1").length)).toBe(2);
  expect(f.writes).toBe(0);
  expect(await journal(page)).toEqual([]);
  await page.evaluate(() => (window as Window & { releaseIntentLock?: () => void }).releaseIntentLock!());
  await gate.requested;
  expect(f.writes).toBe(1);
  await Promise.all([
    expect(page.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled(),
    expect(second.getByRole("button", { name: "Confirm in wallet" })).toBeDisabled(),
  ]);
  gate.release();
  await Promise.all([settleWallet(page), settleWallet(second)]);
  await expect.poll(async () => (await Promise.all([
    page.getByRole("dialog").isVisible(), second.getByRole("dialog").isVisible(),
  ])).filter(Boolean).length).toBe(1);
  const loser = await page.getByRole("dialog").isVisible() ? page : second;
  await expect(loser.getByRole("dialog").getByRole("alert")).toContainText("unresolved wallet request");
  expect((await journal(page))[0].status).toBe("confirmed");
  expect(f.writes).toBe(1);
});
test("a stale reverted reconciliation cannot overwrite the same intent already confirmed under the journal lock", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  const before = BigInt(String(await f.rpc({ method: "eth_getBalance", params: [f.receiver, "latest"] })));
  await paymentReview(page, f);
  f.loseNextSendResponse();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("response lost");
  const original = (await journal(page))[0] as { id: string };
  const hash = f.lastHash!;
  f.setReceiptStatus("0x0");
  const gate = f.deferNext("eth_getTransactionReceipt");
  await page.evaluate(async ({ id, hash }) => {
    const modulePath = "/src/intents.ts";
    const { reconcileIntent } = await import(modulePath) as typeof import("../src/intents");
    const runtime = window as Window & { staleReconciliation?: Promise<{ status?: string; error?: string }> };
    runtime.staleReconciliation = reconcileIntent(window.ethereum!, id, hash).then(({ intent }) => ({ status: intent.status }), (error: unknown) => ({ error: error instanceof Error ? error.message : String(error) }));
  }, { id: original.id, hash });
  await gate.requested;
  f.setReceiptStatus();
  const fresh = await page.evaluate(async ({ id, hash }) => {
    const modulePath = "/src/intents.ts";
    const { reconcileIntent } = await import(modulePath) as typeof import("../src/intents");
    return (await reconcileIntent(window.ethereum!, id, hash)).intent.status;
  }, { id: original.id, hash });
  expect(fresh).toBe("confirmed");
  expect(await journal(page)).toMatchObject([{ id: original.id, status: "confirmed", hash }]);
  gate.release();
  const stale = await page.evaluate(() => (window as Window & { staleReconciliation?: Promise<{ status?: string; error?: string }> }).staleReconciliation!);
  expect(f.writes).toBe(1);
  expect(BigInt(String(await f.rpc({ method: "eth_getBalance", params: [f.receiver, "latest"] })))).toBe(before + 10n ** 16n);
  expect(stale.error).toMatch(/contradict|terminal/i);
  expect(await journal(page)).toMatchObject([{ id: original.id, status: "confirmed", hash }]);
});
for (const kind of ["payment", "creation", "receiving"] as const) {
test(`another tab recovering ${kind} cannot rearm its original hashless signing review`, async ({ page, context }) => {
  const f = await fixture(kind === "receiving");
  await attach(page, f);
  if (kind === "payment") await paymentReview(page, f);
  else if (kind === "creation") await deploymentReview(page, f);
  else await mintReview(page, f);
  const confirmName = kind === "payment" ? "Confirm in wallet" : kind === "creation" ? "Confirm deployment in wallet" : "Confirm destination mint in wallet";
  f.loseNextSendResponse();
  await page.getByRole("button", { name: confirmName }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("response lost");
  const original = (await journal(page))[0] as { id: string };
  const hash = f.lastHash!;
  const second = await context.newPage();
  await installWallet(second, f);
  await second.goto("/");
  await second.getByRole("button", { name: "Connect wallet", exact: true }).click();
  await second.getByLabel("Recovered transaction hash").fill(hash);
  await second.getByRole("button", { name: "Verify recovered transaction" }).click();
  await expect.poll(async () => (await journal(second)).find((record: { id: string }) => record.id === original.id)?.status).toBe("confirmed");
  await settleWallet(page);
  await page.getByRole("button", { name: confirmName }).evaluate((node: HTMLButtonElement) => node.click());
  await settleWallet(page);
  expect(f.writes).toBe(kind === "receiving" ? 2 : 1);
  await expect(page.getByRole("button", { name: confirmName })).toBeDisabled();
  expect((await journal(page)).find((record: { id: string }) => record.id === original.id)).toMatchObject({ status: "confirmed", hash });
});
}
