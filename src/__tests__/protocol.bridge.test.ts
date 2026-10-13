import { describe, it, expect, vi } from "vitest";
import { BridgeModule, FINALITY_THRESHOLD, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2 } from "../bridge/index.js";
import { base } from "viem/chains";
const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("../wallet/execution.js", () => ({ executeVaultOperation: execute }));
function wallet() {
    return { address: "0x1111111111111111111111111111111111111111", chain: base, expectedCodeHash: `0x${"ab".repeat(32)}`, contract: {}, publicClient: { getChainId: vi.fn().mockResolvedValue(8453) }, walletClient: { chain: base, account: { address: "0x2222222222222222222222222222222222222222" }, sendTransaction: vi.fn() } };
}
describe("CCTP v2 safety regressions", () => {
    it("uses V2 deployments and standard finality2000", () => {
        expect(FINALITY_THRESHOLD.FAST).toBe(1000);
        expect(FINALITY_THRESHOLD.FINALIZED).toBe(2000);
        expect(TOKEN_MESSENGER_V2.base.toLowerCase()).toBe("0x28b5a0e9c621a5badaa536219b3a228c8168cf5d");
        expect(MESSAGE_TRANSMITTER_V2.base.toLowerCase()).toBe("0x81d40f21f12a8f0e3252bccb954d722d4c464b64");
    });
    it("rejects raw EOA and requires durable store and dedicated destination clients", () => {
        expect(() => new BridgeModule({ account: { address: "0x1" } } as never, {} as never)).toThrow(/guarded|AgentWallet/i);
        expect(() => new BridgeModule(wallet() as never, {} as never)).toThrow(/store|destination/i);
    });
    it("cannot burn with missing or mismatched destination transport", async () => {
        const w = wallet();
        const store = { save: vi.fn(), load: vi.fn(), withLock: vi.fn() };
        const module = new BridgeModule(w as never, { store, destinations: {} } as never);
        await expect(module.burn(1n, "ethereum", { destinationAddress: w.address } as never)).rejects.toThrow(/destination/i);
        expect(execute).not.toHaveBeenCalled();
    });
});
