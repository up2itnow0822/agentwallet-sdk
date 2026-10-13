import { pad, zeroAddress } from "viem";
import type { Hex } from "viem";
import { CCTP_DOMAIN_IDS, BRIDGE_ENVIRONMENTS, TOKEN_MESSENGER_V2, USDC_CONTRACT } from "./types.js";
import type { BridgeRecord } from "./types.js";
const slice = (message: Hex, start: number, end: number) => `0x${message.slice(2 + start * 2, 2 + end * 2)}` as Hex;
const num = (message: Hex, start: number, size: number) => BigInt(slice(message, start, start + size));
export function validateMessage(record: BridgeRecord, message: unknown, attested: boolean): Hex {
    if (!Object.hasOwn(BRIDGE_ENVIRONMENTS, record.fromChain) || !Object.hasOwn(BRIDGE_ENVIRONMENTS, record.toChain) || record.fromChain === record.toChain || BRIDGE_ENVIRONMENTS[record.fromChain] !== BRIDGE_ENVIRONMENTS[record.toChain]) {
        throw new Error("CCTP message source and destination environment must match");
    }
    if (typeof message !== "string" || !/^0x[0-9a-fA-F]{752}$/.test(message)) {
        throw new Error("Malformed CCTP V2 message; hooks are unsupported");
    }
    const msg = message.toLowerCase() as Hex;
    const equal = (start: number, end: number, expected: Hex) => slice(msg, start, end) === expected.toLowerCase();
    if (num(msg, 0, 4) !== 1n || num(msg, 148, 4) !== 1n || num(msg, 4, 4) !== BigInt(CCTP_DOMAIN_IDS[record.fromChain]) || num(msg, 8, 4) !== BigInt(CCTP_DOMAIN_IDS[record.toChain]) || !equal(44, 76, pad(TOKEN_MESSENGER_V2[record.fromChain], { size: 32 })) || !equal(76, 108, pad(TOKEN_MESSENGER_V2[record.toChain], { size: 32 })) || !equal(108, 140, pad(zeroAddress, { size: 32 })) || num(msg, 140, 4) !== BigInt(record.minFinalityThreshold) || !equal(152, 184, pad(USDC_CONTRACT[record.fromChain], { size: 32 })) || !equal(184, 216, pad(record.recipient, { size: 32 })) || num(msg, 216, 32) !== BigInt(record.amount) || !equal(248, 280, pad(record.vault, { size: 32 })) || num(msg, 280, 32) !== BigInt(record.maxFee)) {
        throw new Error("CCTP message does not match burn source, destination, sender, recipient, token, amount or fee");
    }
    if (attested) {
        if (num(msg, 12, 32) === 0n || num(msg, 144, 4) < BigInt(record.minFinalityThreshold) || ![1000n, 2000n].includes(num(msg, 144, 4)) || num(msg, 312, 32) > BigInt(record.maxFee)) {
            throw new Error("Invalid attested nonce, finality or executed fee");
        }
        if (!record.sourceMessage) {
            throw new Error("Missing source burn message");
        }
        const source = record.sourceMessage.toLowerCase() as Hex;
        for (const [start, end] of [[0, 12], [44, 144], [148, 312]] as const)
            if (slice(msg, start, end) !== slice(source, start, end)) {
                throw new Error("Attestation altered immutable burn fields");
            }
    }
    else if (num(msg, 12, 32) !== 0n || num(msg, 144, 4) !== 0n || num(msg, 312, 32) !== 0n || num(msg, 344, 32) !== 0n) {
        throw new Error("Invalid source CCTP V2 message");
    }
    return msg;
}
export function messageNonce(message: Hex) {
    return slice(message, 12, 44);
}
export function validateAttestation(value: unknown): Hex {
    if (typeof value !== "string" || !/^0x(?:[0-9a-fA-F]{130}){1,16}$/.test(value)) {
        throw new Error("Malformed Circle attestation");
    }
    return value as Hex;
}
