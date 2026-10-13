import { test, expect } from "@playwright/test";
test("disconnected overview contains no invented financial balance", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your capital. Your control." }),
  ).toBeVisible();
  await expect(
    page.getByText("Connect a wallet to load balances"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }),
  ).toBeVisible();
});
test("demo is labelled and cannot request a wallet write", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await expect(page.getByText("Demo · example data only")).toBeVisible();
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page
    .getByLabel("Recipient address")
    .fill("0x1111111111111111111111111111111111111111");
  await page.getByLabel("Amount").fill("1");
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Demo preview — signing is disabled"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm in wallet" }),
  ).toBeDisabled();
});
test("payment input rejects malformed, zero and precision-losing amounts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page.getByLabel("Recipient address").fill("not-an-address");
  await page.getByLabel("Amount").fill("0");
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(page.getByRole("alert")).toContainText("valid recipient");
  await page
    .getByLabel("Recipient address")
    .fill("0x1111111111111111111111111111111111111111");
  await page.getByLabel("Amount").fill("0");
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(page.getByRole("alert")).toContainText("greater than zero");
  await page.getByLabel("Amount").fill("0.0000000000000000001");
  await page.getByRole("button", { name: "Review payment" }).click();
  await expect(page.getByRole("alert")).toContainText("decimal");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("demo operator cannot prepare owner policy changes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page
    .getByRole("button", { name: "Operators & limits", exact: true })
    .click();
  await page.getByLabel("Demo role").selectOption("operator");
  await expect(
    page.getByRole("button", { name: "Review policy" }),
  ).toBeDisabled();
});
test("demo queued approval remains an explicit read-only review", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page.getByRole("button", { name: /^Approvals(?: \d+)?$/ }).click();
  await page.getByRole("button", { name: "Review approval" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Demo preview — signing is disabled")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Confirm in wallet" })).toBeDisabled();
});
test("mobile navigation and help remain keyboard usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Security & help", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Know what you authorize." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("public intent recovery keeps the full transaction hash within mobile and desktop layouts", async ({ page }) => {
  const hash = `0x${"cc".repeat(32)}`;
  await page.addInitScript((intent) => {
    localStorage.setItem("agentwallet-public-intents-v1", JSON.stringify([intent]));
  }, {
    id: "e20e7417-32bd-4c94-a7a4-0adecd420d3b",
    kind: "vault",
    status: "unknown",
    chainId: 84532,
    from: `0x${"11".repeat(20)}`,
    to: `0x${"22".repeat(20)}`,
    value: "0",
    nonce: "1",
    dataHash: `0x${"aa".repeat(32)}`,
    hash,
    label: "Visual fixture payment recovery",
    createdAt: "2026-10-13T00:00:00.000Z",
    meta: { vaultRuntimeHash: `0x${"bb".repeat(32)}`, amount: "0.01 ETH" },
  });
  for (const width of [390, 1440]) {
    await test.step(`${width}px viewport`, async () => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const recovery = page.locator(".intent-recovery");
      await expect(recovery.getByRole("heading", { name: "Wallet request recovery" })).toBeVisible();
      await expect(recovery.getByText("Saved receipt unresolved", { exact: true })).toBeVisible();
      const link = recovery.getByRole("link", { name: `${hash} ↗`, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", `https://sepolia.basescan.org/tx/${hash}`);
      await expect(recovery.getByLabel("Recovered transaction hash")).toHaveValue(hash);
      const layout = await page.evaluate(() => ({
        width: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overflow: Array.from(document.querySelectorAll(".intent-recovery *")).flatMap((element) => {
          const rect = element.getBoundingClientRect();
          return rect.right > window.innerWidth ? [{ tag: element.tagName, class: element.className, right: rect.right }] : [];
        }),
      }));
      expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
      const hashRects = await link.evaluate((element) => Array.from(element.getClientRects(), (rect) => ({ left: rect.left, right: rect.right })));
      expect(hashRects.length).toBeGreaterThan(0);
      expect(hashRects.every((rect) => rect.left >= 0 && rect.right <= width)).toBeTruthy();
    });
  }
});
test("deployment setup is explicit, testnet-only and never signs while disconnected", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Deploy a testnet vault" }).click();
  await expect(
    page.getByRole("heading", { name: "Create an owner-controlled vault" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review deployment" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Base Sepolia · testnet deployment", { exact: true }),
  ).toBeVisible();
});
test("demo trade never invents a live quote", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore demo" }).click();
  await page.getByRole("button", { name: "Trading", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Get on-chain quote" }),
  ).toBeDisabled();
  await expect(page.getByText("No live quote loaded")).toBeVisible();
});
test("destination recovery explains prerequisites and gates signing", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Bridge & recovery", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Receive on the destination" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review destination mint" }),
  ).toBeDisabled();
  await expect(page.getByText(/verified destination manifest/)).toBeVisible();
});
