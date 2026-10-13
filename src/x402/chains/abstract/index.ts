import type { Address, WalletClient } from "viem";
/** Chain IDs are informational; no delegated signing or facilitator support is asserted. */
export const ABSTRACT_CHAIN_IDS = Object.freeze({
  mainnet: 2741,
  testnet: 11124,
});
export const ABSTRACT_USDC: Readonly<Record<number, Address>> = Object.freeze(
  {},
);
export const ABSTRACT_APPROVED_FACILITATORS: readonly Address[] = Object.freeze(
  [],
);
export const ABSTRACT_SUPPORTED_CHAINS = Object.freeze({});
export interface AbstractDelegatedConfig {
  readonly facilitatorAddress: Address;
  readonly userAllowlist?: readonly Address[];
  readonly token?: Address;
  readonly deadlineSeconds?: number;
}
export interface AbstractPaymentParameters {
  readonly amount: bigint;
  readonly payTo: Address;
  readonly nonce: bigint;
  readonly resource: string;
}
/** Retained migration error, never signs unverified delegated authorizations. */
export class AbstractDelegatedFacilitatorAdapter {
  constructor(
    _walletClient: WalletClient,
    _config: AbstractDelegatedConfig,
    _chainId: number = ABSTRACT_CHAIN_IDS.mainnet,
  ) {
    throw new Error(
      "Abstract delegated facilitator support is unverified and disabled. Use a verified AgentVault with explicitly approved guarded transaction settlement.",
    );
  }
  async signPaymentPermit(_params: AbstractPaymentParameters): Promise<never> {
    throw new Error("Unverified delegated permits are unsupported");
  }
  async buildX402Payload(_params: AbstractPaymentParameters): Promise<never> {
    throw new Error("Unverified delegated settlement is unsupported");
  }
  static isAbstractChain(chainId: number): boolean {
    return (
      chainId === ABSTRACT_CHAIN_IDS.mainnet ||
      chainId === ABSTRACT_CHAIN_IDS.testnet
    );
  }
  static getNetworkString(chainId: number): string {
    if (!this.isAbstractChain(chainId))
      throw new Error("Unknown Abstract chain");
    return `eip155:${chainId}`;
  }
}
