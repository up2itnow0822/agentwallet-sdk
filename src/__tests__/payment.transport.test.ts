import { describe, it, expect, vi, afterEach } from "vitest";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { fetchPublicPaymentResource } from "../x402/transport.js";
vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));
vi.mock("node:https", () => ({
  request: vi.fn(() => {
    throw new Error("socket deliberately disabled in test");
  }),
}));
afterEach(() => {
  vi.mocked(lookup).mockReset();
  vi.mocked(request).mockClear();
});
describe("payment HTTPS transport", () => {
  it("rejects private and mixed DNS before opening a socket", async () => {
    for (const records of [
      [{ address: "127.0.0.1", family: 4 }],
      [
        { address: "8.8.8.8", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ],
    ]) {
      vi.mocked(lookup).mockResolvedValue(records as never);
      await expect(
        fetchPublicPaymentResource("https://merchant.example/item"),
      ).rejects.toThrow("public");
    }
    expect(request).not.toHaveBeenCalled();
  });
  it("pins the validated public DNS result in the actual HTTPS request", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
    ] as never);
    await expect(
      fetchPublicPaymentResource("https://merchant.example/item"),
    ).rejects.toThrow("socket deliberately");
    const options = vi.mocked(request).mock.calls[0]![1] as unknown as {
      agent: boolean;
      autoSelectFamily: boolean;
      lookup: (
        host: string,
        options: unknown,
        callback: (error: null, address: string, family: number) => void,
      ) => void;
    };
    expect(options.agent).toBe(false);
    expect(options.autoSelectFamily).toBe(false);
    const callback = vi.fn();
    options.lookup("merchant.example", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "8.8.8.8", 4);
  });
  it("rejects credentials, non-HTTPS, nonstandard ports, bodies and unsafe methods", async () => {
    for (const url of [
      "http://merchant.example",
      "https://user:pass@merchant.example",
      "https://merchant.example:444",
    ])
      await expect(fetchPublicPaymentResource(url)).rejects.toThrow();
    await expect(
      fetchPublicPaymentResource("https://merchant.example", {
        method: "POST",
        body: "x",
      }),
    ).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});
