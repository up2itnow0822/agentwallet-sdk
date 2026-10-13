import type { AgentWallet } from "../types.js";
import { X402Client } from "./client.js";
import type { FetchFunction, X402ClientConfig } from "./types.js";
export function createX402Client(
  wallet: AgentWallet,
  config: X402ClientConfig = {},
): X402Client {
  return new X402Client(wallet, config);
}
export function createX402Fetch(
  wallet: AgentWallet,
  config: X402ClientConfig = {},
): FetchFunction {
  const client = new X402Client(wallet, config);
  return client.fetch.bind(client);
}
export function wrapWithX402(
  fetchFn: FetchFunction,
  wallet: AgentWallet,
  config: X402ClientConfig = {},
): FetchFunction {
  return createX402Fetch(wallet, { ...config, fetchFn });
}
