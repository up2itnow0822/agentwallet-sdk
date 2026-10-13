import { describe, it, expect, vi } from "vitest";
import { base } from "viem/chains";
import { SwapModule, applySlippage, calcDeadline } from "../swap/index.js";
const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("../wallet/execution.js", () => ({ executeVaultOperation: execute }));
const vault = "0x1111111111111111111111111111111111111111";
const token = "0x2222222222222222222222222222222222222222";
const out = "0x3333333333333333333333333333333333333333";
function wallet() {
    return { address: vault, chain: base, expectedCodeHash: `0x${"ab".repeat(32)}`, contract: {}, publicClient: { getChainId: vi.fn().mockResolvedValue(8453), readContract: vi.fn().mockResolvedValue("0x2626664c2603336E57B271c5C0b26F421741e481"), simulateContract: vi.fn().mockResolvedValue({ result: [1000n, 0n, 0, 50000n] }) }, walletClient: { chain: base, sendTransaction: vi.fn() } };
}
describe("guarded swap regression", () => {
    it("rejects legacy raw EOA clients", () => {
        expect(() => new SwapModule({} as never, {} as never)).toThrow(/AgentWallet|guarded/i);
    });
    it("rejects invalid slippage and deadlines", () => {
        expect(() => applySlippage(100n, 10001)).toThrow();
        expect(() => applySlippage(100n, -1)).toThrow();
        expect(() => calcDeadline(-1)).toThrow();
    });
    it("simulates nonpayable QuoterV2 and executes only the guarded vault with deadline", async () => {
        const w = wallet();
        execute.mockResolvedValue({ txHash: "0x01", receipt: { status: "success" } });
        const swap = new SwapModule(w as never);
        const r = await swap.swap(token, out, 100n, { feeTiers: [500], deadlineSecs: 60 });
        expect(w.publicClient.simulateContract).toHaveBeenCalled();
        expect(execute).toHaveBeenCalledWith(w, "agentSwap", [token, out, 100n, 995n, 500, expect.any(BigInt)]);
        expect(w.walletClient.sendTransaction).not.toHaveBeenCalled();
        expect(r.quote.feeAmount).toBe(0n);
    });
    it("rejects foreign chain, zero amounts and fee collector overrides before quoting", async () => {
        const w = wallet();
        const s = new SwapModule(w as never);
        await expect(s.getQuote(token, out, 0n)).rejects.toThrow();
        await expect(s.swap(token, out, 1n, { feeWallet: vault } as never)).rejects.toThrow();
        w.publicClient.getChainId.mockResolvedValue(1);
        await expect(s.getQuote(token, out, 1n)).rejects.toThrow(/chain/i);
    });
});

describe('swap bounds and failed execution', () => {
    it('does not submit after a quote consumes the deadline', async () => {
        const w = wallet();
        const clock = vi.spyOn(Date, 'now').mockReturnValue(0);
        try {
            w.publicClient.simulateContract.mockImplementation(async () => {
                clock.mockReturnValue(2000);
                return {result: [1000n, 0n, 0, 50000n]};
            });
            execute.mockClear();
            await expect(new SwapModule(w as never).swap(token, out, 100n, {feeTiers: [500], deadlineSecs: 1})).rejects.toThrow(/expired/);
            expect(execute).not.toHaveBeenCalled();
        } finally { clock.mockRestore(); }
    });
    it('rejects excess slippage, number amounts, native tokens and legacy fees before simulation', async () => {
        const w = wallet();
        const s = new SwapModule(w as never, {maxSlippageBps: 100});
        await expect(s.getQuote(token, out, 100n, {slippageBps: 101})).rejects.toThrow(/Slippage/);
        await expect(s.getQuote(token, out, 1 as never)).rejects.toThrow(/bigint/);
        await expect(s.getQuote('0x0000000000000000000000000000000000000000', out, 100n)).rejects.toThrow(/ERC20/);
        expect(() => new SwapModule(w as never, {feeBps: 770} as never)).toThrow(/Unsupported/);
        expect(w.publicClient.simulateContract).not.toHaveBeenCalled();
    });
    it('rejects a substituted router and produces no fee or approval transfer when execution reverts', async () => {
        const w = wallet();
        w.publicClient.readContract.mockResolvedValue(vault);
        const s = new SwapModule(w as never);
        await expect(s.getQuote(token, out, 100n)).rejects.toThrow(/router/);
        w.publicClient.readContract.mockResolvedValue('0x2626664c2603336E57B271c5C0b26F421741e481');
        execute.mockRejectedValueOnce(new Error('owner floor rejected'));
        await expect(s.swap(token, out, 100n, {feeTiers: [500]})).rejects.toThrow(/owner floor/);
        expect(w.walletClient.sendTransaction).not.toHaveBeenCalled();
    });
});
