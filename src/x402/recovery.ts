import type { X402PaymentRecovery } from "./types.js";

interface RecoveryActions {
  readonly read: () => X402PaymentRecovery;
  readonly retry: (init?: RequestInit) => Promise<Response>;
}
const recoveries = new WeakMap<Response | Error, RecoveryActions>();

/** Internal: only the client that made the original submission may retain its proof retry. */
export function rememberX402PaymentRecovery(
  outcome: Response | Error,
  actions: RecoveryActions,
): void {
  recoveries.set(outcome, actions);
}

/** Internal: preserve the original local proof state on normal SDK response clones. */
export function copyX402PaymentRecovery(source: Response, target: Response): void {
  const recovery = recoveries.get(source);
  if (recovery) recoveries.set(target, recovery);
}

/** Read the immutable original challenge/hash/proof retained in this SDK session; headers are never trusted. */
export function getX402PaymentRecovery(
  outcome: Response | Error,
): X402PaymentRecovery | undefined {
  return recoveries.get(outcome)?.read();
}

/** Retry only confirmation, original proof binding and HTTP delivery. No transfer or new reservation is made. */
export async function retryX402PaymentProof(
  outcome: Response | Error,
  init?: RequestInit,
): Promise<Response> {
  const recovery = recoveries.get(outcome);
  if (!recovery) throw new Error("Outcome has no locally retained payment recovery");
  return recovery.retry(init);
}
