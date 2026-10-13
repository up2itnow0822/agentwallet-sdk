import { expect, test, type Page } from "@playwright/test";
import { encodeFunctionData, getAddress, keccak256 } from "viem";
import { fixture } from "./local-vm";
import { vaultAbi } from "../src/abi";
import { attach, emitWalletEvent, settleWallet, type LocalFixture } from "./injected-wallet";

async function fillProtocolForm(page: Page, f: LocalFixture, kind: "trade" | "bridge") {
  await page.getByRole("button", { name: kind === "trade" ? "Trading" : "Bridge & recovery", exact: true }).click();
  await page.getByLabel("Amount", { exact: true }).fill("1");
  if (kind === "trade") {
    await page.getByLabel("To token").selectOption(getAddress(f.output));
    await page.getByLabel("Minimum received").fill("1");
  } else {
    await page.getByLabel("Destination domain", { exact: true }).fill("0");
    await page.getByLabel("Destination recipient (bytes32)").fill("0x" + "0".repeat(24) + f.receiver.slice(2));
    await page.getByLabel("Maximum fee", { exact: true }).fill("0.01");
  }
}
for (const kind of ["trade", "bridge"] as const) {
  test(`a deferred ${kind} precheck cannot review vault A after verifying compatible vault B`, async ({ page }) => {
    const f = await fixture();
    const b = await f.compatibleVault();
    await attach(page, f);
    await fillProtocolForm(page, f, kind);
    const gate = f.deferNext("eth_call");
    await page.getByRole("button", { name: `Review ${kind}` }).click();
    await gate.requested;
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await page.getByLabel("Deployment manifest JSON").fill(JSON.stringify(b));
    await page.getByRole("button", { name: "Verify deployment" }).click();
    await expect(page.getByText("Deployment checks passed")).toBeVisible();
    gate.release();
    await settleWallet(page);
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(f.writes).toBe(0);
    await fillProtocolForm(page, f, kind);
    await page.getByRole("button", { name: `Review ${kind}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(getAddress(f.manifest.vault), { exact: true })).toHaveCount(0);
    await expect(dialog.getByText(getAddress(b.vault), { exact: true })).toHaveCount(kind === "trade" ? 2 : 1);
    expect(f.writes).toBe(0);
    await dialog.getByRole("button", { name: "Confirm in wallet" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    expect(f.writes).toBe(1);
    expect(f.submittedTransactions[0].to?.toLowerCase()).toBe(b.vault.toLowerCase());
  });
  test(`a deferred ${kind} precheck discards changed financial inputs on the same form`, async ({ page }) => {
    const f = await fixture();
    await attach(page, f);
    await fillProtocolForm(page, f, kind);
    const gate = f.deferNext("eth_call");
    await page.getByRole("button", { name: `Review ${kind}` }).click();
    await gate.requested;
    await page.getByLabel("Amount", { exact: true }).fill("2");
    gate.release();
    await settleWallet(page);
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(f.writes).toBe(0);
  });
}
for (const event of ["accountsChanged", "disconnect"] as const) {
  test(`a confirmed payment during deferred receipt and ${event} does not leave a stale Activity gate`, async ({ page }) => {
    const f = await fixture();
    await attach(page, f);
    await page.getByRole("button", { name: "Payments", exact: true }).click();
    await page.getByLabel("Recipient address").fill(f.receiver);
    await page.getByLabel("Amount", { exact: true }).fill("0.01");
    await page.getByRole("button", { name: "Review payment" }).click();
    const gate = f.deferNext("eth_getTransactionReceipt");
    await page.getByRole("button", { name: "Confirm in wallet" }).click();
    await gate.requested;
    await emitWalletEvent(page, event, event === "accountsChanged" ? [f.accounts[0]] : { code: 4900 });
    await expect(page.getByRole("dialog")).not.toBeVisible();
    gate.release();
    await settleWallet(page);
    await expect(page.getByText("Receipt confirmed", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Connect wallet", exact: true }).click();
    await expect(page.getByText("Deployment checks passed")).toBeVisible();
    await page.getByRole("button", { name: "Activity", exact: true }).click();
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
    await expect(page.getByText("Submitted", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Recheck receipt" }).click();
    await settleWallet(page);
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();
    expect(f.writes).toBe(1);
    await page.getByRole("button", { name: "Payments", exact: true }).click();
    await page.getByLabel("Recipient address").fill(f.receiver);
    await page.getByLabel("Amount", { exact: true }).fill("0.02");
    await page.getByRole("button", { name: "Review payment" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(f.writes).toBe(1);
  });
}
for (const mismatch of ["vault", "signer", "chain"] as const) {
  test(`submit rejects a prepared ${mismatch} mismatch before journal or actual wallet broadcast`, async ({ page }) => {
    const f = await fixture();
    const target = mismatch === "vault" ? await f.compatibleVault() : f.manifest;
    if (mismatch === "signer") f.setAccount(f.accounts[1]);
    await attach(page, f);
    const data = encodeFunctionData({ abi: vaultAbi, functionName: "agentExecute", args: [f.receiver, 10n ** 16n, "0x"] });
    const response = await page.evaluate(async ({ original, target, from, data, dataHash, mismatch }) => {
      const modulePath = "/src/wallet.ts";
      const { submit } = await import(modulePath) as typeof import("../src/wallet");
      const op = {
        method: "agentExecute", title: "Reviewed payment", details: { Amount: "0.01 ETH" }, data,
        binding: { chainId: mismatch === "chain" ? 11155111 : original.chainId, vault: original.vault, runtimeCodeHash: original.runtimeCodeHash, signer: original.owner, dataHash, provider: window.ethereum },
      };
      try {
        await submit(window.ethereum!, target, from, op, () => {});
        return "sent";
      } catch (error) { return error instanceof Error ? error.message : String(error); }
    }, { original: { ...f.manifest, owner: f.accounts[0] }, target, from: mismatch === "signer" ? f.accounts[1] : f.accounts[0], data, dataHash: keccak256(data), mismatch });
    expect(response).toMatch(/reviewed.*(deployment|signer|context)|prepared/i);
    expect(f.writes).toBe(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("agentwallet-public-intents-v1") ?? "[]"))).toEqual([]);
  });
}
