import { expect, type Page } from "@playwright/test";
import type { fixture, RpcPayload } from "./local-vm";

export type LocalFixture = Awaited<ReturnType<typeof fixture>>;
type WalletEvent = "accountsChanged" | "chainChanged" | "disconnect";
interface TestWalletWindow {
  localRpc: (payload: RpcPayload) => Promise<unknown>;
  emitWalletEvent: (name: WalletEvent, value: unknown) => void;
  pendingWalletRequests: number;
  ethereum: unknown;
}

function provideWallet() {
    const w = window as unknown as TestWalletWindow;
    const listeners = new Map<string, ((value: unknown) => void)[]>();
    w.pendingWalletRequests = 0;
    w.ethereum = {
      request: async (payload: RpcPayload) => {
        w.pendingWalletRequests++;
        try {
          const result = await w.localRpc(payload);
          if (result && typeof result === "object" && "__walletTestError" in result) {
            const error = (result as { __walletTestError: { code: number; message: string } }).__walletTestError;
            throw Object.assign(Error(error.message), { code: error.code });
          }
          return result;
        } finally {
          w.pendingWalletRequests--;
        }
      },
      on: (name: string, fn: (value: unknown) => void) =>
        listeners.set(name, [...(listeners.get(name) ?? []), fn]),
      removeListener: (name: string, fn: (value: unknown) => void) =>
        listeners.set(name, (listeners.get(name) ?? []).filter((x) => x !== fn)),
    };
    w.emitWalletEvent = (name, value) => {
      for (const listener of listeners.get(name) ?? []) listener(value);
    };
}

export async function installWallet(page: Page, f: LocalFixture, afterLoad = false) {
  await page.exposeFunction("localRpc", async (payload: RpcPayload) => {
    try { return await f.rpc(payload); }
    catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === 4001)
        return { __walletTestError: { code: 4001, message: error instanceof Error ? error.message : "Wallet rejected request" } };
      throw error;
    }
  });
  if (afterLoad) await page.evaluate(provideWallet);
  else await page.addInitScript(provideWallet);
}

export async function settleWallet(page: Page) {
  await expect.poll(() => page.evaluate(() => (window as unknown as TestWalletWindow).pendingWalletRequests)).toBe(0);
  // Let React commit continuations of the completed provider requests before
  // checking the absence of a stale view; absence alone can pass too early.
  await settleUi(page);
}

export async function settleUi(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

export async function emitWalletEvent(
  page: Page,
  name: WalletEvent,
  value: unknown,
) {
  await page.evaluate(
    ({ name, value }) =>
      (window as unknown as TestWalletWindow).emitWalletEvent(name, value),
    { name, value },
  );
}

export async function attach(page: Page, f: LocalFixture) {
  await installWallet(page, f);
  await page.goto("/");
  await reconnect(page, f);
}

export async function reconnect(page: Page, f: LocalFixture) {
  await page.getByRole("button", { name: "Connect wallet", exact: true }).click();
  await page.getByLabel("Deployment manifest JSON").fill(JSON.stringify(f.manifest));
  await page.getByRole("button", { name: "Verify deployment" }).click();
  await expect(page.getByText("Deployment checks passed")).toBeVisible();
}
