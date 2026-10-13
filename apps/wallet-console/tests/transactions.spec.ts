import { test, expect, type Locator, type Page } from "@playwright/test";
import { decodeFunctionResult, encodeDeployData, encodeFunctionData, getAddress, parseEther, zeroAddress, type Address, type Hex } from "viem";
import { AgentVaultBytecode } from "../../../src/contracts/AgentVaultBytecode";
import { fixture } from "./local-vm";
import { vaultAbi } from "../src/abi";
import { attach, emitWalletEvent, installWallet, reconnect, settleUi, settleWallet, type LocalFixture } from "./injected-wallet";
async function payment(page: Page, recipient: string, n = "0.01") {
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page.getByLabel("Recipient address").fill(recipient);
  await page.getByLabel("Amount", { exact: true }).fill(n);
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
test("real VM payment needs review and explicit external signing before successful receipt", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await payment(page, f.receiver);
  expect(f.writes).toBe(0);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  expect(f.writes).toBe(1);
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
});
test("actual VM reverted receipt is never reported as confirmed", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await payment(page, f.receiver);
  f.setRaceRevert(true);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "reverted",
    { timeout: 15000 },
  );
  await page.getByRole("button", { name: "Close review" }).click();
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(page.getByText("Reverted", { exact: true })).toBeVisible();
  await expect(page.getByText("Confirmed", { exact: true })).not.toBeVisible();
});
test("observer cannot prepare a financial write", async ({ page }) => {
  const f = await fixture();
  f.setAccount(f.accounts[2]);
  await attach(page, f);
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page.getByLabel("Recipient address").fill(f.receiver);
  await page.getByLabel("Amount", { exact: true }).fill("0.01");
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(page.getByRole("alert")).toContainText("neither");
  expect(f.writes).toBe(0);
});
test("queued payment approval reviews exact request and executes once in the real VM", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  const before = await recipientBalance(f);
  await payment(page, f.receiver, "2");
  const queueData = encodeFunctionData({ abi: vaultAbi, functionName: "agentExecute", args: [f.receiver, parseEther("2"), "0x"] });
  await page.getByRole("dialog").locator("summary").click();
  await expect(page.getByRole("dialog").locator("pre")).toHaveText(queueData);
  expect(f.writes).toBe(0);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  expect(await recipientBalance(f)).toBe(before);
  expect(f.submittedTransactions[0].data).toBe(queueData);
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(
    page.getByText("Queued · owner approval", { exact: true }),
  ).toBeVisible();
  await openQueuedRequest(page, f);
  await page.getByRole("button", { name: "Review approval" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Approve request #0" })).toBeVisible();
  await expect(dialog.getByText(getAddress(f.receiver), { exact: true })).toBeVisible();
  await expect(dialog.getByText("2 ETH", { exact: true })).toBeVisible();
  await expect(dialog.getByText(String(parseEther("2")), { exact: true })).toBeVisible();
  const approvalData = encodeFunctionData({ abi: vaultAbi, functionName: "approvePending", args: [0n] });
  await dialog.locator("summary").click();
  await expect(dialog.locator("pre")).toHaveText(approvalData);
  expect(f.writes).toBe(1);
  expect(await recipientBalance(f)).toBe(before);
  await dialog.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "No open requests in the recent window" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review approval" })).toHaveCount(0);
  expect(f.writes).toBe(2);
  expect(f.submittedTransactions[1]).toMatchObject({ from: f.accounts[0], to: getAddress(f.manifest.vault), data: approvalData, chainId: "0x14a34" });
  expect(await recipientBalance(f)).toBe(before + parseEther("2"));
  expect(await readPending(f)).toMatchObject({ executed: true, cancelled: false });
  await page.getByRole("button", { name: "Load request" }).click();
  await expect(page.getByText("Executed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review approval" })).toBeDisabled();
  await expect(f.rpc({ method: "eth_call", params: [{ from: f.accounts[0], to: f.manifest.vault, data: approvalData }] })).rejects.toThrow("reverted");
  expect(await recipientBalance(f)).toBe(before + parseEther("2"));
  expect(f.writes).toBe(2);
});
test("queued payment cancellation reviews its ID and prevents any real VM transfer", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  const before = await recipientBalance(f);
  await payment(page, f.receiver, "2");
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await openQueuedRequest(page, f);
  await page.getByRole("button", { name: "Review cancellation" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Cancel request #0" })).toBeVisible();
  const cancelData = encodeFunctionData({ abi: vaultAbi, functionName: "cancelPending", args: [0n] });
  await dialog.locator("summary").click();
  await expect(dialog.locator("pre")).toHaveText(cancelData);
  expect(f.writes).toBe(1);
  expect(await recipientBalance(f)).toBe(before);
  await dialog.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "No open requests in the recent window" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review approval" })).toHaveCount(0);
  expect(f.submittedTransactions[1]).toMatchObject({ from: f.accounts[0], to: getAddress(f.manifest.vault), data: cancelData, chainId: "0x14a34" });
  expect(await readPending(f)).toMatchObject({ executed: false, cancelled: true });
  await page.getByRole("button", { name: "Load request" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review approval" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Review cancellation" })).toBeDisabled();
  const approvalData = encodeFunctionData({ abi: vaultAbi, functionName: "approvePending", args: [0n] });
  await expect(f.rpc({ method: "eth_call", params: [{ from: f.accounts[0], to: f.manifest.vault, data: approvalData }] })).rejects.toThrow("reverted");
  expect(await recipientBalance(f)).toBe(before);
  expect(f.writes).toBe(2);
});
test("real operator cannot open either queued owner review", async ({ page }) => {
  const f = await fixture();
  f.setAccount(f.accounts[1]);
  await attach(page, f);
  const before = await recipientBalance(f);
  await payment(page, f.receiver, "2");
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await openQueuedRequest(page, f);
  await expect(page.getByText("operator", { exact: true })).toBeVisible();
  for (const name of ["Review approval", "Review cancellation"]) {
    const button = page.getByRole("button", { name });
    await expect(button).toBeDisabled();
    await button.evaluate((node: HTMLButtonElement) => node.click());
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  expect(f.writes).toBe(1);
  expect(await recipientBalance(f)).toBe(before);
});
async function recipientBalance(f: LocalFixture) {
  return BigInt(String(await f.rpc({ method: "eth_getBalance", params: [f.receiver, "latest"] })));
}
async function readPending(f: LocalFixture, vault: Address = f.manifest.vault) {
  const data = encodeFunctionData({ abi: vaultAbi, functionName: "getPending", args: [0n] });
  const result = await f.rpc({ method: "eth_call", params: [{ to: vault, data }] });
  return decodeFunctionResult({ abi: vaultAbi, functionName: "getPending", data: result as Hex });
}
async function openQueuedRequest(page: Page, f: LocalFixture) {
  await page.getByRole("button", { name: /^Approvals(?: \d+)?$/ }).click();
  const request = page.locator(".pending");
  await expect(request.getByRole("heading", { name: "Request #0" })).toBeVisible();
  await expect(request.getByText(getAddress(f.receiver), { exact: true })).toBeVisible();
  await expect(request.getByText("2 ETH", { exact: true })).toBeVisible();
  await expect(request.getByText(zeroAddress, { exact: true })).toBeVisible();
  await expect(request.getByText(String(parseEther("2")), { exact: true })).toBeVisible();
  await expect(request.locator("pre")).toHaveText("0x");
  await page.getByLabel("Inspect request ID").fill("0");
  await page.getByRole("button", { name: "Load request" }).click();
  await settleWallet(page);
  await expect(request).toHaveCount(1);
}

test("inspected request 0 stays bound to its original vault across a manifest switch", async ({ page }) => {
  test.setTimeout(45000);
  const f = await fixture();
  const recipientB = f.accounts[2];
  const b = await f.queuedVault(recipientB, parseEther("3"), 51);
  const beforeB = BigInt(String(await f.rpc({ method: "eth_getBalance", params: [recipientB, "latest"] })));
  await attach(page, f);
  await payment(page, f.receiver, "2");
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await openQueuedRequest(page, f);
  const gate = f.deferNext("eth_call");
  await page.getByRole("button", { name: "Load request" }).click();
  await gate.requested;
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByLabel("Deployment manifest JSON").fill(JSON.stringify(b));
  await page.getByRole("button", { name: "Verify deployment" }).click();
  await expect(page.getByText("Deployment checks passed")).toBeVisible();
  gate.release();
  await settleWallet(page);
  await page.getByRole("button", { name: /^Approvals(?: \d+)?$/ }).click();
  const request = page.locator(".pending").filter({ has: page.getByRole("heading", { name: "Request #0", exact: true }) });
  await expect(request).toHaveCount(0);
  await expect(page.locator(".pending")).toHaveCount(50);
  await expect(page.locator(".pending").getByText(getAddress(f.receiver), { exact: true })).toHaveCount(0);
  expect(f.writes).toBe(1);
  await page.getByLabel("Inspect request ID").fill("0");
  await page.getByRole("button", { name: "Load request" }).click();
  await expect(request.getByText(getAddress(recipientB), { exact: true })).toBeVisible();
  await expect(request.getByText("3 ETH", { exact: true })).toBeVisible();
  await request.getByRole("button", { name: "Review approval" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(getAddress(b.vault), { exact: true })).toBeVisible();
  await expect(dialog.getByText(getAddress(recipientB), { exact: true })).toBeVisible();
  await expect(dialog.getByText("3 ETH", { exact: true })).toBeVisible();
  await expect(dialog.getByText(getAddress(f.receiver), { exact: true })).toHaveCount(0);
  const approvalData = encodeFunctionData({ abi: vaultAbi, functionName: "approvePending", args: [0n] });
  await dialog.locator("summary").click();
  await expect(dialog.locator("pre")).toHaveText(approvalData);
  expect(f.writes).toBe(1);
  await dialog.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 15000 });
  await expect(request).toHaveCount(0);
  expect(f.submittedTransactions[1]).toMatchObject({ to: getAddress(b.vault), data: approvalData });
  expect(BigInt(String(await f.rpc({ method: "eth_getBalance", params: [recipientB, "latest"] })))).toBe(beforeB + parseEther("3"));
  expect(await recipientBalance(f)).toBe(0n);
  expect(await readPending(f)).toMatchObject({ executed: false, cancelled: false, to: getAddress(f.receiver), value: parseEther("2") });
  expect(await readPending(f, b.vault)).toMatchObject({ executed: true, to: getAddress(recipientB), value: parseEther("3") });
  expect(f.writes).toBe(2);
});

