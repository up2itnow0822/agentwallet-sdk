import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type FormEvent,
} from "react";
import { useReviewDialog } from "./useReviewDialog";
import { useIntents } from "./useIntents";
import IntentRecovery from "./IntentRecovery";
import { assertNoUnresolvedIntent, readIntents, reconcileIntent, type PublicIntent } from "./intents";
import {
  formatUnits,
  decodeFunctionResult,
  type Address,
  type Hex,
} from "viem";
import {
  address,
  amount,
  integer,
  parseManifest,
  chains,
  allowWrite,
  type Manifest,
  type Role,
} from "./security";
import {
  client,
  estimate,
  explain,
  load,
  operation,
  submit,
  verify,
  bindOperation,
  type Operation,
  type PreparedOperation,
  type Provider,
  type Snapshot,
  type Pending,
} from "./wallet";
import { vaultAbi } from "./abi";
import "./style.css";
import {
  readBridgeSources,
  saveBridgeSource,
  updateBridgeSource,
  saveMintSource,
} from "./bridgeRecords";
const Recovery = lazy(() => import("./Recovery"));
const Deploy = lazy(() => import("./Deploy"));
const sections = [
  "Overview",
  "Payments",
  "Trading",
  "Staking",
  "Bridge & recovery",
  "Operators & limits",
  "Approvals",
  "Activity",
  "Security & help",
] as const;
type Section = (typeof sections)[number];
const zero = "0x0000000000000000000000000000000000000000" as Address;
const demoToken = "0x2222222222222222222222222222222222222222" as Address;
const demoOutput = "0x3333333333333333333333333333333333333333" as Address;
const demoManifest: Manifest = {
  chainId: 84532,
  vault: "0x4444444444444444444444444444444444444444",
  runtimeCodeHash: ("0x" + "11".repeat(32)) as Hex,
  securityVersion: 1,
  assets: [
    { address: demoToken, symbol: "USDC", decimals: 6 },
    { address: demoOutput, symbol: "WETH", decimals: 18 },
  ],
};
const titles: Record<Section, [string, string]> = {
  Overview: [
    "Your capital. Your control.",
    "A clear view of your vault, permissions, and every decision.",
  ],
  Payments: [
    "Pay with clear boundaries.",
    "Send from your vault. Keep your wallet keys in your wallet.",
  ],
  Trading: [
    "Set the terms of every trade.",
    "Exact input, a minimum received, and a short expiry.",
  ],
  Staking: [
    "Put your assets to work.",
    "Supply to Aave or withdraw directly back to your vault.",
  ],
  "Bridge & recovery": [
    "Move funds. Follow every step.",
    "CCTP burns are irreversible; receiving on the destination is a separate transaction.",
  ],
  "Operators & limits": [
    "Give permission with limits.",
    "The owner decides who can spend, where, and how much.",
  ],
  Approvals: [
    "Your approval matters.",
    "Inspect the complete request before granting one-time execution.",
  ],
  Activity: [
    "Every action, in view.",
    "Receipts distinguish confirmed transfers, queued requests, and failures.",
  ],
  "Security & help": [
    "Know what you authorize.",
    "Useful boundaries, explicit prerequisites, and no custody of your keys.",
  ],
};
function short(a: string) {
  return a.length > 20 ? a.slice(0, 6) + "…" + a.slice(-4) : a;
}
function display(n: bigint, d: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(
    Number(formatUnits(n, d)),
  );
}
function tradeFingerprint(form: HTMLFormElement) {
  const fields = new FormData(form);
  return JSON.stringify(
    ["input", "output", "amount", "minimum", "fee", "minutes"].map(
      (name) => String(fields.get(name) ?? ""),
    ),
  );
}
function formFingerprint(form: HTMLFormElement) {
  return JSON.stringify(Array.from(new FormData(form), ([name, value]) => [name, String(value)]));
}
interface ReviewContext {
  epoch: number;
  manifest?: Manifest;
  signer?: Address;
  provider?: Provider;
  demo: boolean;
  verified: boolean;
  role: Role;
  form?: HTMLFormElement;
  values?: string;
}
interface Activity {
  title: string;
  status: string;
  hash?: Hex;
  time: string;
  error?: string;
  deployment?: Manifest;
  data?: Hex;
  signer?: Address;
}
interface InspectedPending {
  chainId: number;
  vault: Address;
  pending: Pending;
}
function Icon({ index = 0 }: { index?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect
        x={index % 2 ? 4 : 3}
        y="4"
        width="16"
        height="16"
        rx={index % 2 ? 8 : 4}
      />
      <path
        d={
          index % 3 === 0
            ? "M7 12h10M12 7v10"
            : index % 3 === 1
              ? "m8 12 3 3 5-6"
              : "M7 15l4-6 3 4 3-3"
        }
      />
    </svg>
  );
}
function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        aria-label={label}
        defaultValue={defaultValue}
        type={type}
        autoComplete="off"
        spellCheck={false}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
