import {
  constants,
  lstatSync,
  fstatSync,
  realpathSync,
  mkdirSync,
  rmdirSync,
  openSync,
  closeSync,
  readFileSync,
  writeFileSync,
  fsyncSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { join, resolve, isAbsolute } from "node:path";
import { randomUUID } from "node:crypto";
import { isAddress, type Hash } from "viem";
import {
  GUARDED_TRANSACTION_SCHEME,
  type GuardedPaymentRequirements,
} from "./types.js";
export interface IssuedPaymentChallenge {
  readonly payment: GuardedPaymentRequirements;
  readonly issuedAt: number;
  readonly minimumBlock: string;
}
interface MerchantLedger {
  version: 1;
  challenges: Record<string, IssuedPaymentChallenge>;
  consumedTransactions: Record<string, string>;
  consumedRequests: Record<string, string>;
}
const MARKER = "agentwallet-merchant-v1\n";
const requestPattern = /^[A-Za-z0-9_-]{16,128}$/;
const transactionPattern = /^eip155:[1-9]\d*:0x[0-9a-f]{64}$/;
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function keys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
function exists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return false;
    throw error;
  }
}
function validate(value: unknown): asserts value is MerchantLedger {
  if (
    !object(value) ||
    !keys(value, [
      "version",
      "challenges",
      "consumedTransactions",
      "consumedRequests",
    ]) ||
    value.version !== 1 ||
    !object(value.challenges) ||
    !object(value.consumedTransactions) ||
    !object(value.consumedRequests) ||
    Object.keys(value.challenges).length > 1000 ||
    Object.keys(value.consumedTransactions).length > 10000 ||
    Object.keys(value.consumedRequests).length > 10000
  )
    throw new Error("Corrupt merchant settlement ledger");
  for (const [id, challenge] of Object.entries(value.challenges)) {
    if (
      !requestPattern.test(id) ||
      !object(challenge) ||
      !keys(challenge, ["payment", "issuedAt", "minimumBlock"]) ||
      !Number.isSafeInteger(challenge.issuedAt) ||
      Number(challenge.issuedAt) <= 0 ||
      typeof challenge.minimumBlock !== "string" ||
      !/^[1-9]\d{0,77}$/.test(challenge.minimumBlock) ||
      !object(challenge.payment)
    )
      throw new Error("Corrupt merchant challenge");
    const p = challenge.payment;
    if (
      !keys(p, [
        "scheme",
        "network",
        "asset",
        "amount",
        "payTo",
        "resource",
        "requestId",
        "expiresAt",
        "confirmations",
        "proofExpiresAt",
      ]) ||
      p.scheme !== GUARDED_TRANSACTION_SCHEME ||
      typeof p.network !== "string" ||
      !/^eip155:[1-9]\d*$/.test(p.network) ||
      typeof p.asset !== "string" ||
      !isAddress(p.asset) ||
      typeof p.payTo !== "string" ||
      !isAddress(p.payTo) ||
      typeof p.amount !== "string" ||
      !/^[1-9]\d{0,77}$/.test(p.amount) ||
      BigInt(p.amount) >= 2n ** 256n ||
      p.requestId !== id ||
      typeof p.resource !== "string" ||
      p.resource.length > 2048 ||
      !Number.isSafeInteger(p.expiresAt) ||
      Number(p.expiresAt) <= Number(challenge.issuedAt) ||
      Number(p.expiresAt) > Number(challenge.issuedAt) + 300000 ||
      !Number.isSafeInteger(p.confirmations) ||
      Number(p.confirmations) < 1 ||
      Number(p.confirmations) > 64 ||
      !Number.isSafeInteger(p.proofExpiresAt) ||
      Number(p.proofExpiresAt) < Number(p.expiresAt) + 30000 * Number(p.confirmations) ||
      Number(p.proofExpiresAt) > Number(p.expiresAt) + 86400000
    )
      throw new Error("Corrupt merchant payment details");
    const resource = new URL(p.resource);
    if (
      resource.protocol !== "https:" ||
      resource.username ||
      resource.password ||
      resource.hash ||
      resource.href !== p.resource
    )
      throw new Error("Unsafe merchant challenge resource");
  }
  for (const [transaction, id] of Object.entries(value.consumedTransactions))
    if (
      !transactionPattern.test(transaction) ||
      typeof id !== "string" ||
      !requestPattern.test(id) ||
      value.consumedRequests[id] !== transaction
    )
      throw new Error("Corrupt merchant transaction consumption");
  for (const [id, transaction] of Object.entries(value.consumedRequests))
    if (
      !requestPattern.test(id) ||
      typeof transaction !== "string" ||
      !transactionPattern.test(transaction) ||
      value.consumedTransactions[transaction] !== id
    )
      throw new Error("Corrupt merchant request consumption");
}
function freezeChallenge(
  challenge: IssuedPaymentChallenge,
): IssuedPaymentChallenge {
  return Object.freeze({
    ...challenge,
    payment: Object.freeze({ ...challenge.payment }),
  });
}
/** Node/POSIX merchant-owned atomic ledger. Spent transaction identities are never evicted; capacity exhaustion denies. */
export class MerchantSettlementStore {
  private readonly directory: string;
  constructor(directory: string) {
    if (
      typeof constants.O_NOFOLLOW !== "number" ||
      typeof constants.O_DIRECTORY !== "number" ||
      !process.getuid
    )
      throw new Error("Merchant settlement requires POSIX storage safety");
    if (!isAbsolute(directory) || resolve(directory) !== directory)
      throw new Error("Merchant directory must be canonical absolute path");
    this.directory = directory;
    this.checkDirectory();
  }
  private checkDirectory(): void {
    const stat = lstatSync(this.directory);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      realpathSync(this.directory) !== this.directory ||
      (stat.mode & 0o077) !== 0 ||
      stat.uid !== process.getuid!()
    )
      throw new Error("Merchant directory must be owner-only and symlink-free");
  }
  private readFile(path: string, maxBytes: number): string {
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = fstatSync(fd);
      if (
        !stat.isFile() ||
        stat.nlink !== 1 ||
        (stat.mode & 0o077) !== 0 ||
        stat.uid !== process.getuid!() ||
        stat.size > maxBytes
      )
        throw new Error("Unsafe merchant settlement file");
      return readFileSync(fd, "utf8");
    } finally {
      closeSync(fd);
    }
  }
  private writeFile(path: string, content: string): void {
    const fd = openSync(
      path,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        constants.O_NOFOLLOW,
      0o600,
    );
    try {
      writeFileSync(fd, content);
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
  }
  private transaction<T>(callback: (ledger: MerchantLedger) => T): T {
    this.checkDirectory();
    const lock = join(this.directory, "merchant-ledger.lock");
    mkdirSync(lock, { mode: 0o700 });
    const path = join(this.directory, "merchant-ledger.json"),
      marker = join(this.directory, "merchant-ledger.initialized"),
      temporary = join(this.directory, `merchant-ledger-${randomUUID()}.tmp`);
    try {
      const initialized = exists(marker),
        present = exists(path);
      if (initialized !== present)
        throw new Error(
          "Merchant initialized ledger mismatch; independent recovery required",
        );
      if (initialized && this.readFile(marker, MARKER.length) !== MARKER)
        throw new Error("Corrupt merchant initialization marker");
      let ledger: MerchantLedger = {
        version: 1,
        challenges: {},
        consumedTransactions: {},
        consumedRequests: {},
      };
      if (present) {
        ledger = JSON.parse(this.readFile(path, 4_000_000)) as MerchantLedger;
        validate(ledger);
      }
      const result = callback(ledger);
      validate(ledger);
      const serialized = JSON.stringify(ledger);
      if (Buffer.byteLength(serialized) > 4_000_000)
        throw new Error("Merchant ledger capacity reached");
      this.writeFile(temporary, serialized);
      if (!initialized) this.writeFile(marker, MARKER);
      renameSync(temporary, path);
      const fd = openSync(
        this.directory,
        constants.O_RDONLY | constants.O_DIRECTORY,
      );
      try {
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      return result;
    } finally {
      if (exists(temporary)) unlinkSync(temporary);
      rmdirSync(lock);
    }
  }
  issue(challenge: IssuedPaymentChallenge): void {
    this.transaction((ledger) => {
      for (const [id, old] of Object.entries(ledger.challenges))
        if (old.payment.proofExpiresAt <= Date.now()) delete ledger.challenges[id];
      if (
        ledger.challenges[challenge.payment.requestId] ||
        ledger.consumedRequests[challenge.payment.requestId] ||
        Object.keys(ledger.challenges).length >= 1000
      )
        throw new Error("Merchant challenge capacity/collision");
      ledger.challenges[challenge.payment.requestId] =
        freezeChallenge(challenge);
    });
  }
  find(id: string): IssuedPaymentChallenge {
    if (!requestPattern.test(id)) throw new Error("Invalid request identifier");
    return this.transaction((ledger) => {
      if (ledger.consumedRequests[id])
        throw new Error("Payment request already consumed");
      const challenge = ledger.challenges[id];
      if (!challenge || challenge.payment.proofExpiresAt <= Date.now())
        throw new Error("Unknown or expired payment challenge");
      return freezeChallenge(challenge);
    });
  }
  consume(challenge: IssuedPaymentChallenge, txHash: Hash): void {
    this.transaction((ledger) => {
      const id = challenge.payment.requestId,
        key = `${challenge.payment.network}:${txHash.toLowerCase()}`;
      if (ledger.consumedRequests[id] || ledger.consumedTransactions[key])
        throw new Error("Payment request or transaction already consumed");
      const stored = ledger.challenges[id];
      if (
        !stored ||
        JSON.stringify(stored) !== JSON.stringify(challenge) ||
        stored.payment.proofExpiresAt <= Date.now()
      )
        throw new Error("Expired or altered payment challenge");
      if (Object.keys(ledger.consumedRequests).length >= 10000)
        throw new Error("Merchant settlement capacity reached");
      ledger.consumedRequests[id] = key;
      ledger.consumedTransactions[key] = id;
      delete ledger.challenges[id];
    });
  }
}
