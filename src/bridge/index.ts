export { BridgeModule, BridgeError, createBridge, CCTP_DOMAIN_IDS, BRIDGE_CHAIN_IDS, USDC_CONTRACT, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2, FINALITY_THRESHOLD } from './client.js';
export { FileBridgeStore } from './store.js';
export { BRIDGE_ENVIRONMENTS, CIRCLE_ATTESTATION_API, CIRCLE_ATTESTATION_API_BY_ENVIRONMENT } from './types.js';
export { TokenMessengerV2Abi, MessageTransmitterV2Abi, ERC20BridgeAbi, MessageSentEventAbi } from './abis.js';
export type { BridgeChain, BridgeConfig, BridgeOptions, BridgeRecord, BridgeStore, DestinationClients, AttestedMessage } from './types.js';