test("deployment review discards old immutable owner after deferred RPC and account reconnect", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await page.getByLabel("Initial operator address").fill(f.accounts[1]);
  const gate = f.deferNext("eth_getCode");
  await page.getByRole("button", { name: "Review deployment" }).click();
  await gate.requested;
  f.setAccount(f.accounts[2]);
  await emitWalletEvent(page, "accountsChanged", [f.accounts[2]]);
  await page.getByRole("button", { name: "Connect wallet", exact: true }).click();
  await expect(page.getByRole("button", { name: `Connected wallet ${f.accounts[2]}`, exact: true })).toBeVisible();
  gate.release();
  await settleWallet(page);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(f.writes).toBe(0);
  await page.getByRole("button", { name: "Review deployment" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(f.accounts[2], { exact: true })).toBeVisible();
  await expect(dialog.getByText(f.accounts[0], { exact: true })).toHaveCount(0);
  const data = encodeDeployData({ abi: vaultAbi, bytecode: AgentVaultBytecode, args: [f.accounts[2], getAddress(f.accounts[1]), "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4", "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27", "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA", 6] });
  await dialog.locator("summary").click();
  await expect(dialog.locator("pre")).toHaveText(data);
  expect(f.writes).toBe(0);
  await dialog.getByRole("button", { name: "Confirm deployment in wallet" }).click();
  await expect(page.getByRole("heading", { name: "Vault deployed; configuration checks passed" })).toBeVisible({ timeout: 15000 });
  expect(f.submittedTransactions[0]).toMatchObject({ from: f.accounts[2], data });
  expect(f.writes).toBe(1);
});

