import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { isAddress, type Address, type Hash } from "viem";

export interface BudgetScope {
  readonly wallet: Address;
  readonly chainId: number;
  readonly asset: Address;
}
export interface ServiceBudget {
  readonly service: string;
  readonly dailyLimit: bigint;
  readonly maxPerRequest: bigint;
}
export interface BudgetConfig {
  readonly scope: BudgetScope;
  readonly globalDailyLimit: bigint;
  readonly globalPerRequestMax: bigint;
  readonly serviceBudgets: readonly ServiceBudget[];
  /** Trusted local configuration only. Existing owner-only directory, never derived from service requests. */
  readonly durableDirectory?: string;
  /** Explicit non-durable alternative for tests only; share this instance across clients. */
  readonly memoryStore?: MemoryBudgetStore;
}
export interface PaymentLog {
  readonly timestamp: number;
  readonly service: string;
  readonly amount: bigint;
  readonly token: Address;
  readonly recipient: Address;
  readonly network: string;
  readonly scheme: "agent-vault-tx-v1";
  readonly url: string;
  readonly txHash: Hash;
  readonly requestId: string;
  readonly success: true;
}
export interface ReservationBinding {
  readonly resource: string;
  readonly requestId: string;
  readonly expiresAt: number;
  readonly payTo?: Address;
  readonly confirmations?: number;
  readonly proofExpiresAt?: number;
}
export interface BudgetReservation {
  readonly id: string;
  readonly service: string;
  readonly amount: bigint;
  readonly state: "reserved" | "submitting";
  readonly created: number;
  readonly txHash?: Hash;
  readonly binding?: ReservationBinding;
}
type Reservation = {
  service: string;
  amount: string;
  state: "reserved" | "submitting";
  created: number;
  txHash?: Hash;
  binding?: ReservationBinding;
};
type StoredLog = Omit<PaymentLog, "amount"> & { amount: string };
type ScopeLedger = {
  day: number;
  total: string;
  services: Record<string, string>;
  reservations: Record<string, Reservation>;
  history: StoredLog[];
  requests: Record<string, number>;
};
type Ledger = { version: 1; scopes: Record<string, ScopeLedger> };
const amountPattern = /^[1-9]\d{0,77}$/;
const uintPattern = /^(0|[1-9]\d{0,77})$/;
function pathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return false;
    throw error;
  }
}
const day = (): number => Math.floor(Date.now() / 86400000);
export function assertPositiveAmount(value: unknown): asserts value is bigint {
  if (typeof value !== "bigint" || value <= 0n || value >= 2n ** 256n)
    throw new Error("Amount must be positive uint256 bigint base units");
}
function origin(value: string): string {
  if (value.length > 2048) throw new Error("Service origin too long");
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.origin !== value ||
    url.username ||
    url.password
  )
    throw new Error("Service must be an exact HTTPS origin");
  return value;
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}
function validateLedger(value: unknown): asserts value is Ledger {
  if (
    !object(value) ||
    !exactKeys(value, ["version", "scopes"]) ||
    value.version !== 1 ||
    !object(value.scopes) ||
    Object.keys(value.scopes).length > 100
  )
    throw new Error("Corrupt budget ledger");
  for (const [key, scope] of Object.entries(value.scopes)) {
    if (
      !/^[a-f0-9]{64}$/.test(key) ||
      !object(scope) ||
      !exactKeys(scope, [
        "day",
        "total",
        "services",
        "reservations",
        "history",
        "requests",
      ]) ||
      !Number.isSafeInteger(scope.day) ||
      Number(scope.day) < 0 ||
      !uintPattern.test(String(scope.total)) ||
      typeof scope.total !== "string" ||
      !object(scope.services) ||
      !object(scope.reservations) ||
      !object(scope.requests) ||
      Object.keys(scope.requests).length > 1000 ||
      !Array.isArray(scope.history) ||
      scope.history.length > 1000 ||
      Object.keys(scope.reservations).length > 1000 ||
      Object.keys(scope.services).length > 1000
    )
      throw new Error("Corrupt budget ledger");
    for (const [service, amount] of Object.entries(scope.services))
      if (
        origin(service) !== service ||
        typeof amount !== "string" ||
        !uintPattern.test(amount)
      )
        throw new Error("Corrupt service total");
    let serviceTotal = 0n;
    for (const amount of Object.values(scope.services))
      serviceTotal += BigInt(amount as string);
    if (serviceTotal !== BigInt(scope.total))
      throw new Error("Inconsistent budget totals");
    for (const [id, r] of Object.entries(scope.reservations)) {
      if (
        !/^[0-9a-f-]{36}$/.test(id) ||
        !object(r) ||
        !exactKeys(r, [
          "service",
          "amount",
          "state",
          "created",
          "txHash",
          "binding",
        ]) ||
        typeof r.service !== "string" ||
        origin(r.service) !== r.service ||
        typeof r.amount !== "string" ||
        !amountPattern.test(r.amount) ||
        BigInt(r.amount) >= 2n ** 256n ||
        !["reserved", "submitting"].includes(String(r.state)) ||
        !Number.isSafeInteger(r.created)
      )
        throw new Error("Corrupt budget reservation");
      if (
        r.txHash !== undefined &&
        (typeof r.txHash !== "string" ||
          !/^0x[a-fA-F0-9]{64}$/.test(r.txHash) ||
          r.state !== "submitting")
      )
        throw new Error("Corrupt submitted transaction");
      if (
        r.binding !== undefined &&
        (!object(r.binding) ||
          !exactKeys(r.binding, [
            "resource",
            "requestId",
            "expiresAt",
            "payTo",
            "confirmations",
            "proofExpiresAt",
          ]) ||
          typeof r.binding.resource !== "string" ||
          r.binding.resource.length > 2048 ||
          new URL(r.binding.resource).origin !== r.service ||
          typeof r.binding.requestId !== "string" ||
          !/^[A-Za-z0-9_-]{16,128}$/.test(r.binding.requestId) ||
          !Number.isSafeInteger(r.binding.expiresAt) ||
          (r.binding.confirmations !== undefined &&
            (!Number.isSafeInteger(r.binding.confirmations) ||
              Number(r.binding.confirmations) < 1 ||
              Number(r.binding.confirmations) > 64)) ||
          (r.binding.proofExpiresAt !== undefined &&
            (!Number.isSafeInteger(r.binding.proofExpiresAt) ||
              Number(r.binding.proofExpiresAt) < Number(r.binding.expiresAt) + 30000 * Number(r.binding.confirmations ?? 1) ||
              Number(r.binding.proofExpiresAt) > Number(r.binding.expiresAt) + 86400000)) ||
          (r.binding.payTo !== undefined &&
            !isAddress(String(r.binding.payTo))))
      )
        throw new Error("Corrupt reservation binding");
    }
    for (const [key, expiry] of Object.entries(scope.requests))
      if (!/^[a-f0-9]{64}$/.test(key) || !Number.isSafeInteger(expiry))
        throw new Error("Corrupt request ledger");
    for (const log of scope.history)
      if (
        !object(log) ||
        !exactKeys(log, [
          "timestamp",
          "service",
          "amount",
          "token",
          "recipient",
          "network",
          "scheme",
          "url",
          "txHash",
          "requestId",
          "success",
        ]) ||
        typeof log.amount !== "string" ||
        !amountPattern.test(log.amount) ||
        typeof log.service !== "string" ||
        origin(log.service) !== log.service ||
        !Number.isSafeInteger(log.timestamp) ||
        log.success !== true ||
        log.scheme !== "agent-vault-tx-v1" ||
        !isAddress(String(log.token)) ||
        !isAddress(String(log.recipient)) ||
        !/^0x[a-fA-F0-9]{64}$/.test(String(log.txHash)) ||
        typeof log.url !== "string" ||
        typeof log.network !== "string" ||
        typeof log.requestId !== "string"
      )
        throw new Error("Corrupt budget history");
  }
}
export class MemoryBudgetStore {
  private ledger: Ledger = {
    version: 1,
    scopes: Object.create(null) as Record<string, ScopeLedger>,
  };
  private locked = false;
  transaction<T>(callback: (ledger: Ledger) => T): T {
    if (this.locked) throw new Error("Budget store locked");
    this.locked = true;
    try {
      const copy = structuredClone(this.ledger);
      const result = callback(copy);
      validateLedger(copy);
      this.ledger = copy;
      return result;
    } finally {
      this.locked = false;
    }
  }
}
class FileBudgetStore {
  private readonly directory: string;
  constructor(directory: string) {
    if (
      typeof constants.O_NOFOLLOW !== "number" ||
      typeof constants.O_DIRECTORY !== "number" ||
      !process.getuid
    )
      throw new Error(
        "Durable budgets require POSIX no-follow and directory-fsync support",
      );
    if (!isAbsolute(directory) || resolve(directory) !== directory)
      throw new Error("Budget directory must be canonical absolute path");
    this.directory = directory;
    this.validateDirectory();
  }
  private validateDirectory(): void {
    const stat = lstatSync(this.directory);
    if (
      !stat.isDirectory() ||
      stat.isSymbolicLink() ||
      realpathSync(this.directory) !== this.directory ||
      (stat.mode & 0o077) !== 0 ||
      (process.getuid && stat.uid !== process.getuid())
    )
      throw new Error(
        "Budget directory must be trusted, owner-only and symlink-free",
      );
  }
  transaction<T>(callback: (ledger: Ledger) => T): T {
    this.validateDirectory();
    const lock = join(this.directory, "budget-ledger.lock");
    // Never break or age out a lock: a crash requires independent operator recovery.
    mkdirSync(lock, { mode: 0o700 });
    const path = join(this.directory, "budget-ledger.json");
    const marker = join(this.directory, "budget-ledger.initialized");
    const temporary = join(this.directory, `budget-ledger-${randomUUID()}.tmp`);
    try {
      let ledger: Ledger = {
        version: 1,
        scopes: Object.create(null) as Record<string, ScopeLedger>,
      };
      const ledgerExists = pathExists(path);
      const markerExists = pathExists(marker);
      if (ledgerExists !== markerExists)
        throw new Error(
          "Budget initialization/ledger mismatch; independent recovery required",
        );
      if (markerExists) {
        const fd = openSync(marker, constants.O_RDONLY | constants.O_NOFOLLOW);
        try {
          const stat = fstatSync(fd);
          if (
            !stat.isFile() ||
            stat.nlink !== 1 ||
            (stat.mode & 0o077) !== 0 ||
            stat.size !== 22 ||
            (process.getuid && stat.uid !== process.getuid()) ||
            readFileSync(fd, "utf8") !== "agentwallet-budget-v1\n"
          )
            throw new Error("Invalid budget initialization marker");
        } finally {
          closeSync(fd);
        }
      }
      if (ledgerExists) {
        const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
        try {
          const stat = fstatSync(fd);
          if (
            !stat.isFile() ||
            stat.size > 4_000_000 ||
            (stat.mode & 0o077) !== 0 ||
            stat.nlink !== 1 ||
            (process.getuid && stat.uid !== process.getuid())
          )
            throw new Error("Unsafe budget ledger file");
          ledger = JSON.parse(readFileSync(fd, "utf8")) as Ledger;
        } finally {
          closeSync(fd);
        }
        validateLedger(ledger);
      }
      const result = callback(ledger);
      validateLedger(ledger);
      const fd = openSync(
        temporary,
        constants.O_CREAT |
          constants.O_EXCL |
          constants.O_WRONLY |
          constants.O_NOFOLLOW,
        0o600,
      );
      try {
        const serialized = JSON.stringify(ledger);
        if (Buffer.byteLength(serialized) > 4_000_000)
          throw new Error("Budget ledger capacity reached");
        writeFileSync(fd, serialized);
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      if (!markerExists) {
        const markerFd = openSync(
          marker,
          constants.O_CREAT |
            constants.O_EXCL |
            constants.O_WRONLY |
            constants.O_NOFOLLOW,
          0o600,
        );
        try {
          writeFileSync(markerFd, "agentwallet-budget-v1\n");
          fsyncSync(markerFd);
        } finally {
          closeSync(markerFd);
        }
      }
      renameSync(temporary, path);
      const directoryFd = openSync(
        this.directory,
        constants.O_RDONLY | constants.O_DIRECTORY,
      );
      try {
        fsyncSync(directoryFd);
      } finally {
        closeSync(directoryFd);
      }
      return result;
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
      rmdirSync(lock);
    }
  }
}
/** Supplemental accounting: protect the storage directory with owner controls; the vault remains the financial boundary. */
export class X402BudgetTracker {
  private readonly store: MemoryBudgetStore | FileBudgetStore;
  private readonly key: string;
  private readonly config: BudgetConfig;
  private readonly services: ReadonlyMap<string, ServiceBudget>;
  constructor(config: BudgetConfig) {
    assertPositiveAmount(config.globalDailyLimit);
    assertPositiveAmount(config.globalPerRequestMax);
    if (
      !isAddress(config.scope.wallet) ||
      !isAddress(config.scope.asset) ||
      !Number.isSafeInteger(config.scope.chainId) ||
      config.scope.chainId <= 0
    )
      throw new Error("Invalid wallet budget scope");
    if (Boolean(config.durableDirectory) === Boolean(config.memoryStore))
      throw new Error(
        "Exactly one durable directory or explicit test memory store is required",
      );
    this.store = config.durableDirectory
      ? new FileBudgetStore(config.durableDirectory)
      : config.memoryStore!;
    this.config = Object.freeze({
      ...config,
      scope: Object.freeze({ ...config.scope }),
    });
    if (!config.serviceBudgets.length || config.serviceBudgets.length > 1000)
      throw new Error("Explicit bounded service budgets required");
    this.services = new Map(
      config.serviceBudgets.map((s) => {
        origin(s.service);
        assertPositiveAmount(s.dailyLimit);
        assertPositiveAmount(s.maxPerRequest);
        return [s.service, Object.freeze({ ...s })];
      }),
    );
    if (this.services.size !== config.serviceBudgets.length)
      throw new Error("Duplicate service budgets");
    this.key = createHash("sha256")
      .update(
        `${config.scope.wallet.toLowerCase()}:${config.scope.chainId}:${config.scope.asset.toLowerCase()}`,
      )
      .digest("hex");
  }
  private withScope<T>(fn: (scope: ScopeLedger) => T): T {
    return this.store.transaction((ledger) => {
      let scope = ledger.scopes[this.key];
      if (!scope) {
        if (Object.keys(ledger.scopes).length >= 100)
          throw new Error("Budget scope capacity reached");
        scope = ledger.scopes[this.key] = {
          day: day(),
          total: "0",
          services: Object.create(null) as Record<string, string>,
          reservations: Object.create(null) as Record<string, Reservation>,
          history: [],
          requests: Object.create(null) as Record<string, number>,
        };
      }
      if (day() < scope.day) throw new Error("Clock moved backwards");
      if (day() > scope.day) {
        scope.day = day();
        scope.total = "0";
        scope.services = Object.create(null) as Record<string, string>;
      }
      return fn(scope);
    });
  }
  private totals(scope: ScopeLedger, service?: string): bigint {
    return (
      BigInt(service ? (scope.services[service] ?? "0") : scope.total) +
      Object.values(scope.reservations)
        .filter((r) => !service || r.service === service)
        .reduce((sum, r) => sum + BigInt(r.amount), 0n)
    );
  }
  private validateBudget(
    scope: ScopeLedger,
    service: string,
    amount: bigint,
  ): void {
    assertPositiveAmount(amount);
    const limit = this.services.get(service);
    if (!limit) throw new Error("Service not authorized");
    if (
      amount > this.config.globalPerRequestMax ||
      amount > limit.maxPerRequest ||
      this.totals(scope) + amount > this.config.globalDailyLimit ||
      this.totals(scope, service) + amount > limit.dailyLimit
    )
      throw new Error("Budget exceeded");
  }
  reserve(
    service: string,
    amount: bigint,
    binding?: ReservationBinding,
  ): string {
    return this.withScope((scope) => {
      this.validateBudget(scope, service, amount);
      if (binding) {
        if (
          binding.resource.length > 2048 ||
          (binding.payTo !== undefined && !isAddress(binding.payTo)) ||
          !Number.isSafeInteger(binding.expiresAt) ||
          binding.expiresAt <= Date.now() ||
          binding.expiresAt > Date.now() + 300000 ||
          (binding.confirmations !== undefined &&
            (!Number.isSafeInteger(binding.confirmations) || binding.confirmations < 1 || binding.confirmations > 64)) ||
          (binding.proofExpiresAt !== undefined &&
            (!Number.isSafeInteger(binding.proofExpiresAt) || binding.proofExpiresAt < binding.expiresAt + 30000 * (binding.confirmations ?? 1) || binding.proofExpiresAt > binding.expiresAt + 86400000)) ||
          !/^[A-Za-z0-9_-]{16,128}$/.test(binding.requestId) ||
          new URL(binding.resource).origin !== service
        )
          throw new Error("Invalid challenge binding");
        for (const [key, expiry] of Object.entries(scope.requests))
          if (expiry <= Date.now()) delete scope.requests[key];
        const key = createHash("sha256")
          .update(`${service}:${binding.requestId}`)
          .digest("hex");
        if (scope.requests[key])
          throw new Error("Payment challenge already reserved");
        if (Object.keys(scope.requests).length >= 1000)
          throw new Error("Request history capacity reached");
        scope.requests[key] = binding.proofExpiresAt ?? binding.expiresAt;
      }
      if (Object.keys(scope.reservations).length >= 1000)
        throw new Error("Reservation capacity reached");
      const id = randomUUID();
      scope.reservations[id] = {
        service,
        amount: amount.toString(),
        state: "reserved",
        created: Date.now(),
        ...(binding
          ? {
              binding: Object.freeze({
                resource: binding.resource,
                requestId: binding.requestId,
                expiresAt: binding.expiresAt,
                ...(binding.confirmations !== undefined ? { confirmations: binding.confirmations } : {}),
                ...(binding.proofExpiresAt !== undefined ? { proofExpiresAt: binding.proofExpiresAt } : {}),
                ...(binding.payTo ? { payTo: binding.payTo } : {}),
              }),
            }
          : {}),
      };
      return id;
    });
  }
  checkBudget(
    service: string,
    amount: bigint,
  ): Readonly<{ allowed: boolean; reason?: string }> {
    try {
      this.withScope((scope) => this.validateBudget(scope, service, amount));
      return Object.freeze({ allowed: true });
    } catch (error) {
      return Object.freeze({
        allowed: false,
        reason: error instanceof Error ? error.message : "Budget rejected",
      });
    }
  }
  markSubmitting(id: string): void {
    this.withScope((scope) => {
      const r = scope.reservations[id];
      if (!r || r.state !== "reserved") throw new Error("Invalid reservation");
      r.state = "submitting";
    });
  }
  markSubmitted(id: string, txHash: Hash): void {
    this.withScope((scope) => {
      const r = scope.reservations[id];
      if (
        !r ||
        r.state !== "submitting" ||
        !/^0x[a-fA-F0-9]{64}$/.test(txHash) ||
        (r.txHash && r.txHash !== txHash)
      )
        throw new Error("Invalid submitted transaction");
      r.txHash = txHash;
    });
  }
  getReservations(): readonly BudgetReservation[] {
    return this.withScope((scope) =>
      Object.freeze(
        Object.entries(scope.reservations).map(([id, r]) =>
          Object.freeze({
            ...r,
            id,
            amount: BigInt(r.amount),
            ...(r.binding ? { binding: Object.freeze({ ...r.binding }) } : {}),
          }),
        ),
      ),
    );
  }
  release(id: string): void {
    this.withScope((scope) => {
      const r = scope.reservations[id];
      if (!r || r.state !== "reserved")
        throw new Error("Cannot release submitted or unknown reservation");
      delete scope.reservations[id];
    });
  }
  complete(id: string, log: PaymentLog): void {
    this.withScope((scope) => {
      const r = scope.reservations[id];
      if (
        !r ||
        r.state !== "submitting" ||
        r.amount !== log.amount.toString() ||
        r.service !== log.service ||
        (r.txHash && r.txHash !== log.txHash) ||
        (r.binding &&
          (r.binding.resource !== log.url ||
            r.binding.requestId !== log.requestId ||
            (r.binding.payTo &&
              r.binding.payTo.toLowerCase() !==
                log.recipient.toLowerCase()))) ||
        log.success !== true ||
        log.token.toLowerCase() !== this.config.scope.asset.toLowerCase() ||
        log.network !== `eip155:${this.config.scope.chainId}`
      )
        throw new Error("Invalid reservation completion");
      scope.total = (BigInt(scope.total) + log.amount).toString();
      scope.services[log.service] = (
        BigInt(scope.services[log.service] ?? "0") + log.amount
      ).toString();
      scope.history.push({
        timestamp: log.timestamp,
        service: log.service,
        amount: log.amount.toString(),
        token: log.token,
        recipient: log.recipient,
        network: log.network,
        scheme: log.scheme,
        url: log.url,
        txHash: log.txHash,
        requestId: log.requestId,
        success: true,
      });
      if (scope.history.length > 1000) scope.history.shift();
      delete scope.reservations[id];
    });
  }
  getTransactionLog(filter?: {
    readonly service?: string;
    readonly since?: number;
  }): readonly PaymentLog[] {
    return this.withScope((scope) =>
      Object.freeze(
        scope.history
          .filter(
            (log) =>
              (!filter?.service || log.service === filter.service) &&
              (filter?.since === undefined || log.timestamp >= filter.since),
          )
          .map((log) => Object.freeze({ ...log, amount: BigInt(log.amount) })),
      ),
    );
  }
  getDailySpendSummary(): Readonly<{
    global: bigint;
    byService: Readonly<Record<string, bigint>>;
    resetsAt: number;
  }> {
    return this.withScope((scope) => {
      const byService: Record<string, bigint> = Object.create(null) as Record<
        string,
        bigint
      >;
      for (const service of new Set([
        ...Object.keys(scope.services),
        ...Object.values(scope.reservations).map((r) => r.service),
      ]))
        byService[service] = this.totals(scope, service);
      return Object.freeze({
        global: this.totals(scope),
        byService: Object.freeze(byService),
        resetsAt: (scope.day + 1) * 86400,
      });
    });
  }
}
