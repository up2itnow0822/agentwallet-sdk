import { describe, it, expect, vi } from "vitest";
const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("../index.js", () => ({ createWallet: (config: unknown) => ({ config }), createX402Fetch: vi.fn() }));
vi.mock("../x402/client.js", () => ({ X402Client: class {
        fetch = vi.fn();
        constructor(wallet: unknown, config: unknown) {
            createClient(wallet, config);
        }
    } }));
vi.mock("../wallet/execution.js", () => ({ verifyGuardedWallet: vi.fn() }));
import { getAgentWallet, createAgentFetch, AgentWalletPlugin } from "../plugins/elizaos.js";
const address = "0x1111111111111111111111111111111111111111";
function config() {
    return { wallet: { address, chain: { id: 8453 }, expectedCodeHash: `0x${"ab".repeat(32)}`, contract: {}, publicClient: { chain: { id: 8453 }, readContract: vi.fn().mockImplementation(({ functionName }: {
                    functionName: string;
                }) => functionName === "owner" ? "0x4444444444444444444444444444444444444444" : true) }, walletClient: { chain: { id: 8453 }, account: { address: "0x2222222222222222222222222222222222222222" } } }, payment: { autoPay: false } };
}
describe("runtime isolation regressions", () => {
    it("rejects raw private key configs", () => {
        expect(() => getAgentWallet({ privateKey: `0x${"01".repeat(32)}`, accountAddress: address } as never)).toThrow(/guarded|AgentWallet/i);
    });
    it("keeps distinct configuration wallet identities isolated and one payment client per scope", () => {
        const a = config(), b = config();
        b.wallet.address = "0x3333333333333333333333333333333333333333";
        const scope = {};
        expect(getAgentWallet(a as never, scope).address).toBe(a.wallet.address);
        expect(getAgentWallet(b as never, {}).address).toBe(b.wallet.address);
        const first = createAgentFetch(a as never, scope);
        expect(createAgentFetch(a as never, scope)).toBe(first);
        expect(() => createAgentFetch(b as never, scope)).toThrow(/changed|scope/i);
    });
    it("provider exposes metadata and bound fetch without gas signer or owner credentials", async () => {
        const runtime = { agentWalletConfig: config() };
        const provider = AgentWalletPlugin.providers[0]!;
        await provider.get(runtime as never);
        const exposed = (runtime as unknown as {
            agentWallet: Record<string, unknown>;
        }).agentWallet;
        expect(exposed.address).toBe(address);
        expect(exposed.walletClient).toBeUndefined();
        expect(exposed.privateKey).toBeUndefined();
    });
    it("rejects owner credentials and inactive operator before exposing runtime capabilities", async () => {
        const c = config();
        c.wallet.publicClient.readContract.mockResolvedValue(c.wallet.walletClient.account.address);
        const r = { agentWalletConfig: c };
        await expect(AgentWalletPlugin.providers[0]!.get(r as never)).rejects.toThrow(/owner/);
        expect((r as unknown as {
            agentWallet: unknown;
        }).agentWallet).toBeUndefined();
        const disabled = config();
        disabled.wallet.publicClient.readContract.mockImplementation(({ functionName }: {
            functionName: string;
        }) => functionName === "owner" ? "0x4444444444444444444444444444444444444444" : false);
        await expect(createAgentFetch(disabled as never)("https://example.com")).rejects.toThrow(/active/);
    });
});