test("deployment rechecks the live provider account immediately before broadcasting", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await page.getByLabel("Initial operator address").fill(f.accounts[1]);
  await page.getByRole("button", { name: "Review deployment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const gate = f.deferNext("eth_getCode");
  await page.getByRole("button", { name: "Confirm deployment in wallet" }).click();
  await gate.requested;
  f.setAccount(f.accounts[2]);
  // Deliberately omit the event: live pre-broadcast validation must also hold.
  gate.release();
  await settleWallet(page);
  expect(f.writes).toBe(0);
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("account changed");
});

async function quote(page: Page, f: LocalFixture) {
  await page.getByRole("button", { name: "Trading", exact: true }).click();
  await page.getByLabel("To token").selectOption(getAddress(f.output));
  await page.getByLabel("Amount", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Get on-chain quote" }).click();
}

for (const field of ["amount", "token", "fee", "expiry", "minimum", "navigation"] as const) {
  test(`a delayed quote cannot overwrite a changed ${field} trade input`, async ({ page }) => {
    const f = await fixture();
    await attach(page, f);
    const gate = f.deferNext("eth_blockNumber");
    await quote(page, f);
    await gate.requested;
    if (field === "amount") await page.getByLabel("Amount", { exact: true }).fill("2");
    if (field === "token") await page.getByLabel("To token").selectOption(getAddress(f.input));
    if (field === "fee") await page.getByLabel("Pool fee").selectOption("3000");
    if (field === "expiry") await page.getByLabel("Expires in (minutes)").fill("20");
    if (field === "minimum") await page.getByLabel("Minimum received").fill("1.5");
    if (field === "navigation") {
      await page.getByRole("button", { name: "Payments", exact: true }).click();
      await page.getByRole("button", { name: "Trading", exact: true }).click();
    }
    gate.release();
    await settleWallet(page);
    await expect(page.getByLabel("Minimum received")).toHaveValue(field === "minimum" ? "1.5" : "");
    await expect(page.getByText("No live quote loaded")).toBeVisible();
    expect(f.writes).toBe(0);
  });
}
test("editing a completed quote's trade inputs invalidates its displayed result", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await quote(page, f);
  await expect(page.getByText(/Simulated output: 2 OUTPUT/)).toBeVisible();
  await page.getByLabel("Amount", { exact: true }).fill("2");
  await expect(page.getByText("No live quote loaded")).toBeVisible();
  expect(f.writes).toBe(0);
});
test("latest 50 real queue reads overlap in bounded groups at one pinned block", async ({ page }) => {
  test.setTimeout(45000);
  const f = await fixture();
  const b = await f.queuedVault(f.receiver, parseEther("2"), 50);
  await attach(page, f);
  f.delayPendingReads(15);
  await page.getByLabel("Deployment manifest JSON").fill(JSON.stringify(b));
  await page.getByRole("button", { name: "Verify deployment" }).click();
  await expect(page.getByText("Deployment checks passed")).toBeVisible();
  await settleWallet(page);
  expect(f.pendingReadStats.max).toBeGreaterThan(1);
  expect(f.pendingReadStats.max).toBeLessThanOrEqual(5);
  expect(f.pendingReadStats.ids).toEqual(Array.from({ length: 50 }, (_, id) => BigInt(id)));
  expect(new Set(f.pendingReadStats.blocks).size).toBe(1);
  await page.getByRole("button", { name: /^Approvals(?: \d+)?$/ }).click();
  expect(await page.locator(".pending h3").allTextContents()).toEqual(Array.from({ length: 50 }, (_, id) => `Request #${id}`));
  expect(f.writes).toBe(0);
});
test("lost payment broadcast response cannot authorize a second actual VM payment", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await payment(page, f.receiver);
  f.loseNextSendResponse();
  const confirm = page.getByRole("button", { name: "Confirm in wallet" });
  await confirm.click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("response lost");
  expect(f.writes).toBe(1);
  if (await confirm.isEnabled()) await confirm.click();
  await settleWallet(page);
  expect(f.writes).toBe(1);
  expect(await recipientBalance(f)).toBe(parseEther("0.01"));
  await expect(confirm).toBeDisabled();
});

