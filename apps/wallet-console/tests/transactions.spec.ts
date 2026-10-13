import { test, expect, type Page } from "@playwright/test";
import { getAddress } from "viem";
import { fixture } from "./local-vm";
async function attach(page: Page, f: Awaited<ReturnType<typeof fixture>>) {
  await page.exposeFunction("localRpc", f.rpc);
  await page.addInitScript(() => {
    const listeners = new Map<string, Function[]>();
    (window as unknown as { ethereum: unknown }).ethereum = {
      request: (payload: unknown) =>
        (
          window as unknown as { localRpc: (x: unknown) => Promise<unknown> }
        ).localRpc(payload),
      on: (name: string, fn: Function) =>
        listeners.set(name, [...(listeners.get(name) ?? []), fn]),
      removeListener: (name: string, fn: Function) =>
        listeners.set(
          name,
          (listeners.get(name) ?? []).filter((x) => x !== fn),
        ),
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
  await expect(page.getByText("Deployment checks passed")).toBeVisible();
}
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
test("queued payment is distinguished from a completed transfer", async ({
  page,
}) => {
  const f = await fixture();
  await attach(page, f);
  await payment(page, f.receiver, "2");
  await page.getByRole("button", { name: "Confirm in wallet" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(
    page.getByText("Queued · owner approval", { exact: true }),
  ).toBeVisible();
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
