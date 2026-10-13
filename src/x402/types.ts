import type { Address, Hash } from "viem";
import type { MemoryBudgetStore, PaymentLog, ServiceBudget } from "./budget.js";
export const GUARDED_TRANSACTION_SCHEME = "agent-vault-tx-v1" as const;
export const PAYMENT_REQUIRED_HEADER = "AGENT-VAULT-PAYMENT-REQUIRED";
export const PAYMENT_HEADER = "AGENT-VAULT-PAYMENT";
/** Informational client settlement metadata; use getX402PaymentReceipt for trusted local provenance. */
export const PAYMENT_RECEIPT_HEADER = "AGENT-VAULT-PAYMENT-RECEIPT";
/** Informational addresses, never an implicit spending permission. */
export const USDC_ADDRESSES: Readonly<Record<string, Address>> = Object.freeze({
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
});
export const DEFAULT_SUPPORTED_NETWORKS: readonly string[] = Object.freeze([]);
export interface ApprovedPaymentService {
  readonly origin: string;
  readonly recipient: Address;
  readonly asset: Address;
  readonly network: `eip155:${number}`;
}
export interface GuardedPaymentRequirements {
  readonly scheme: typeof GUARDED_TRANSACTION_SCHEME;
  readonly network: `eip155:${number}`;
  readonly asset: Address;
  readonly amount: string;
  readonly payTo: Address;
  readonly resource: string;
  readonly requestId: string;
  readonly confirmations: number;
  /** Latest permitted payment block timestamp, in Unix milliseconds. */
  readonly expiresAt: number;
  /** Confirmation/proof delivery deadline, independently bounded after the mining deadline. */
  readonly proofExpiresAt: number;
}
export interface GuardedPaymentRequired {
  readonly protocol: typeof GUARDED_TRANSACTION_SCHEME;
  readonly resource: string;
  readonly accepts: readonly GuardedPaymentRequirements[];
}
/** Locally verified on-chain settlement, independent of the merchant response status or delivery. */
export interface X402PaymentReceipt
  extends Omit<GuardedPaymentRequirements, "scheme" | "expiresAt"> {
  readonly protocol: typeof GUARDED_TRANSACTION_SCHEME;
  readonly settlement: "client-confirmed";
  readonly txHash: Hash;
  readonly vault: Address;
}
/** In-session recovery of the exact original transaction/challenge, with the signed proof when available. */
export interface X402PaymentRecovery {
  readonly txHash: Hash;
  readonly paymentRequirements: GuardedPaymentRequirements;
  readonly paymentProof?: string;
}
export type FetchFunction = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;
export interface X402ClientConfig {
  readonly autoPay?: boolean;
  readonly approvedServices?: readonly ApprovedPaymentService[];
  readonly globalDailyLimit?: bigint;
  readonly globalPerRequestMax?: bigint;
  readonly serviceBudgets?: readonly ServiceBudget[];
  readonly durableDirectory?: string;
  readonly memoryStore?: MemoryBudgetStore;
  readonly fetchFn?: FetchFunction;
  readonly onBeforePayment?: (
    requirements: GuardedPaymentRequirements,
    resource: string,
  ) => boolean | Promise<boolean>;
  readonly onPaymentComplete?: (log: PaymentLog) => void;
}