async function assertInvalidated(page: Page, f: LocalFixture) {
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("Deployment checks passed")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Connect wallet", exact: true })).toBeEnabled();
  await expect(page.getByText("owner", { exact: true })).not.toBeVisible();
  await expect(page.getByText("operator", { exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByText("Connect a wallet to load balances")).toBeVisible();
  for (const row of await page.locator(".assets tbody tr").all()) {
    await expect(row.locator("td").nth(1)).toHaveText("—");
    await expect(row.locator("td").nth(2)).toHaveText("—");
  }
  await page.getByRole("button", { name: "Trading", exact: true }).click();
  await expect(page.getByText("No live quote loaded")).toBeVisible();
  await expect(page.getByRole("button", { name: "Get on-chain quote" })).toBeDisabled();
  await page.getByRole("button", { name: "Operators & limits", exact: true }).click();
  await expect(page.getByRole("button", { name: "Review policy" })).toBeDisabled();
  expect(f.writes).toBe(0);
}

const walletEvents = ["accountsChanged", "chainChanged", "disconnect"] as const;
function changedWallet(f: LocalFixture, event: typeof walletEvents[number]) {
  if (event === "accountsChanged") {
    f.setAccount(f.accounts[2]);
    return [f.accounts[2]];
  }
  if (event === "chainChanged") {
    f.setChain(11155111);
    return "0xaa36a7";
  }
  return { code: 4900, message: "Local test wallet disconnected" };
}
for (const event of walletEvents) {
  test(`late-injected wallet ${event} invalidates an outstanding review without signing`, async ({ page }) => {
    const f = await fixture();
    await page.goto("/");
    await expect(page.getByText("Connect a wallet to load balances")).toBeVisible();
    await settleUi(page);
    expect(await page.evaluate(() => window.ethereum)).toBeUndefined();
    await installWallet(page, f, true);
    await reconnect(page, f);
    await payment(page, f.receiver);
    await emitWalletEvent(page, event, changedWallet(f, event));
    await assertInvalidated(page, f);
  });

  test(`${event} closes outstanding review and clears verified role, balances and quote`, async ({ page }) => {
    const f = await fixture();
    await attach(page, f);
    await quote(page, f);
    await expect(page.getByText(/Simulated output: 2 OUTPUT/)).toBeVisible();
    await payment(page, f.receiver);
    expect(f.writes).toBe(0);
    await emitWalletEvent(page, event, changedWallet(f, event));
    await assertInvalidated(page, f);
  });

  for (const method of ["eth_getCode", "eth_getBalance"]) {
    test(`${event} prevents a deferred ${method === "eth_getCode" ? "verification" : "balance load"} from restoring the previous session`, async ({ page }) => {
      const f = await fixture();
      await attach(page, f);
      const gate = f.deferNext(method);
      await page.getByRole("button", { name: "Refresh", exact: false }).click();
      await gate.requested;
      await emitWalletEvent(page, event, changedWallet(f, event));
      gate.release();
      await settleWallet(page);
      await expect(page.getByRole("button", { name: "Connect wallet", exact: true })).toBeEnabled();
      await assertInvalidated(page, f);
    });
  }

  test(`${event} prevents a deferred quote from returning after invalidation`, async ({ page }) => {
    const f = await fixture();
    await attach(page, f);
    const gate = f.deferNext("eth_blockNumber");
    await quote(page, f);
    await gate.requested;
    await emitWalletEvent(page, event, changedWallet(f, event));
    gate.release();
    await settleWallet(page);
    await expect(page.getByRole("button", { name: "Connect wallet", exact: true })).toBeEnabled();
    await assertInvalidated(page, f);
  });
}

test("a deferred wallet connection cannot restore an account after disconnect", async ({ page }) => {
  const f = await fixture();
  await installWallet(page, f);
  await page.goto("/");
  const gate = f.deferNext("eth_requestAccounts");
  await page.getByRole("button", { name: "Connect wallet", exact: true }).click();
  await gate.requested;
  await emitWalletEvent(page, "disconnect", { code: 4900, message: "Local test disconnect" });
  gate.release();
  await settleWallet(page);
  await expect(page.getByRole("button", { name: "Connect wallet", exact: true })).toBeEnabled();
  expect(f.writes).toBe(0);
});

test("a deferred queued-request inspection cannot repopulate an invalidated session", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await payment(page, f.receiver, "2");
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await settleWallet(page);
  await page.getByRole("button", { name: /^Approvals(?: \d+)?$/ }).click();
  await page.getByLabel("Inspect request ID").fill("0");
  const gate = f.deferNext("eth_call");
  await page.getByRole("button", { name: "Load request" }).click();
  await gate.requested;
  await emitWalletEvent(page, "accountsChanged", changedWallet(f, "accountsChanged"));
  gate.release();
  await settleWallet(page);
  await expect(page.getByRole("heading", { name: "No requests loaded yet" })).toBeVisible();
  await expect(page.locator(".pending")).toHaveCount(0);
  expect(f.writes).toBe(1);
  expect(await recipientBalance(f)).toBe(0n);
});

async function assertReviewKeyboard(page: Page, opener: Locator) {
  const dialog = page.getByRole("dialog");
  const controls = [
    ...(await dialog.getByRole("button", { name: "Close review" }).count() ? [dialog.getByRole("button", { name: "Close review" })] : []),
    dialog.locator("summary"),
    dialog.getByRole("button", { name: "Go back", exact: true }),
    dialog.getByRole("button", { name: /^Confirm/ }),
  ];
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(controls.at(-1)!).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(controls[0]).toBeFocused();
  for (const control of [...controls.slice(1), controls[0]]) {
    await page.keyboard.press("Tab");
    await expect(control).toBeFocused();
  }
  for (const control of [...controls].reverse()) {
    await page.keyboard.press("Shift+Tab");
    await expect(control).toBeFocused();
  }
  await page.locator(".theme").focus();
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
}

async function assertBusyKeyboard(page: Page, f: LocalFixture) {
  const dialog = page.getByRole("dialog");
  const gate = f.deferNext("eth_sendTransaction");
  await dialog.getByRole("button", { name: /^Confirm/ }).click();
  await gate.requested;
  try {
    await expect(dialog.getByRole("button", { name: "Go back", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await dialog.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator("summary")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.locator("summary")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator("summary")).toBeFocused();
    // Exercise the real browser's zero-tabbable branch without a production hook.
    await dialog.locator("summary").evaluate((node: HTMLElement) => node.tabIndex = -1);
    await dialog.focus();
    for (const key of ["Tab", "Shift+Tab"]) {
      await page.keyboard.press(key);
      await expect(dialog).toBeFocused();
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
  } finally {
    gate.release();
  }
  await expect(dialog).not.toBeVisible({ timeout: 15000 });
}

test("payment review contains initial reverse Tab, summary, both cycles and busy focus", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await payment(page, f.receiver);
  const opener = page.getByRole("button", { name: "Review payment" });
  await assertReviewKeyboard(page, opener);
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertBusyKeyboard(page, f);
  expect(f.writes).toBe(1);
});

test("deployment review contains initial reverse Tab, summary, both cycles and busy focus", async ({ page }) => {
  const f = await fixture();
  await attach(page, f);
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await page.getByLabel("Initial operator address").fill(f.accounts[1]);
  const opener = page.getByRole("button", { name: "Review deployment" });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertReviewKeyboard(page, opener);
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertBusyKeyboard(page, f);
  expect(f.writes).toBe(1);
});

test("recovery review contains initial reverse Tab, summary, both cycles and busy focus", async ({ page }) => {
  const f = await fixture(true);
  const sourceHash = await cctpBurn(page, f);
  await page.route("https://iris-api-sandbox.circle.com/**", async (route) => route.fulfill({ json: f.getAttested(sourceHash) }));
  await page.getByRole("button", { name: "Check Circle attestation" }).click();
  await expect(page.getByText(/Matching Circle attestation available/)).toBeVisible();
  f.setChain(11155111);
  await page.getByLabel("Destination manifest JSON").fill(JSON.stringify(f.destinationManifest));
  const opener = page.getByRole("button", { name: "Review destination mint" });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertReviewKeyboard(page, opener);
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertBusyKeyboard(page, f);
  expect(f.writes).toBe(2);
});
test("actual vault quote and trade respect an owner floor and settle to vault", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await page.getByRole("button", { name: "Trading", exact: true }).click();
  await page.getByLabel("To token").selectOption(getAddress(f.output));
  await page.getByLabel("Amount", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Get on-chain quote" }).click();
  await expect(page.getByText(/Simulated output: 2 OUTPUT/)).toBeVisible();
  await expect(page.getByLabel("Minimum received")).toHaveValue("1.99");
  expect(f.writes).toBe(0);
  await page.getByRole("button", { name: "Review trade" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  expect(f.writes).toBe(1);
});
test("staking supply and withdrawal keep accounting in real vault", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await page.getByRole("button", { name: "Staking", exact: true }).click();
  await page.getByLabel("Amount", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Review position" }).click();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Principal: 1/)).toBeVisible();
  await page
    .getByRole("button", { name: "Withdraw to vault", exact: true })
    .click();
  await page.getByRole("button", { name: "Review position" }).click();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  expect(f.writes).toBe(2);
});
test("confirmed bridge source records survive reload without storing signatures", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await page
    .getByRole("button", { name: "Bridge & recovery", exact: true })
    .click();
  await page.getByLabel("Amount", { exact: true }).fill("1");
  await page.getByLabel("Destination domain", { exact: true }).fill("0");
  await page
    .getByLabel("Destination recipient (bytes32)", { exact: true })
    .fill("0x" + "0".repeat(24) + f.receiver.slice(2));
  await page.getByLabel("Maximum fee", { exact: true }).fill("0.01");
  await page.getByRole("button", { name: "Review bridge" }).click();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("heading", { name: "Saved source transfers" }),
  ).toBeVisible();
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("agentwallet-bridge-sources-v1") ?? "[]"),
  );
  expect(records).toHaveLength(1);
  expect(records[0].status).toBe("Source confirmed");
  expect(JSON.stringify(records)).not.toMatch(/privateKey|signature/);
  await page.reload();
  await page
    .getByRole("button", { name: "Bridge & recovery", exact: true })
    .click();
  await expect(
    page.getByText("Source confirmed", { exact: true }),
  ).toBeVisible();
});
test("testnet vault deployment requires review and returns a checked public manifest", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await page.getByLabel("Initial operator address").fill(f.accounts[1]);
  await page.getByRole("button", { name: "Review deployment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(f.writes).toBe(0);
  await page
    .getByRole("button", { name: "Confirm deployment in wallet" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Vault deployed; configuration checks passed",
    }),
  ).toBeVisible({ timeout: 15000 });
  expect(f.writes).toBe(1);
  await expect(
    page.getByRole("button", { name: "Download public manifest" }),
  ).toBeEnabled();
});
test("wrong network and wrong runtime code prevent a verified deployment", async ({
  page,
}) => {
  const f = await fixture();
  f.setChain(8453);
  await page.exposeFunction("localRpc", f.rpc);
  await page.addInitScript(() => {
    (window as unknown as { ethereum: unknown }).ethereum = {
      request: (payload: unknown) =>
        (
          window as unknown as { localRpc: (x: unknown) => Promise<unknown> }
        ).localRpc(payload),
      on: () => {},
      removeListener: () => {},
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await page
    .getByLabel("Deployment manifest JSON")
    .fill(JSON.stringify(f.manifest));
  await page.getByRole("button", { name: "Verify deployment" }).click();
  await expect(page.getByRole("alert")).toContainText("Wrong network");
  f.setChain(84532);
  await page.getByLabel("Deployment manifest JSON").fill(
    JSON.stringify({
      ...f.manifest,
      runtimeCodeHash: "0x" + "aa".repeat(32),
    }),
  );
  await page.getByRole("button", { name: "Verify deployment" }).click();
  await expect(page.getByRole("alert")).toContainText("runtime code");
  await expect(page.getByText("Deployment checks passed")).not.toBeVisible();
  expect(f.writes).toBe(0);
});
test("CCTP recovery validates a bound attestation and mints through the destination vault", async ({
  page,
}) => {
  const f = await fixture(true);
  await attach(page, f);
  await page
    .getByRole("button", { name: "Bridge & recovery", exact: true })
    .click();
  await page.getByLabel("Amount", { exact: true }).fill("1");
  await page.getByLabel("Destination domain", { exact: true }).fill("0");
  await page
    .getByLabel("Destination recipient (bytes32)", { exact: true })
    .fill(
      "0x" + "0".repeat(24) + String(f.destinationManifest!.vault).slice(2),
    );
  await page.getByLabel("Maximum fee", { exact: true }).fill("0.01");
  await page.getByRole("button", { name: "Review bridge" }).click();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  const sourceHash = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("agentwallet-bridge-sources-v1")!)[0]
        .hash,
  );
  await page
    .getByLabel("Source transaction hash", { exact: true })
    .fill(sourceHash);
  await page.route("https://iris-api-sandbox.circle.com/**", async (route) =>
    route.fulfill({ json: f.getAttested(sourceHash) }),
  );
  await page.getByRole("button", { name: "Check Circle attestation" }).click();
  await expect(
    page.getByText(/Matching Circle attestation available/),
  ).toBeVisible();
  f.setChain(11155111);
  await page
    .getByLabel("Destination manifest JSON")
    .fill(JSON.stringify(f.destinationManifest));
  await page.getByRole("button", { name: "Review destination mint" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(f.writes).toBe(1);
  await page
    .getByRole("button", { name: "Confirm destination mint in wallet" })
    .click();
  await expect(page.getByText(/Destination received 1 USDC/)).toBeVisible({
    timeout: 15000,
  });
  expect(f.writes).toBe(2);
  await expect(
    page.getByRole("button", { name: "Review destination mint" }),
  ).toBeDisabled();
  const records = await page.evaluate(() =>
    localStorage.getItem("agentwallet-bridge-sources-v1"),
  );
  expect(records).toContain("Destination confirmed");
  expect(records).not.toContain("attestation");
});
async function cctpBurn(page: Page, f: Awaited<ReturnType<typeof fixture>>) {
  await attach(page, f);
  await page
    .getByRole("button", { name: "Bridge & recovery", exact: true })
    .click();
  await page.getByLabel("Amount", { exact: true }).fill("1");
  await page.getByLabel("Destination domain", { exact: true }).fill("0");
  await page
    .getByLabel("Destination recipient (bytes32)", { exact: true })
    .fill(
      "0x" + "0".repeat(24) + String(f.destinationManifest!.vault).slice(2),
    );
  await page.getByLabel("Maximum fee", { exact: true }).fill("0.01");
  await page.getByRole("button", { name: "Review bridge" }).click();
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  const hash = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("agentwallet-bridge-sources-v1")!)[0]
        .hash,
  );
  await page.getByLabel("Source transaction hash", { exact: true }).fill(hash);
  return hash as string;
}
test("altered Circle attestation cannot authorize receiving or any second write", async ({
  page,
}) => {
  const f = await fixture(true);
  const hash = await cctpBurn(page, f);
  const payload = f.getAttested(hash);
  payload.messages[0].message =
    payload.messages[0].message.slice(0, 2 + 216 * 2) +
    "ff".repeat(32) +
    payload.messages[0].message.slice(2 + 248 * 2);
  await page.route("https://iris-api-sandbox.circle.com/**", async (route) =>
    route.fulfill({ json: payload }),
  );
  await page.getByRole("button", { name: "Check Circle attestation" }).click();
  await expect(page.getByRole("alert")).toContainText("immutable burn fields");
  await expect(
    page.getByRole("button", { name: "Review destination mint" }),
  ).toBeDisabled();
  expect(f.writes).toBe(1);
});
test("destination operator and wrong transmitter code hash are rejected before mint review", async ({
  page,
}) => {
  const f = await fixture(true);
  const hash = await cctpBurn(page, f);
  await page.route("https://iris-api-sandbox.circle.com/**", async (route) =>
    route.fulfill({ json: f.getAttested(hash) }),
  );
  await page.getByRole("button", { name: "Check Circle attestation" }).click();
  await expect(
    page.getByText(/Matching Circle attestation available/),
  ).toBeVisible();
  f.setChain(11155111);
  f.setAccount(f.accounts[1]);
  await page
    .getByLabel("Destination manifest JSON")
    .fill(JSON.stringify(f.destinationManifest));
  await page.getByRole("button", { name: "Review destination mint" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "destination vault owner",
  );
  f.setAccount(f.accounts[0]);
  await page.getByLabel("Destination manifest JSON").fill(
    JSON.stringify({
      ...f.destinationManifest,
      messageTransmitterCodeHash: "0x" + "aa".repeat(32),
    }),
  );
  await page.getByRole("button", { name: "Review destination mint" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "transmitter runtime hash",
  );
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(f.writes).toBe(1);
});
test("unknown submitted payment cannot be retried from the same review", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await payment(page, f.receiver);
  f.setReceiptError(true);
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "network unavailable",
    { timeout: 15000 },
  );
  expect(f.writes).toBe(1);
  await expect(
    page.getByRole("button", { name: "Confirm in wallet" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close review" }).click();
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(
    page.getByText("Receipt unresolved", { exact: true }),
  ).toBeVisible();
  f.setReceiptError(false);
  await page.getByRole("button", { name: "Check receipt" }).click();
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
  expect(f.writes).toBe(1);
});
test("unknown deployment submission cannot be signed a second time", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await page.getByLabel("Initial operator address").fill(f.accounts[1]);
  await page.getByRole("button", { name: "Review deployment" }).click();
  f.setReceiptError(true);
  await page
    .getByRole("button", { name: "Confirm deployment in wallet" })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "network unavailable",
    { timeout: 15000 },
  );
  await expect(
    page.getByRole("button", { name: "Confirm deployment in wallet" }),
  ).toBeDisabled();
  expect(f.writes).toBe(1);
});
