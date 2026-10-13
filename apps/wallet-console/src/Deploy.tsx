import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  encodeDeployData,
  keccak256,
  formatUnits,
  type Address,
  type Hex,
} from "viem";
import { AgentVaultBytecode } from "../../../src/contracts/AgentVaultBytecode";
import { vaultAbi } from "./abi";
import {
  address,
  parseManifest,
  validateReceipt,
  type Manifest,
} from "./security";
import { client, explain, type Provider } from "./wallet";
import { useReviewDialog } from "./useReviewDialog";
import { useIntents } from "./useIntents";
import { assertNoUnresolvedIntent, broadcastIntent, reconcileIntent } from "./intents";
const protocols = {
  router: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
  pool: "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27",
  messenger: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
} as const;
interface Draft {
  owner: Address;
  session: number;
  provider: Provider;
  data: Hex;
  operator: Address;
  fee: string;
  hashes: Record<string, Hex>;
}
async function deploymentChecks(provider: Provider, owner: Address) {
  if ((await client(provider).getChainId()) !== 84532)
    throw Error(
      "Switch your external wallet to Base Sepolia before deploying.",
    );
  const accounts = await provider.request({ method: "eth_accounts" });
  if (accounts[0]?.toLowerCase() !== owner.toLowerCase())
    throw Error(
      "The connected owner account changed. Reconnect and review again.",
    );
}
export default function Deploy({
  account,
  session,
  onManifest,
  onClose,
}: {
  account?: Address;
  session: number;
  onManifest: (m: Manifest) => void;
  onClose: () => void;
}) {
  const journal = useIntents();
  const [operator, setOperator] = useState(""),
    [draft, setDraft] = useState<Draft>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [hash, setHash] = useState<Hex>(),
    [intentId, setIntentId] = useState<string>(),
    [result, setResult] = useState<Manifest>();
  const modal = useRef<HTMLDivElement>(null);
  const current = useRef({ account, session });
  current.current = { account, session };
  const intent = journal.entries.find((record) => record.id === intentId);
  const spent = !!intentId && intent?.status !== "rejected";
  const submitted = hash ?? intent?.hash;
  function isCurrent(owner: Address, epoch: number, provider: Provider) {
    return current.current.session === epoch &&
      current.current.account?.toLowerCase() === owner.toLowerCase() &&
      window.ethereum === provider;
  }
  useEffect(() => {
    setDraft(undefined);
    setBusy("");
  }, [account, session]);
  const rememberReviewOpener = useReviewDialog(modal, !!draft, !!busy, () => setDraft(undefined));
  async function review(e: FormEvent) {
    e.preventDefault();
    rememberReviewOpener();
    setError("");
    setBusy("Checking chain and protocol deployments…");
    const owner = account;
    const epoch = session;
    const provider = window.ethereum;
    try {
      assertNoUnresolvedIntent();
      if (submitted || spent)
        throw Error(
          "This deployment was already submitted. Inspect its original transaction before creating another vault.",
        );
      if (!owner || !provider)
        throw Error("Connect the owner’s external wallet first.");
      const op = address(operator, "operator");
      if (op.toLowerCase() === owner.toLowerCase())
        throw Error("The operator must be different from the owner.");
      await deploymentChecks(provider, owner);
      const rpc = client(provider);
      const hashes: Record<string, Hex> = {};
      for (const [name, a] of Object.entries(protocols)) {
        const code = await rpc.getCode({ address: a });
        if (!code || code === "0x")
          throw Error(
            `No ${name} deployment found at its official Base Sepolia address.`,
          );
        hashes[name] = keccak256(code);
      }
      const data = encodeDeployData({
        abi: vaultAbi,
        bytecode: AgentVaultBytecode,
        args: [
          owner,
          op,
          protocols.router,
          protocols.pool,
          protocols.messenger,
          6,
        ],
      });
      const gas = await rpc.estimateGas({ account: owner, data });
      const price = await rpc.getGasPrice();
      if (!isCurrent(owner, epoch, provider)) return;
      setDraft({
        owner,
        session: epoch,
        provider,
        data,
        operator: op,
        fee: formatUnits(gas * price, 18),
        hashes,
      });
    } catch (e) {
      if (current.current.session === epoch) setError(explain(e));
    } finally {
      if (current.current.session === epoch) setBusy("");
    }
  }
  async function deploy() {
    if (!draft || !account || !window.ethereum || submitted || spent || journal.blocked) return;
    setBusy("Confirm contract creation in your wallet…");
    setError("");
    try {
      const checked = draft;
      const assertCurrent = () => {
        if (!isCurrent(checked.owner, checked.session, checked.provider))
          throw Error("Wallet changed since deployment review. Reconnect and review again.");
      };
      assertCurrent();
      await deploymentChecks(checked.provider, checked.owner);
      const rpc = client(checked.provider);
      for (const [name, a] of Object.entries(protocols)) {
        const code = await rpc.getCode({ address: a });
        if (!code || keccak256(code) !== draft.hashes[name])
          throw Error(
            "Protocol code changed since review. Start a new deployment review.",
          );
      }
      const gas = await rpc.estimateGas({ account: checked.owner, data: checked.data });
      assertCurrent();
      // Protocol checks and gas estimation can outlast a wallet change. Check
      // the reviewed owner and chain again immediately before external signing.
      await deploymentChecks(checked.provider, checked.owner);
      assertCurrent();
      const { hash: txHash, intentId } = await broadcastIntent(checked.provider, {
        kind: "deployment", chainId: 84532, from: checked.owner,
        data: checked.data, gas, label: "Deploy a new testnet vault",
        meta: { owner: checked.owner, operator: checked.operator }, assertCurrent,
        onClaimed: (intent) => setIntentId(intent.id),
      }, (submitted) => {
        setHash(submitted);
        setBusy("Deployment submitted · waiting for 2 confirmations…");
      });
      const { receipt } = await reconcileIntent(checked.provider, intentId, txHash);
      validateReceipt(receipt, txHash);
      if (!receipt.contractAddress)
        throw Error(
          "Receipt contains no deployed contract address. Inspect the explorer.",
        );
      const vault = receipt.contractAddress;
      const code = await rpc.getCode({ address: vault });
      if (!code || code === "0x")
        throw Error("Deployed vault has no runtime code.");
      const base = { address: vault, abi: vaultAbi } as const;
      const [owner, version, active, router, pool, messenger, domain] =
        await Promise.all([
          rpc.readContract({ ...base, functionName: "owner" }),
          rpc.readContract({ ...base, functionName: "securityVersion" }),
          rpc.readContract({
            ...base,
            functionName: "isOperatorActive",
            args: [draft.operator],
          }),
          rpc.readContract({ ...base, functionName: "router" }),
          rpc.readContract({ ...base, functionName: "aavePool" }),
          rpc.readContract({ ...base, functionName: "tokenMessenger" }),
          rpc.readContract({ ...base, functionName: "sourceDomain" }),
        ]);
      if (
        owner.toLowerCase() !== checked.owner.toLowerCase() ||
        version !== 1n ||
        !active ||
        router.toLowerCase() !== protocols.router.toLowerCase() ||
        pool.toLowerCase() !== protocols.pool.toLowerCase() ||
        messenger.toLowerCase() !== protocols.messenger.toLowerCase() ||
        domain !== 6
      )
        throw Error(
          "Deployed owner, operator, security version or protocol configuration does not match the reviewed deployment.",
        );
      const manifest = parseManifest({
        chainId: 84532,
        vault,
        runtimeCodeHash: keccak256(code),
        securityVersion: 1,
        assets: [
          {
            address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            symbol: "C-USDC",
            decimals: 6,
          },
          {
            address: "0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f",
            symbol: "A-USDC",
            decimals: 6,
            aToken: "0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC",
          },
          {
            address: "0x4200000000000000000000000000000000000006",
            symbol: "WETH",
            decimals: 18,
          },
        ],
        deploymentEvidence: txHash,
      });
      if (!isCurrent(checked.owner, checked.session, checked.provider)) return;
      setResult(manifest);
      setDraft(undefined);
      onManifest(manifest);
    } catch (e) {
      if (current.current.session === draft.session) setError(explain(e));
    } finally {
      if (current.current.session === draft.session) setBusy("");
    }
  }
  function download() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent-vault-base-sepolia-manifest.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="panel deploy-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">BASE SEPOLIA · TESTNET DEPLOYMENT</span>
          <h2>Create an owner-controlled vault</h2>
        </div>
        <button className="text-button" onClick={onClose} disabled={!!busy}>
          Close setup ×
        </button>
      </div>
      <p className="form-note">
        Your connected wallet becomes the immutable owner. Choose a separate
        agent operator address. The vault begins with no spending policies or
        allowed recipients: configure those before funding.
      </p>
      <span className="badge">Base Sepolia · testnet deployment</span>
      <div className="deploy-grid">
        <form onSubmit={review}>
          <label className="field">
            <span>Owner wallet</span>
            <input
              aria-label="Owner wallet"
              readOnly
              value={account ?? "Connect your external owner wallet"}
            />
          </label>
          <label className="field">
            <span>Initial operator address</span>
            <input
              aria-label="Initial operator address"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            <small>
              Use the operator’s public address. Never paste a secret.
            </small>
          </label>
          <button className="primary" disabled={!account || !!busy || !!submitted || spent || journal.blocked}>
            Review deployment →
          </button>
        </form>
        <div className="protocol-list">
          <p>
            Official Base Sepolia protocol addresses, checked for deployed code
            before signing:
          </p>
          {Object.entries(protocols).map(([name, a]) => (
            <div key={name}>
              <strong>
                {name === "router"
                  ? "Uniswap SwapRouter02"
                  : name === "pool"
                    ? "Aave V3 pool"
                    : "Circle CCTP V2 messenger"}
              </strong>
              <code>{a}</code>
            </div>
          ))}
          <div className="source-links">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://developers.uniswap.org/docs/protocols/v3/deployments/v3-base-deployments"
            >
              Uniswap addresses ↗
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/aave-dao/aave-address-book/blob/main/src/AaveV3BaseSepolia.sol"
            >
              Aave address book ↗
            </a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://developers.circle.com/cctp/references/contract-addresses"
            >
              Circle addresses ↗
            </a>
          </div>
          <p>
            Testnet Aave USDC (A-USDC) differs from Circle USDC (C-USDC). CCTP
            burns only Circle’s supported asset. This is a release candidate,
            not an independently audited mainnet deployment.
          </p>
        </div>
      </div>
      {busy && <p role="status">{busy}</p>}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {submitted && (
        <a
          className="text-button"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://sepolia.basescan.org/tx/${submitted}`}
        >
          Deployment transaction {submitted} ↗
        </a>
      )}
      {result && (
        <div className="deployment-result">
          <h3>Vault deployed; configuration checks passed</h3>
          <p>{result.vault}</p>
          <p>
            Download the public manifest. Configure budgets and permitted
            recipients, then fund the vault through your external wallet.
          </p>
          <button className="secondary" onClick={download}>
            Download public manifest ↓
          </button>
        </div>
      )}
      {draft && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deployment-review"
            tabIndex={-1}
            ref={modal}
          >
            <span className="eyebrow">CONTRACT CREATION · REVIEW</span>
            <h2 id="deployment-review">Deploy a new testnet vault</h2>
            <p>
              The owner and protocol addresses are immutable. Your external
              wallet signs the deployment.
            </p>
            <dl>
              <div>
                <dt>Network</dt>
                <dd>Base Sepolia · 84532</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{draft.owner}</dd>
              </div>
              <div>
                <dt>Operator</dt>
                <dd>{draft.operator}</dd>
              </div>
              {Object.entries(protocols).map(([name, a]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>
                    {a}
                    <small className="block">
                      Observed code hash: {draft.hashes[name]}
                    </small>
                  </dd>
                </div>
              ))}
              <div>
                <dt>CCTP source domain</dt>
                <dd>6</dd>
              </div>
              <div>
                <dt>Estimated network fee</dt>
                <dd>{draft.fee} ETH; wallet shows final fee</dd>
              </div>
              <div>
                <dt>Initial permissions</dt>
                <dd>
                  Operator enabled; spending blocked until the owner configures
                  policy.
                </dd>
              </div>
            </dl>
            <details>
              <summary>Complete contract creation data</summary>
              <pre>{draft.data}</pre>
            </details>
            {submitted && (
              <p className="form-note">
                Deployment submitted: {submitted}. Do not sign it again. Inspect the
                original transaction in the explorer if its receipt is
                unresolved.
              </p>
            )}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            {busy && <p role="status">{busy}</p>}
            <div className="button-row">
              <button
                className="secondary"
                disabled={!!busy}
                onClick={() => setDraft(undefined)}
              >
                Go back
              </button>
              <button
                className="primary"
                disabled={!!busy || !!submitted || spent || journal.blocked}
                onClick={deploy}
              >
                Confirm deployment in wallet ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