export default function App() {
  const journal = useIntents();
  const [bridgeSources, setBridgeSources] = useState(readBridgeSources);
  const [quote, setQuote] = useState("");
  const tradeForm = useRef<HTMLFormElement>(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [section, setSection] = useState<Section>("Overview");
  const [demo, setDemo] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>("owner");
  const [walletProvider, setWalletProvider] = useState(() => window.ethereum);
  const [account, setAccount] = useState<Address>();
  const [manifest, setManifest] = useState<Manifest>();
  const [manifestText, setManifestText] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [review, setReview] = useState<PreparedOperation>();
  const [gas, setGas] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState<Hex>();
  const [reviewIntentId, setReviewIntentId] = useState<string>();
  const [activity, setActivity] = useState<Activity[]>([]);
  const [theme, setTheme] = useState("dark");
  const [admin, setAdmin] = useState("budget");
  const [stake, setStake] = useState("supply");
  const [bridgeHash, setBridgeHash] = useState("");
  const [bridgeStatus, setBridgeStatus] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [extraPending, setExtraPending] = useState<InspectedPending>();
  const modalRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const m = demo ? demoManifest : manifest;
  const role = demo ? demoRole : (snapshot?.role ?? "observer");
  const verified = !!snapshot && !demo;
  const assets = demo
    ? demoManifest.assets
    : (snapshot?.assets ?? manifest?.assets ?? []);
  const chainName =
    chains[(m?.chainId ?? 84532) as keyof typeof chains]?.name ??
    "Base Sepolia";
  const disabled = !demo && !verified;
  const writeBlocked = disabled || (!demo && journal.blocked);
  const ownerDisabled = writeBlocked || role !== "owner";
  const reviewIntent = journal.entries.find((intent) => intent.id === reviewIntentId);
  const reviewSpent = !!reviewIntentId && reviewIntent?.status !== "rejected";
  const reviewedHash = reviewSubmitted ?? reviewIntent?.hash;
  const view = useRef({ manifest: m, signer: account, demo });
  view.current = { manifest: m, signer: account, demo };
  function reviewContext(): ReviewContext {
    return { epoch: generation.current, manifest: m, signer: account,
      provider: window.ethereum, demo, verified, role };
  }
  function currentReview(context: ReviewContext) {
    const active = view.current;
    return context.epoch === generation.current && context.provider === window.ethereum &&
      context.demo === active.demo && context.signer?.toLowerCase() === active.signer?.toLowerCase() &&
      context.manifest?.chainId === active.manifest?.chainId &&
      context.manifest?.vault.toLowerCase() === active.manifest?.vault.toLowerCase() &&
      context.manifest?.runtimeCodeHash.toLowerCase() === active.manifest?.runtimeCodeHash.toLowerCase() &&
      (!context.form || (context.form.isConnected && context.values === formFingerprint(context.form)));
  }
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const provider = walletProvider;
    if (!provider) return;
    const changed = () => {
      generation.current++;
      setSnapshot(undefined);
      setAccount(undefined);
      setReview(undefined);
      setQuote("");
      setExtraPending(undefined);
      setReviewSubmitted(undefined);
      setReviewIntentId(undefined);
      setGas("");
      setBusy("");
      setError(
        "Wallet account or network changed. Reconnect and verify the deployment again.",
      );
    };
    provider.on("accountsChanged", changed);
    provider.on("chainChanged", changed);
    provider.on("disconnect", changed);
    return () => {
      provider.removeListener("accountsChanged", changed);
      provider.removeListener("chainChanged", changed);
      provider.removeListener("disconnect", changed);
    };
  }, [walletProvider]);
  const rememberReviewOpener = useReviewDialog(modalRef, !!review, !!busy, () => setReview(undefined));
  async function refresh(current = m, currentAccount = account) {
    if (!current || !currentAccount || !window.ethereum || demo) return;
    const epoch = generation.current;
    setBusy("Reading vault…");
    try {
      const next = await load(window.ethereum, current, currentAccount);
      if (epoch !== generation.current) return;
      setSnapshot(next);
      setExtraPending(undefined);
      setError("");
    } catch (e) {
      if (epoch !== generation.current) return;
      setSnapshot(undefined);
      setError(explain(e));
    } finally {
      if (epoch === generation.current) setBusy("");
    }
  }
  async function connect() {
    const epoch = ++generation.current;
    setError("");
    setBusy("Connecting…");
    try {
      const provider = window.ethereum;
      if (!provider)
        throw Error(
          "No injected wallet found. Open this console in a browser with an Ethereum wallet extension, then connect.",
        );
      setDemo(false);
      setWalletProvider(provider);
      const addresses = await provider.request({
        method: "eth_requestAccounts",
      });
      if (epoch !== generation.current) return;
      if (!addresses.length) throw Error("Wallet returned no account.");
      setAccount(addresses[0]);
      if (manifest) await refresh(manifest, addresses[0]);
    } catch (e) {
      if (epoch === generation.current) setError(explain(e));
    } finally {
      if (epoch === generation.current) setBusy("");
    }
  }
  async function verifyManifest(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const parsed = parseManifest(JSON.parse(manifestText));
      setManifest(parsed);
      setSnapshot(undefined);
      setExtraPending(undefined);
      setReview(undefined);
      generation.current++;
      if (!account)
        throw Error(
          "Manifest loaded. Connect your wallet to verify the chain, deployed code, and role.",
        );
      setDemo(false);
      await refresh(parsed, account);
    } catch (e) {
      setError(explain(e));
    }
  }
  function leaveDemo() {
    setDemo(false);
    setSnapshot(undefined);
    setReview(undefined);
    setSection("Overview");
    setError("");
  }
  async function prepare(op: Operation, opener?: HTMLElement, context = reviewContext()) {
    if (!currentReview(context)) return;
    rememberReviewOpener(opener);
    const epoch = context.epoch;
    setError("");
    setGas("");
    try {
      if (!context.manifest) throw Error("Load your deployment manifest first.");
      if (!context.demo) {
        assertNoUnresolvedIntent();
        if (!context.signer || !context.provider)
          throw Error("Connect a wallet and verify your deployment first.");
        allowWrite(context.role, op.method, context.verified, false);
        setBusy("Simulating transaction…");
        const quote = await estimate(context.provider, context.manifest, context.signer, op);
        if (!currentReview(context)) return;
        setGas(`${quote.fee} ETH (estimate, wallet shows final fee)`);
      }
      if (!currentReview(context)) return;
      setReviewSubmitted(undefined);
      setReviewIntentId(undefined);
      setReview(bindOperation(op, context.manifest, context.signer ?? zero, context.provider));
    } catch (e) {
      if (currentReview(context)) setError(explain(e));
    } finally {
      if (epoch === generation.current) setBusy("");
    }
  }
  async function confirm() {
    if (
      !review ||
      !manifest ||
      !account ||
      !window.ethereum ||
      demo ||
      reviewedHash || reviewSpent || journal.blocked
    )
      return;
    const op = review;
    const epoch = generation.current;
    const provider = window.ethereum;
    setBusy("Confirm in your wallet…");
    setError("");
    let sent: Hex | undefined;
    try {
      const result = await submit(
        provider,
        manifest,
        account,
        op,
        (hash) => {
          sent = hash;
          if (epoch === generation.current) setReviewSubmitted(hash);
          if (op.method === "agentBridge") {
            try {
              setBridgeSources(saveBridgeSource(manifest, hash, op.details));
            } catch {
              setError(
                `Browser recovery storage is unavailable. Copy and keep this source transaction hash: ${hash}`,
              );
            }
          }
          if (epoch === generation.current) setBusy("Submitted · waiting for 2 confirmations…");
          setActivity((a) => [
            {
              title: op.title,
              status: "Submitted",
              hash,
              deployment: manifest,
              data: op.data,
              signer: account,
              time: new Date().toLocaleTimeString(),
            },
            ...a,
          ]);
        },
        { onClaimed: (intent) => {
          if (epoch === generation.current) setReviewIntentId(intent.id);
        }, assertCurrent: () => {
          if (epoch !== generation.current || window.ethereum !== provider)
            throw Error("Wallet changed since review. Reconnect and review again.");
        } },
      );
      if (op.method === "agentBridge" && sent) {
        try {
          setBridgeSources(updateBridgeSource(sent, "Source confirmed"));
        } catch {
          setError(
            `Keep your source hash ${sent}; the browser could not save its recovery status.`,
          );
        }
      }
      setActivity((a) =>
        a.map((row) =>
          row.hash === sent
            ? {
                ...row,
                status:
                  result.queuedId !== undefined
                    ? "Queued · owner approval"
                    : "Confirmed",
              }
            : row,
        ),
      );
      if (epoch !== generation.current) return;
      setReview(undefined);
      await refresh(manifest, account);
    } catch (e) {
      const message = explain(e);
      if (epoch === generation.current) setError(message);
      let reverted = false;
      try { reverted = !!sent && readIntents().some((intent) => intent.hash === sent && intent.status === "reverted"); }
      catch { /* Unavailable storage cannot establish a confirmed revert. */ }
      if (sent && op.method === "agentBridge") {
        try {
          setBridgeSources(
            updateBridgeSource(
              sent,
              reverted
                ? "Source reverted"
                : "Receipt unresolved",
            ),
          );
        } catch {
          /* The source hash remains visible in session activity. */
        }
      }
      if (sent)
        setActivity((a) =>
          a.map((row) =>
            row.hash === sent
              ? {
                  ...row,
                  status: reverted
                    ? "Reverted"
                    : "Receipt unresolved",
                  error: message,
                }
              : row,
          ),
        );
    } finally {
      if (epoch === generation.current) setBusy("");
    }
  }
  function onReconciled(intent: PublicIntent) {
    setActivity((rows) => rows.map((row) => row.hash === intent.hash ? {
      ...row, error: undefined,
      status: intent.status === "reverted" ? "Reverted" : intent.queueId !== undefined ? "Queued · owner approval" : "Confirmed",
    } : row));
    try {
      if (intent.kind === "source" && intent.hash && intent.to) {
        saveBridgeSource({ chainId: intent.chainId, vault: intent.to, runtimeCodeHash: intent.meta.vaultRuntimeHash as Hex, securityVersion: 1, assets: [] }, intent.hash, {
          Amount: intent.meta.amount ?? "", Recipient: intent.meta.recipient ?? "", "Destination domain": intent.meta.destinationDomain ?? "",
        });
        updateBridgeSource(intent.hash, intent.status === "reverted" ? "Source reverted" : "Source confirmed");
      }
      if (intent.kind === "mint" && intent.hash && intent.meta.sourceHash)
        saveMintSource(intent.meta.sourceHash as Hex, intent.hash, intent.chainId, intent.status === "reverted" ? "Destination reverted" : "Destination confirmed");
      setBridgeSources(readBridgeSources());
    } catch {
      setError(`Receipt verified. Keep transaction hash ${intent.hash}; the browser could not update its source transfer record.`);
    }
    if (manifest?.chainId === intent.chainId && manifest.vault.toLowerCase() === intent.to)
      void refresh(manifest, account);
  }
  async function inspectReceipt(row: Activity) {
    setError("");
    setBusy("Checking the submitted receipt…");
    try {
      if (!row.hash || !row.deployment || !row.data || !window.ethereum)
        throw Error("The original public transaction context is required.");
      const provider = window.ethereum;
      const accounts = await provider.request({ method: "eth_accounts" });
      if (!accounts[0])
        throw Error("Connect your wallet on the original transaction network.");
      await verify(provider, row.deployment, accounts[0]);
      const original = readIntents().find((intent) => intent.hash === row.hash);
      if (!original) throw Error("The original public recovery intent is required.");
      const { intent } = await reconcileIntent(provider, original.id, row.hash);
      onReconciled(intent);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy("");
    }
  }
  function selectedAsset(form: FormData, name = "asset") {
    const id = String(form.get(name) ?? "native");
    if (id === "native") return { address: zero, symbol: "ETH", decimals: 18 };
    const found = assets.find((a) => a.address === id);
    if (!found) throw Error("Select a configured asset.");
    return found;
  }
  async function formReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const context: ReviewContext = { ...reviewContext(), form, values: formFingerprint(form) };
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    setError("");
    const f = new FormData(form);
    const val = (key: string) => String(f.get(key) ?? "");
    try {
      if (!m) throw Error("Load your deployment manifest first.");
      let op: Operation;
      if (section === "Payments") {
        const token = selectedAsset(f);
        const to = address(val("recipient"), "recipient");
        const n = amount(val("amount"), token.decimals);
        op = operation(
          token.address === zero ? "agentExecute" : "agentTransferToken",
          token.address === zero ? [to, n, "0x"] : [token.address, to, n],
          "Send payment",
          {
            Amount: `${val("amount")} ${token.symbol}`,
            Recipient: to,
            Source: m.vault,
            Chain: chainName,
            Permission:
              "Bounded payment; exceeding policy may queue an owner approval",
          },
        );
      } else if (section === "Trading") {
        const input = selectedAsset(f, "input");
        const output = selectedAsset(f, "output");
        if (input.address === output.address)
          throw Error("Choose different input and output tokens.");
        const n = amount(val("amount"), input.decimals),
          minimum = amount(val("minimum"), output.decimals);
        const fee = integer(val("fee"), "Pool fee", 10000n);
        if (![100n, 500n, 3000n, 10000n].includes(fee))
          throw Error("Select a supported pool fee.");
        const minutes = integer(val("minutes"), "Expiry minutes", 30n);
        if (minutes < 1n)
          throw Error("Expiry must be between 1 and 30 minutes.");
        const deadline = BigInt(Math.floor(Date.now() / 1000)) + minutes * 60n;
        if (!demo && context.provider) {
          if (!currentReview(context)) return;
          const pair = await client(context.provider).readContract({
            address: m.vault,
            abi: vaultAbi,
            functionName: "swapPairs",
            args: [input.address, output.address],
          });
          if (!currentReview(context)) return;
          if (pair[0] === 0n || pair[1] < deadline)
            throw Error(
              "Owner pair floor is missing or expires before this trade. Ask the owner to configure it.",
            );
          if (minimum < (n * pair[0] + 10n ** 18n - 1n) / 10n ** 18n)
            throw Error("Minimum received is below the owner pair floor.");
        }
        op = operation(
          "agentSwap",
          [input.address, output.address, n, minimum, Number(fee), deadline],
          "Swap assets",
          {
            Spend: `${val("amount")} ${input.symbol}`,
            "Minimum received": `${val("minimum")} ${output.symbol}`,
            "Pool fee": `${Number(fee) / 10000}%`,
            Deadline: new Date(Number(deadline) * 1000).toLocaleString(),
            Destination: m.vault,
            Chain: chainName,
          },
        );
      } else if (section === "Staking") {
        const token = selectedAsset(f);
        const n = amount(val("amount"), token.decimals);
        op = operation(
          stake === "supply" ? "agentSupply" : "agentWithdraw",
          [token.address, n],
          stake === "supply" ? "Supply to Aave" : "Withdraw from Aave",
          {
            Amount: `${val("amount")} ${token.symbol}`,
            Destination:
              stake === "supply"
                ? "Aave pool; aTokens remain in the vault"
                : m.vault,
            Chain: chainName,
            Note: "Rates vary. No yield estimate is assumed.",
          },
        );
      } else if (section === "Bridge & recovery") {
        const token = selectedAsset(f);
        const n = amount(val("amount"), token.decimals);
        const domain = integer(
          val("domain"),
          "Destination domain",
          2n ** 32n - 1n,
        );
        const recipient = val("bridgeRecipient");
        if (!/^0x[\da-f]{64}$/i.test(recipient) || /^0x0{64}$/i.test(recipient))
          throw Error(
            "Bridge recipient must be a nonzero bytes32 hex address.",
          );
        const maxFee = amount(val("maxFee"), token.decimals);
        if (maxFee >= n)
          throw Error("Maximum fee must be less than the amount.");
        const finality = integer(val("finality"), "Finality", 2000n);
        if (![1000n, 2000n].includes(finality))
          throw Error("Choose 1000 fast or 2000 standard finality.");
        if (!demo && context.provider) {
          if (!currentReview(context)) return;
          const allowed = await client(context.provider).readContract({
            address: m.vault,
            abi: vaultAbi,
            functionName: "bridgeDestinations",
            args: [Number(domain)],
          });
          if (!currentReview(context)) return;
          if (allowed.toLowerCase() !== recipient.toLowerCase())
            throw Error(
              "Destination does not match the owner-approved bridge recipient.",
            );
        }
        op = operation(
          "agentBridge",
          [
            token.address,
            n,
            Number(domain),
            recipient as Hex,
            maxFee,
            Number(finality),
          ],
          "Bridge via CCTP",
          {
            Amount: `${val("amount")} ${token.symbol}`,
            "Maximum CCTP fee": `${val("maxFee")} ${token.symbol}`,
            "Destination domain": String(domain),
            Recipient: recipient,
            Finality: finality === 2000n ? "Standard" : "Fast",
            "Source chain": chainName,
            Risk: "Burn is irreversible. Destination settlement requires a separately verified receiving deployment.",
          },
        );
      } else {
        if (role !== "owner") throw Error("Only the owner can change policy.");
        if (admin === "budget") {
          const token = selectedAsset(f);
          const perTx = amount(val("perTx"), token.decimals);
          const period = amount(val("periodLimit"), token.decimals);
          if (period < perTx)
            throw Error(
              "Period limit must be at least the per-transaction limit.",
            );
          const seconds = integer(
            val("periodLength"),
            "Period seconds",
            31536000n,
          );
          if (seconds < 60n)
            throw Error("Choose a period of at least 60 seconds.");
          op = operation(
            "setSpendPolicy",
            [token.address, perTx, period, seconds],
            "Update spending policy",
            {
              Asset: token.symbol,
              "Per transaction": val("perTx"),
              "Per period": val("periodLimit"),
              Period: `${seconds} seconds`,
              Effect: "Changing policy invalidates earlier queued requests",
            },
          );
        } else if (admin === "operator") {
          const operator = address(val("operator"), "operator");
          if (!demo && operator.toLowerCase() === snapshot?.owner.toLowerCase())
            throw Error("The owner cannot be enrolled as an operator.");
          op = operation(
            "setOperator",
            [operator, val("allowed") === "yes"],
            "Update operator",
            {
              Operator: operator,
              Permission:
                val("allowed") === "yes"
                  ? "Enable bounded spending"
                  : "Revoke spending",
              Effect: "Changing policy invalidates earlier queued requests",
            },
          );
        } else if (admin === "recipient") {
          const recipient = address(val("recipient"), "recipient");
          op = operation(
            "setRecipient",
            [recipient, val("allowed") === "yes"],
            "Update recipient",
            {
              Recipient: recipient,
              Permission:
                val("allowed") === "yes" ? "Allow payments" : "Block payments",
            },
          );
        } else if (admin === "pair") {
          const input = selectedAsset(f, "input"),
            output = selectedAsset(f, "output");
          if (input.address === output.address)
            throw Error("Choose different tokens.");
          const rate = amount(val("rate"), 18);
          const minutes = integer(
            val("minutes"),
            "Floor validity minutes",
            43200n,
          );
          if (minutes === 0n) throw Error("Floor validity must be positive.");
          const expiry = BigInt(Math.floor(Date.now() / 1000)) + minutes * 60n;
          op = operation(
            "setSwapPair",
            [input.address, output.address, rate, expiry],
            "Update swap floor",
            {
              Pair: `${input.symbol} → ${output.symbol}`,
              "Raw token minimum ratio": `${val("rate")} × 10¹⁸`,
              Expiry: new Date(Number(expiry) * 1000).toLocaleString(),
              Effect:
                "Rate compares raw token units; review different token decimals carefully",
            },
          );
        } else if (admin === "destination") {
          const domain = integer(
              val("domain"),
              "Destination domain",
              2n ** 32n - 1n,
            ),
            recipient = val("bridgeRecipient");
          if (
            !/^0x[\da-f]{64}$/i.test(recipient) ||
            /^0x0{64}$/i.test(recipient)
          )
            throw Error("Recipient must be nonzero bytes32.");
          op = operation(
            "setBridgeDestination",
            [Number(domain), recipient as Hex],
            "Update bridge destination",
            { Domain: String(domain), Recipient: recipient },
          );
        } else
          op = operation(
            "setPaused",
            [val("paused") === "yes"],
            val("paused") === "yes" ? "Pause vault" : "Resume vault",
            {
              Effect:
                val("paused") === "yes"
                  ? "Block all operator asset operations"
                  : "Allow operations under configured policies",
            },
          );
      }
      if (!currentReview(context)) return;
      await prepare(op, opener, context);
    } catch (e) {
      if (currentReview(context)) setError(explain(e));
    }
  }
  function assetSelect(label = "Asset", name = "asset", native = true) {
    return (
      <label className="field">
        <span>{label}</span>
        <select aria-label={label} name={name}>
          {native && <option value="native">ETH · native</option>}
          {assets.map((a) => (
            <option key={a.address} value={a.address}>
              {a.symbol} · {short(a.address)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  async function getQuote() {
    const epoch = generation.current;
    setError("");
    setQuote("");
    try {
      if (
        demo ||
        !m ||
        !verified ||
        !window.ethereum ||
        !account ||
        !tradeForm.current
      )
        throw Error("Verify a deployment to request a real quote.");
      const form = tradeForm.current;
      const fingerprint = tradeFingerprint(form);
      const f = new FormData(form);
      const input = selectedAsset(f, "input"),
        output = selectedAsset(f, "output");
      if (input.address === output.address)
        throw Error("Choose different input and output tokens.");
      const n = amount(String(f.get("amount")), input.decimals);
      const fee = Number(integer(String(f.get("fee")), "Pool fee", 10000n));
      const minutes = integer(String(f.get("minutes")), "Expiry minutes", 30n);
      if (minutes < 1n) throw Error("Expiry must be positive.");
      const deadline = BigInt(Math.floor(Date.now() / 1000)) + minutes * 60n;
      setBusy("Simulating vault swap for a quote…");
      const rpc = client(window.ethereum);
      const pair = await rpc.readContract({
        address: m.vault,
        abi: vaultAbi,
        functionName: "swapPairs",
        args: [input.address, output.address],
      });
      if (pair[0] === 0n || pair[1] < deadline)
        throw Error(
          "An owner pair floor valid through the trade deadline is required.",
        );
      const floor = (n * pair[0] + 10n ** 18n - 1n) / 10n ** 18n;
      const op = operation(
        "agentSwap",
        [input.address, output.address, n, floor, fee, deadline],
        "Quote",
        {},
      );
      const result = await rpc.call({ account, to: m.vault, data: op.data });
      if (!result.data) throw Error("Swap simulation returned no quote.");
      const received = decodeFunctionResult({
        abi: vaultAbi,
        functionName: "agentSwap",
        data: result.data,
      });
      const suggested = (received * 995n) / 1000n;
      const minimum = suggested > floor ? suggested : floor;
      const block = await rpc.getBlockNumber();
      if (epoch !== generation.current || tradeForm.current !== form ||
        tradeFingerprint(form) !== fingerprint) return;
      const el = form.elements.namedItem("minimum");
      if (el instanceof HTMLInputElement)
        el.value = formatUnits(minimum, output.decimals);
      setQuote(
        `Simulated output: ${formatUnits(received, output.decimals)} ${output.symbol} · block ${block}. Suggested minimum allows up to 0.5% slippage, bounded by the owner floor. Quote can change before mining.`,
      );
    } catch (e) {
      if (epoch === generation.current) setError(explain(e));
    } finally {
      if (epoch === generation.current) setBusy("");
    }
  }
  async function inspectPending() {
    const epoch = generation.current;
    setError("");
    try {
      if (!m || !window.ethereum || !verified)
        throw Error("Verify a deployment to inspect a request.");
      const id = integer(pendingId, "Request ID");
      const p = await client(window.ethereum).readContract({
        address: m.vault,
        abi: vaultAbi,
        functionName: "getPending",
        args: [id],
      });
      if (epoch !== generation.current) return;
      setExtraPending({ chainId: m.chainId, vault: m.vault, pending: { id, ...p } });
    } catch (e) {
      if (epoch === generation.current) setError(explain(e));
    }
  }
  async function reviewPending(
    id: bigint,
    method: "approvePending" | "cancelPending",
  ) {
    const epoch = generation.current;
    const deployment = m;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    setError("");
    setBusy("Reading the queued request before review…");
    try {
      if (!deployment || ownerDisabled)
        throw Error(
          "Verify this deployment with its owner before reviewing a request.",
        );
      let p: Pending;
      if (demo) {
        const example = pending.find((request) => request.id === id);
        if (!example) throw Error("No demo request exists with that ID.");
        p = example;
      } else {
        if (!account || !window.ethereum)
          throw Error("Connect this deployment's owner before review.");
        await verify(window.ethereum, deployment, account);
        const fresh = await client(window.ethereum).readContract({
          address: deployment.vault,
          abi: vaultAbi,
          functionName: "getPending",
          args: [id],
        });
        p = { id, ...fresh };
      }
      if (epoch !== generation.current) return;
      if (p.executed || p.cancelled)
        throw Error(
          "This request is already executed or cancelled. Refresh the pending list.",
        );
      await prepare(
        operation(
          method,
          [id],
          `${method === "approvePending" ? "Approve" : "Cancel"} request #${id}`,
          {
            Destination: p.to,
            "Native value": `${formatUnits(p.value, 18)} ETH`,
            Token: p.token,
            "Token amount (raw)": String(p.amount),
            "Queued calldata": p.data,
            Effect:
              method === "approvePending"
                ? "One-time execution; the contract rechecks epoch, expiry and recipient policy"
                : "This request can no longer execute",
          },
        ),
        opener,
      );
    } catch (e) {
      if (epoch === generation.current) setError(explain(e));
    } finally {
      if (epoch === generation.current) setBusy("");
    }
  }
  async function checkBridge() {
    setError("");
    setBridgeStatus("");
    try {
      if (!/^0x[\da-f]{64}$/i.test(bridgeHash))
        throw Error("Enter a valid source transaction hash.");
      if (!m || !window.ethereum || !verified)
        throw Error("Verify the source deployment first.");
      setBusy("Checking source receipt…");
      const rpc = client(window.ethereum);
      const receipt = await rpc.getTransactionReceipt({
        hash: bridgeHash as Hex,
      });
      if (receipt.transactionHash.toLowerCase() !== bridgeHash.toLowerCase())
        throw Error("RPC returned a receipt for a different transaction.");
      const tx = await rpc.getTransaction({ hash: bridgeHash as Hex });
      if (
        tx.to?.toLowerCase() !== m.vault.toLowerCase() ||
        !tx.input.startsWith(
          operation(
            "agentBridge",
            [demoToken, 1n, 0, ("0x" + "11".repeat(32)) as Hex, 0n, 2000],
            "",
            {},
          ).data.slice(0, 10),
        )
      )
        throw Error(
          "This transaction is not a bridge call to the configured vault.",
        );
      setBridgeStatus(
        receipt.status === "success"
          ? "Source burn confirmed. Destination settlement is not yet verified. Keep this hash to resume recovery."
          : "Source transaction reverted; no successful burn is recorded.",
      );
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy("");
    }
  }
  const inspected = verified && m && extraPending?.chainId === m.chainId &&
    extraPending.vault.toLowerCase() === m.vault.toLowerCase()
      ? extraPending.pending
      : undefined;
  const pending = demo
    ? [
        {
          id: 1n,
          to: "0x1111111111111111111111111111111111111111" as Address,
          value: 0n,
          token: demoToken,
          amount: 125000000n,
          data: ("0xa9059cbb" +
            "0".repeat(24) +
            "1".repeat(40) +
            "0".repeat(60) +
            "007d") as Hex,
          executed: false,
          cancelled: false,
        },
      ]
    : [
        ...(snapshot?.pending ?? []),
        ...(inspected &&
        !snapshot?.pending.some((p) => p.id === inspected.id)
          ? [inspected]
          : []),
      ];
  return (
    <div className="app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#main"
          onClick={() => setSection("Overview")}
        >
          <span className="brand-icon">
            a<span>↗</span>
          </span>
          <span>
            agentwallet<small>VAULT CONSOLE</small>
          </span>
        </a>
        <div className="workspace">
          <span className="avatar">V</span>
          <div>
            <strong>{demo ? "Studio vault" : "Your vault"}</strong>
            <small>
              {demo
                ? "Demonstration"
                : verified
                  ? short(m!.vault)
                  : "Not connected"}
            </small>
          </div>
          <span className="muted">⌄</span>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {sections.map((s, i) => (
            <button
              key={s}
              className={section === s ? "nav active" : "nav"}
              onClick={() => {
                setSection(s);
                setError("");
                setQuote("");
              }}
              aria-current={section === s ? "page" : undefined}
            >
              <Icon index={i} />
              {s}
              {s === "Approvals" && pending.length > 0 && (
                <span className="count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <span className="status-dot" />
          External wallet custody
          <p>
            Your keys stay in your wallet.
            <br />
            You approve every transaction.
          </p>
          <button
            className="text-button"
            onClick={() => setSection("Security & help")}
          >
            Read the security guide ↗
          </button>
        </div>
      </aside>
      <div className="body">
        <header>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{section}</strong>
          </div>
          <div className="header-actions">
            <span className="chain">
              <i /> {chainName}
            </span>
            <button
              className="theme"
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button
              className="connect"
              aria-label={
                account && !demo
                  ? `Connected wallet ${account}`
                  : "Connect wallet"
              }
              onClick={connect}
              disabled={!!busy}
            >
              {account && !demo ? short(account) : "Connect wallet"}
              <span>↗</span>
            </button>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                {section === "Overview"
                  ? "THE OWNER IS IN CONTROL"
                  : section.toUpperCase()}
              </span>
              <h1>{titles[section][0]}</h1>
              <p>{titles[section][1]}</p>
            </div>
            {section === "Overview" && (
              <button
                className="secondary"
                onClick={() => {
                  if (demo) leaveDemo();
                  else {
                    setDemo(true);
                    setReview(undefined);
                    setError("");
                  }
                }}
              >
                {demo ? "Exit demo" : "Explore demo"} <span>↗</span>
              </button>
            )}
          </div>
          {demo && (
            <div className="demo-banner">
              <span>
                <strong>Demo · example data only</strong> Explore a sample
                vault. Signing is disabled.
              </span>
              <label>
                Demo role{" "}
                <select
                  aria-label="Demo role"
                  value={demoRole}
                  onChange={(e) => setDemoRole(e.target.value as Role)}
                >
                  <option value="owner">Owner</option>
                  <option value="operator">Operator</option>
                </select>
              </label>
            </div>
          )}
          {!demo && (
            <div className={"security-strip " + (verified ? "verified" : "")}>
              <span className="shield">◇</span>
              <div>
                <strong>
                  {verified
                    ? "Deployment checks passed"
                    : account
                      ? "Verify your deployment to continue"
                      : "Start with your external wallet"}
                </strong>
                <p>
                  {verified
                    ? `Runtime hash, security version, chain and ${role} role matched. This is not an independent audit.`
                    : "Connect, import a deployment manifest, then review permissions before any action."}
                </p>
              </div>
              <span className="badge">
                {verified
                  ? snapshot?.paused
                    ? "Paused"
                    : role
                  : "Testnet only"}
              </span>
            </div>
          )}
          {error && (
            <div role="alert" className="error">
              <strong>Action needs attention</strong>
              <p>{error}</p>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}
          {busy && (
            <div role="status" className="busy">
              <span className="spinner" />
              {busy}
            </div>
          )}
          {!demo && <IntentRecovery entries={journal.entries} storageError={journal.error} onReconciled={onReconciled} />}
          {section === "Overview" && (
            <>
              <div className="metric-grid">
                <div className="metric featured">
                  <span>
                    Vault ETH balance <Icon />
                  </span>
                  <strong>
                    {demo
                      ? "0.8421"
                      : snapshot
                        ? display(snapshot.native, 18)
                        : "—"}
                    <small> ETH</small>
                  </strong>
                  <p>
                    {demo
                      ? "Example balance"
                      : snapshot
                        ? `Block ${snapshot.block}`
                        : "Connect a wallet to load balances"}
                  </p>
                  <span className="metric-foot">
                    On-chain funds in the vault <span>↗</span>
                  </span>
                </div>
                <div className="metric">
                  <span>Available native budget</span>
                  <strong>
                    {demo
                      ? "0.15"
                      : snapshot
                        ? display(snapshot.nativeBudget, 18)
                        : "—"}
                    <small> ETH</small>
                  </strong>
                  <p>Resets according to owner policy</p>
                  <span className="metric-foot">Contract-enforced limit</span>
                </div>
                <div className="metric">
                  <span>Pending owner approvals</span>
                  <strong>
                    {demo
                      ? "1"
                      : snapshot
                        ? String(snapshot.pending.length)
                        : "—"}
                  </strong>
                  <p>Requests waiting for your decision</p>
                  <button
                    className="text-button metric-foot"
                    onClick={() => setSection("Approvals")}
                  >
                    Review requests <span>→</span>
                  </button>
                </div>
              </div>
              <div className="overview-grid">
                <section className="panel assets">
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow">YOUR ASSETS</span>
                      <h2>Held in your vault</h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => refresh()}
                      disabled={disabled || !!busy}
                    >
                      Refresh ↻
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Asset</th>
                          <th>Balance</th>
                          <th>Available budget</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <span className="coin eth">Ξ</span>
                            <strong>
                              Ethereum<small>ETH</small>
                            </strong>
                          </td>
                          <td>
                            {demo
                              ? "0.8421"
                              : snapshot
                                ? display(snapshot.native, 18)
                                : "—"}
                          </td>
                          <td>
                            {demo
                              ? "0.15"
                              : snapshot
                                ? display(snapshot.nativeBudget, 18)
                                : "—"}
                          </td>
                        </tr>
                        {assets.map((a, i) => (
                          <tr key={a.address}>
                            <td>
                              <span className="coin">
                                {a.symbol.slice(0, 1)}
                              </span>
                              <strong>
                                {a.symbol}
                                <small>{short(a.address)}</small>
                              </strong>
                            </td>
                            <td>
                              {demo
                                ? i === 0
                                  ? "2,500.00"
                                  : "0.24"
                                : snapshot?.assets[i]
                                  ? display(
                                      snapshot.assets[i].balance,
                                      a.decimals,
                                    )
                                  : "—"}
                            </td>
                            <td>
                              {demo
                                ? i === 0
                                  ? "500.00"
                                  : "0.05"
                                : snapshot?.assets[i]
                                  ? display(
                                      snapshot.assets[i].budget,
                                      a.decimals,
                                    )
                                  : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!snapshot && !demo && (
                    <div className="empty-inline">
                      Balances load from your wallet's RPC after deployment
                      verification.
                    </div>
                  )}
                </section>
                <section className="panel control">
                  <span className="eyebrow">BUILT AROUND YOUR PERMISSION</span>
                  <h2>
                    Agents execute.
                    <br />
                    You set the boundaries.
                  </h2>
                  <p>
                    Limits and approved destinations live in your vault
                    contract. Owner actions stay in your hands.
                  </p>
                  <div className="control-row">
                    <span>Spending rules</span>
                    <span>
                      {demo
                        ? "Example policies"
                        : verified
                          ? "Read from vault"
                          : "Awaiting deployment"}
                    </span>
                  </div>
                  <div className="control-row">
                    <span>Key custody</span>
                    <span>Your external wallet</span>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setSection("Operators & limits")}
                  >
                    Manage permissions →
                  </button>
                </section>
              </div>
            </>
          )}
          {section === "Overview" && !demo && (
            <div className="setup-actions">
              <button
                className="secondary"
                onClick={() => setShowDeploy(!showDeploy)}
              >
                Deploy a testnet vault ↗
              </button>
              <span>New vault? Deploy with an external owner wallet.</span>
            </div>
          )}
          {section === "Overview" && !demo && showDeploy && (
            <Suspense fallback={<p role="status">Loading deployment setup…</p>}>
              <Deploy
                account={account}
                session={generation.current}
                onClose={() => setShowDeploy(false)}
                onManifest={(next) => {
                  setManifest(next);
                  setManifestText(JSON.stringify(next, null, 2));
                  setSnapshot(undefined);
                  void refresh(next, account);
                }}
              />
            </Suspense>
          )}
          {section === "Overview" && !demo && (
            <section className="panel manifest-panel">
              <div>
                <span className="eyebrow">ONE-TIME SETUP</span>
                <h2>Connect to your deployed vault</h2>
                <p>
                  Paste the deployment manifest from your verified deployment
                  process. We compare its code hash and security version with
                  the chain.
                </p>
                <details>
                  <summary>What goes in a manifest?</summary>
                  <pre>
                    {JSON.stringify(
                      {
                        chainId: 84532,
                        vault: "YOUR_DEPLOYED_VAULT",
                        runtimeCodeHash: "0x_EXPECTED_32_BYTE_HASH",
                        securityVersion: 1,
                        assets: [
                          {
                            address: "TOKEN_ADDRESS",
                            symbol: "USDC",
                            decimals: 6,
                            aToken: "OPTIONAL_AAVE_ATOKEN_ADDRESS",
                          },
                        ],
                      },
                      null,
                      2,
                    )}
                  </pre>
                  <p>
                    Only public addresses and hashes. Never enter seed phrases
                    or private keys. A supplied hash is only as trustworthy as
                    its source; compare deployment evidence independently.
                  </p>
                </details>
              </div>
              <form onSubmit={verifyManifest}>
                <label className="field">
                  <span>Deployment manifest JSON</span>
                  <textarea
                    aria-label="Deployment manifest JSON"
                    value={manifestText}
                    onChange={(e) => setManifestText(e.target.value)}
                    rows={5}
                    placeholder="Paste your deployment manifest…"
                  />
                </label>
                <button className="primary" disabled={!!busy}>
                  Verify deployment →
                </button>
              </form>
            </section>
          )}
          {(section === "Payments" ||
            section === "Trading" ||
            section === "Staking" ||
            section === "Bridge & recovery") && (
            <div className="form-layout">
              <section className="panel transaction-panel">
                <div className="panel-heading">
                  <h2>
                    {section === "Payments"
                      ? "New payment"
                      : section === "Trading"
                        ? "Exact-input swap"
                        : section === "Staking"
                          ? "Aave position"
                          : "Bridge assets"}
                  </h2>
                  <span className="badge">{demo ? "Preview" : role}</span>
                </div>
                <form
                  onSubmit={formReview}
                  key={section}
                  ref={section === "Trading" ? tradeForm : undefined}
                  onChange={section === "Trading" ? () => setQuote("") : undefined}
                >
                  {section === "Payments" && (
                    <>
                      {assetSelect()}
                      <Field
                        label="Recipient address"
                        name="recipient"
                        hint="Must be allowed by the owner’s recipient policy."
                      />
                      <Field
                        label="Amount"
                        name="amount"
                        hint="No rounding. The external wallet pays network fees."
                      />
                    </>
                  )}
                  {section === "Trading" && (
                    <>
                      <div className="form-two">
                        {assetSelect("From token", "input", false)}
                        {assetSelect("To token", "output", false)}
                      </div>
                      <Field label="Amount" name="amount" />
                      <Field
                        label="Minimum received"
                        name="minimum"
                        hint="Use a current trusted quote. This minimum must also satisfy the owner’s raw-token pair floor."
                      />
                      <div className="form-two">
                        <label className="field">
                          <span>Pool fee</span>
                          <select name="fee" aria-label="Pool fee">
                            <option value="500">0.05%</option>
                            <option value="3000">0.30%</option>
                            <option value="10000">1%</option>
                            <option value="100">0.01%</option>
                          </select>
                        </label>
                        <Field
                          label="Expires in (minutes)"
                          name="minutes"
                          defaultValue="10"
                        />
                      </div>
                      <button
                        type="button"
                        className="secondary"
                        onClick={getQuote}
                        disabled={demo || disabled || !!busy}
                      >
                        Get on-chain quote ↻
                      </button>
                      <p role="status" className="form-note">
                        {quote || "No live quote loaded"}
                      </p>
                      <p className="form-note">
                        The vault’s fixed router executes the swap. Output
                        returns to your vault. The quote simulates this exact
                        guarded swap; review again before signing.
                      </p>
                    </>
                  )}
                  {section === "Staking" && (
                    <>
                      <div className="segmented">
                        <button
                          type="button"
                          className={stake === "supply" ? "selected" : ""}
                          onClick={() => setStake("supply")}
                        >
                          Supply
                        </button>
                        <button
                          type="button"
                          className={stake === "withdraw" ? "selected" : ""}
                          onClick={() => setStake("withdraw")}
                        >
                          Withdraw to vault
                        </button>
                      </div>
                      {assetSelect("Asset", "asset", false)}
                      <Field label="Amount" name="amount" />
                      <p className="form-note">
                        Both aTokens and withdrawn funds stay in your vault.
                        Supply risk and pool liquidity affect availability.
                      </p>
                    </>
                  )}
                  {section === "Bridge & recovery" && (
                    <>
                      {assetSelect("Burn token", "asset", false)}
                      <Field label="Amount" name="amount" />
                      <Field
                        label="Destination domain"
                        name="domain"
                        hint="CCTP domain number, not the EVM chain ID."
                      />
                      <Field
                        label="Destination recipient (bytes32)"
                        name="bridgeRecipient"
                        hint="Must exactly match the owner’s allowed destination."
                      />
                      <Field
                        label="Maximum fee"
                        name="maxFee"
                        hint="In burn-token units, less than the amount."
                      />
                      <label className="field">
                        <span>Finality</span>
                        <select name="finality" aria-label="Finality">
                          <option value="2000">Standard · 2000</option>
                          <option value="1000">Fast · 1000</option>
                        </select>
                      </label>
                    </>
                  )}
                  <button
                    className="primary wide"
                    disabled={
                      writeBlocked ||
                      !!busy ||
                      (section !== "Payments" && assets.length === 0)
                    }
                  >
                    {section === "Payments"
                      ? "Review payment"
                      : section === "Trading"
                        ? "Review trade"
                        : section === "Staking"
                          ? "Review position"
                          : "Review bridge"}{" "}
                    <span>→</span>
                  </button>
                  <p className="signing-note">
                    Review first. Sign in your wallet only when you're ready.
                  </p>
                </form>
              </section>
              <aside className="context-panel">
                <span className="eyebrow">BEFORE YOU SIGN</span>
                <h2>
                  {section === "Payments"
                    ? "A payment you can inspect."
                    : section === "Trading"
                      ? "A floor, an expiry, a vault."
                      : section === "Staking"
                        ? "Your position stays visible."
                        : "A burn is only the first step."}
                </h2>
                <p>
                  {section === "Bridge & recovery"
                    ? "A successful source receipt confirms the burn. An attestation and destination mint are still required. Receiving needs a matching Circle attestation and an owner-verified destination vault manifest. Use the recovery flow below."
                    : section === "Trading"
                      ? "Simulation checks the current pair policy and protocol call. Prices can move before mining; the minimum received and deadline remain enforced."
                      : "Spending limits are checked by the contract. Requests beyond budget may queue for a separate owner approval instead of sending funds immediately."}
                </p>
                <div className="context-item">
                  <span>Source</span>
                  <strong>
                    {m ? short(m.vault) : "Verified vault required"}
                  </strong>
                </div>
                <div className="context-item">
                  <span>Network</span>
                  <strong>{chainName}</strong>
                </div>
                <div className="context-item">
                  <span>Signer role</span>
                  <strong>{role}</strong>
                </div>
                {section === "Staking" && (
                  <div className="positions">
                    {demo ? (
                      <p>
                        Example: 1,000.00 aUSDC
                        <br />
                        Principal: 1,000.00 USDC
                      </p>
                    ) : (
                      snapshot?.assets.map((a) => (
                        <div key={a.address}>
                          <strong>{a.symbol}</strong>
                          <p>
                            Principal: {display(a.principal, a.decimals)}
                            <br />
                            aToken balance:{" "}
                            {a.aBalance !== undefined
                              ? display(a.aBalance, a.decimals)
                              : "Add aToken to manifest"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </aside>
            </div>
          )}
          {section === "Bridge & recovery" &&
            bridgeSources.length > 0 &&
            !demo && (
              <section className="panel recovery">
                <div className="panel-heading">
                  <h2>Saved source transfers</h2>
                  <span className="badge">Public recovery records</span>
                </div>
                {bridgeSources.map((record) => (
                  <div className="bridge-record" key={record.hash}>
                    <div>
                      <strong>{record.amount || "Source transfer"}</strong>
                      <small>
                        {chains[record.chainId as keyof typeof chains].name} →
                        domain {record.destinationDomain || "unknown"}
                      </small>
                      <small>Vault {short(record.vault)}</small>
                    </div>
                    <span className="badge">{record.status}</span>
                    <button
                      className="text-button"
                      onClick={() => {
                        setBridgeHash(record.hash);
                        setBridgeStatus("");
                      }}
                    >
                      Inspect source
                    </button>
                    <a
                      className="text-button"
                      href={`${chains[record.chainId as keyof typeof chains].explorer}/tx/${record.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Explorer ↗
                    </a>
                  </div>
                ))}
                <p className="form-note">
                  These public hashes and transfer details are kept in this
                  browser. They contain no keys or signatures. Destination
                  settlement remains separately unverified.
                </p>
              </section>
            )}
          {section === "Bridge & recovery" && (
            <section className="panel recovery">
              <span className="eyebrow">SOURCE TRANSACTION RECOVERY</span>
              <h2>Resume from a transaction hash</h2>
              <p>
                Use the original source hash to check whether your burn
                succeeded. A confirmed burn is never repeated to recover a
                transfer.
              </p>
              <label className="field">
                <span>Source transaction hash</span>
                <input
                  aria-label="Source transaction hash"
                  value={bridgeHash}
                  onChange={(e) => setBridgeHash(e.target.value)}
                />
              </label>
              <button
                className="secondary"
                onClick={checkBridge}
                disabled={disabled || !!busy}
              >
                Check source receipt
              </button>
              {bridgeStatus && <p role="status">{bridgeStatus}</p>}
              <p className="form-note">
                Keep the source hash and use the receiving flow below. A
                successful source receipt is only the burn step, not a completed
                transfer.
              </p>
            </section>
          )}
          {section === "Bridge & recovery" && !demo && (
            <Suspense
              fallback={<p role="status">Loading destination recovery…</p>}
            >
              <Recovery
                sourceManifest={manifest}
                sourceHash={bridgeHash}
                session={generation.current}
                onRecordsChange={() => setBridgeSources(readBridgeSources())}
              />
            </Suspense>
          )}
          {section === "Operators & limits" && (
            <div className="form-layout">
              <section className="panel transaction-panel">
                <div className="panel-heading">
                  <h2>Owner controls</h2>
                  <span className="badge">Owner only</span>
                </div>
                <label className="field">
                  <span>Policy to manage</span>
                  <select
                    aria-label="Policy to manage"
                    value={admin}
                    onChange={(e) => {
                      setAdmin(e.target.value);
                      setError("");
                    }}
                  >
                    <option value="budget">Spending budgets</option>
                    <option value="operator">Operators</option>
                    <option value="recipient">Payment recipients</option>
                    <option value="pair">Swap pair floor</option>
                    <option value="destination">Bridge destination</option>
                    <option value="pause">Pause / resume vault</option>
                  </select>
                </label>
                <form onSubmit={formReview} key={admin}>
                  {admin === "budget" && (
                    <>
                      {assetSelect()}
                      <Field label="Per-transaction limit" name="perTx" />
                      <Field label="Period limit" name="periodLimit" />
                      <Field
                        label="Period duration (seconds)"
                        name="periodLength"
                        defaultValue="86400"
                      />
                    </>
                  )}
                  {admin === "operator" && (
                    <Field
                      label="Operator address"
                      name="operator"
                      hint="A gas-paying agent address; never provide its private key."
                    />
                  )}
                  {admin === "recipient" && (
                    <Field label="Recipient address" name="recipient" />
                  )}
                  {(admin === "operator" || admin === "recipient") && (
                    <label className="field">
                      <span>Permission</span>
                      <select name="allowed" aria-label="Permission">
                        <option value="yes">Allow</option>
                        <option value="no">Revoke</option>
                      </select>
                    </label>
                  )}
                  {admin === "pair" && (
                    <>
                      <div className="form-two">
                        {assetSelect("From token", "input", false)}
                        {assetSelect("To token", "output", false)}
                      </div>
                      <Field
                        label="Minimum raw-token rate (X18)"
                        name="rate"
                        hint="1 means minimumOut ≥ amountIn. For differing decimals, compute the raw-unit ratio."
                      />
                      <Field
                        label="Floor valid for (minutes)"
                        name="minutes"
                        defaultValue="60"
                      />
                    </>
                  )}
                  {admin === "destination" && (
                    <>
                      <Field label="Destination domain" name="domain" />
                      <Field
                        label="Destination recipient (bytes32)"
                        name="bridgeRecipient"
                      />
                    </>
                  )}
                  {admin === "pause" && (
                    <label className="field">
                      <span>Vault status</span>
                      <select name="paused" aria-label="Vault status">
                        <option value="yes">Pause all asset operations</option>
                        <option value="no">Resume bounded operations</option>
                      </select>
                    </label>
                  )}
                  <button
                    className="primary wide"
                    disabled={ownerDisabled || !!busy}
                  >
                    Review policy →
                  </button>
                  {role !== "owner" && (
                    <p className="form-note">
                      Connect the vault owner to update permissions.
                    </p>
                  )}
                </form>
              </section>
              <aside className="context-panel">
                <span className="eyebrow">ON-CHAIN BOUNDARIES</span>
                <h2>A budget is a permission.</h2>
                <p>
                  Per-transaction and period limits bound asset spending.
                  Recipients, pairs and bridge destinations add specific
                  restrictions. Policy changes invalidate previous queued
                  requests.
                </p>
                {(demo
                  ? [
                      {
                        symbol: "USDC",
                        perTx: 100000000n,
                        periodLimit: 500000000n,
                        periodLength: 86400n,
                        budget: 375000000n,
                        decimals: 6,
                      },
                    ]
                  : (snapshot?.assets ?? [])
                ).map((a) => (
                  <div className="policy-summary" key={a.symbol}>
                    <strong>{a.symbol}</strong>
                    <div>
                      Per transaction{" "}
                      <span>{display(a.perTx, a.decimals)}</span>
                    </div>
                    <div>
                      Period cap{" "}
                      <span>{display(a.periodLimit, a.decimals)}</span>
                    </div>
                    <div>
                      Available <span>{display(a.budget, a.decimals)}</span>
                    </div>
                    <small>Period: {String(a.periodLength)} seconds</small>
                  </div>
                ))}
              </aside>
            </div>
          )}
          {section === "Approvals" && (
            <section className="panel approval-panel">
              <div className="panel-heading">
                <h2>Pending requests</h2>
                <span className="badge">
                  {demo ? "Example request" : `${pending.length} loaded`}
                </span>
              </div>
              {pending.length === 0 && (
                <div className="empty">
                  <span>✓</span>
                  <h3>
                    {verified
                      ? "No open requests in the recent window"
                      : "No requests loaded yet"}
                  </h3>
                  <p>
                    {verified
                      ? "The latest 50 queue IDs were checked. Inspect an earlier ID below."
                      : "Verify your vault to load owner approval requests."}
                  </p>
                </div>
              )}
              {pending.map((p) => (
                <div className="pending" key={String(p.id)}>
                  <div className="panel-heading">
                    <h3>Request #{String(p.id)}</h3>
                    <span className="badge">
                      {p.executed
                        ? "Executed"
                        : p.cancelled
                          ? "Cancelled"
                          : "Awaiting owner"}
                    </span>
                  </div>
                  <dl>
                    <dt>Destination</dt>
                    <dd>{p.to}</dd>
                    <dt>Native value</dt>
                    <dd>{formatUnits(p.value, 18)} ETH</dd>
                    <dt>Token</dt>
                    <dd>{p.token}</dd>
                    <dt>Token amount (raw)</dt>
                    <dd>{String(p.amount)}</dd>
                    {p.createdAt && (
                      <>
                        <dt>Created</dt>
                        <dd>
                          {new Date(
                            Number(p.createdAt) * 1000,
                          ).toLocaleString()}
                        </dd>
                      </>
                    )}
                    {p.expiresAt && (
                      <>
                        <dt>Expires</dt>
                        <dd>
                          {new Date(
                            Number(p.expiresAt) * 1000,
                          ).toLocaleString()}
                        </dd>
                      </>
                    )}
                    {p.policyEpoch !== undefined && (
                      <>
                        <dt>Policy version</dt>
                        <dd>
                          {String(p.policyEpoch)}
                          {snapshot && p.policyEpoch !== snapshot.policyEpoch
                            ? " · stale after owner policy change"
                            : ""}
                        </dd>
                      </>
                    )}
                  </dl>
                  <details open>
                    <summary>Complete queued calldata</summary>
                    <pre>{p.data}</pre>
                  </details>
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={
                        ownerDisabled || !!busy || p.executed || p.cancelled
                      }
                      onClick={() => reviewPending(p.id, "approvePending")}
                    >
                      Review approval →
                    </button>
                    <button
                      className="secondary"
                      disabled={
                        ownerDisabled || !!busy || p.executed || p.cancelled
                      }
                      onClick={() => reviewPending(p.id, "cancelPending")}
                    >
                      Review cancellation
                    </button>
                  </div>
                </div>
              ))}
              <div className="inspect">
                <label className="field">
                  <span>Inspect request ID</span>
                  <input
                    aria-label="Inspect request ID"
                    value={pendingId}
                    onChange={(e) => setPendingId(e.target.value)}
                  />
                </label>
                <button
                  className="secondary"
                  onClick={inspectPending}
                  disabled={disabled || !!busy}
                >
                  Load request
                </button>
              </div>
            </section>
          )}
          {section === "Activity" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Session activity</h2>
                <span className="badge">Receipt-based status</span>
              </div>
              {activity.length === 0 ? (
                <div className="empty">
                  <span>↗</span>
                  <h3>No transactions this session</h3>
                  <p>
                    Transactions appear here after your wallet submits them.
                    Public transaction identities and unresolved requests remain in Wallet request recovery after reload.
                  </p>
                </div>
              ) : (
                activity.map((a) => (
                  <div className="activity" key={a.hash}>
                    <div>
                      <strong>{a.title}</strong>
                      <small>{a.time}</small>
                      {a.error && <p>{a.error}</p>}
                    </div>
                    <span
                      className={
                        a.status === "Confirmed" ? "badge good" : "badge"
                      }
                    >
                      {a.status}
                    </span>
                    {a.hash && (
                      <button
                        className="secondary"
                        onClick={() => inspectReceipt(a)}
                        disabled={!!busy}
                      >
                        {a.status === "Submitted" || a.status === "Receipt unresolved" ? "Check receipt ↻" : "Recheck receipt ↻"}
                      </button>
                    )}
                    {a.hash && a.deployment && (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`${chains[a.deployment.chainId as keyof typeof chains].explorer}/tx/${a.hash}`}
                      >
                        View transaction ↗
                      </a>
                    )}
                  </div>
                ))
              )}
            </section>
          )}
          {section === "Security & help" && (
            <div className="help-grid">
              {[
                [
                  "Your keys stay with you",
                  "This browser connects to an injected Ethereum wallet. It never requests a seed phrase or private key, stores signatures, or signs automatically.",
                ],
                [
                  "Verify the deployment source",
                  "Code-hash matching confirms the code matches your supplied manifest. It does not prove the manifest is trustworthy or the contract is independently audited. Compare deployment and audit evidence independently.",
                ],
                [
                  "Understand the roles",
                  "The owner configures policies, approves requests, and can use bounded asset operations. Operators can only use allowed vault operations. An observer can inspect but cannot execute.",
                ],
                [
                  "Read the final wallet request",
                  "Review the chain, vault address, exact calldata, amount, recipient and network fee. The external wallet shows the final signing request. A simulation is a useful check, not a guarantee of future execution.",
                ],
                [
                  "Know the transaction state",
                  "Submitted means broadcast. Confirmed means a successful receipt with two confirmations. Reverted means no successful execution. Receipt unresolved requires checking the explorer before retrying.",
                ],
                [
                  "Keep protocol risks visible",
                  "Aave positions carry protocol and liquidity risks. Swaps can fail on price movement. CCTP requires destination settlement after burning; a source receipt alone is not a completed bridge.",
                ],
                [
                  "Testnets are the current boundary",
                  "Base Sepolia is the default. Ethereum, Arbitrum and OP Sepolia can be selected with a manifest. Mainnet remains gated pending verified deployment, independent audit and release authorization.",
                ],
                [
                  "Troubleshooting",
                  "For wrong-network errors, switch your external wallet to the manifest chain. For code-hash mismatch, correct the manifest from trusted deployment evidence. For rejected signatures, review and try again. Account or network changes require reconnecting.",
                ],
              ].map(([title, text], i) => (
                <section className="panel help-card" key={title}>
                  <Icon index={i} />
                  <h2>{title}</h2>
                  <p>{text}</p>
                </section>
              ))}
            </div>
          )}
          <footer>
            <span>Non-custodial by design. Owner-directed by default.</span>
            <span>AgentVault v1 · Testnet release candidate</span>
          </footer>
        </main>
      </div>
      {review && (
        <div className="modal-backdrop">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="modal"
            ref={modalRef}
            tabIndex={-1}
          >
            <div className="panel-heading">
              <span className="eyebrow">REVIEW BEFORE SIGNING</span>
              <button
                className="icon-button"
                aria-label="Close review"
                onClick={() => setReview(undefined)}
                disabled={!!busy}
              >
                ×
              </button>
            </div>
            <h2 id="review-title">{review.title}</h2>
            <p>
              {demo
                ? "Demo preview — signing is disabled"
                : "This request executes through your guarded vault. Your external wallet signs the final transaction."}
            </p>
            <dl>
              {Object.entries(review.details).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div>
                <dt>Contract</dt>
                <dd>{review.binding.vault}</dd>
              </div>
              <div>
                <dt>Signer</dt>
                <dd>{demo ? `Demo ${role}` : `${review.binding.signer} (${role})`}</dd>
              </div>
              <div>
                <dt>Network fee</dt>
                <dd>
                  {demo
                    ? "Demo only; no transaction"
                    : gas || "Wallet will show final fee"}
                </dd>
              </div>
            </dl>
            <details>
              <summary>Complete vault call data</summary>
              <pre>{review.data}</pre>
            </details>
            {busy && <p role="status">{busy}</p>}
            {reviewedHash && (
              <p className="form-note">
                Transaction submitted: {reviewedHash}. Signing this review
                again is disabled. Inspect the receipt in Activity before
                another write.
              </p>
            )}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <div className="button-row">
              <button
                className="secondary"
                disabled={!!busy}
                onClick={() => setReview(undefined)}
              >
                Go back
              </button>
              <button
                className="primary"
                disabled={demo || !!busy || !!reviewedHash || reviewSpent || journal.blocked}
                onClick={confirm}
              >
                Confirm in wallet ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
