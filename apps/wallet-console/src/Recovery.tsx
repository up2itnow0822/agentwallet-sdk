import { useEffect, useRef, useState } from "react";
import { formatUnits, type Hex } from "viem";
import {
  sourceRecord,
  attest,
  parseRecoveryManifest,
  prepareMint,
  destinationChecks,
  type RecoveryDraft,
} from "./recovery";
import { type Manifest } from "./security";
import { submit, explain, type Provider } from "./wallet";
import { messageNonce } from "../../../src/bridge/message";
import { USDC_CONTRACT, type BridgeRecord } from "../../../src/bridge/types";
import {
  readBridgeSources,
  saveBridgeSource,
  updateBridgeSource,
  saveMintSource,
} from "./bridgeRecords";
import { useReviewDialog } from "./useReviewDialog";
import { useIntents } from "./useIntents";
import { assertNoUnresolvedIntent, readIntents, reconcileIntent } from "./intents";
interface ReviewedMint extends RecoveryDraft {
  session: number;
  provider: Provider;
  sourceIdentity: string;
  destinationIdentity: string;
}
export default function Recovery({
  sourceManifest,
  sourceHash,
  session,
  onRecordsChange,
}: {
  sourceManifest?: Manifest;
  sourceHash: string;
  session: number;
  onRecordsChange: () => void;
}) {
  const journal = useIntents();
  const [destinationText, setDestinationText] = useState(""),
    [record, setRecord] = useState<BridgeRecord>(),
    [draft, setDraft] = useState<ReviewedMint>(),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [mintHash, setMintHash] = useState<Hex>(),
    [mintIntentId, setMintIntentId] = useState<string>(),
    [mintLocked, setMintLocked] = useState(false);
  const modal = useRef<HTMLDivElement>(null);
  const ownIntent = journal.entries.find((intent) => intent.id === mintIntentId);
  const spent = !!mintIntentId && ownIntent?.status !== "rejected";
  const current = useRef({ session, sourceHash, destinationText });
  current.current = { session, sourceHash, destinationText };
  useEffect(() => {
    setDraft(undefined);
    setBusy("");
  }, [session]);
  useEffect(() => {
    setRecord(undefined);
    setDraft(undefined);
    setStatus("");
    setError("");
    setMintHash(undefined);
    setMintIntentId(undefined);
    setMintLocked(false);
  }, [sourceHash]);
  useEffect(() => {
    const original = journal.entries.find((intent) => intent.kind === "mint" && intent.meta.sourceHash === sourceHash.toLowerCase());
    if (original) {
      setMintHash(original.hash);
      setMintLocked(original.status === "unknown" || original.status === "confirmed");
    }
  }, [journal.entries, sourceHash]);
  const rememberReviewOpener = useReviewDialog(modal, !!draft, !!busy, () => setDraft(undefined));
  async function fetchAttestation() {
    const epoch = session;
    const sourceIdentity = sourceHash;
    const provider = window.ethereum;
    const active = () => epoch === current.current.session && sourceIdentity === current.current.sourceHash && window.ethereum === provider;
    setError("");
    setStatus("");
    setBusy("Checking the original burn and Circle attestation…");
    try {
      if (
        !provider ||
        !sourceManifest ||
        !/^0x[\da-f]{64}$/i.test(sourceHash)
      )
        throw Error(
          "Verify the source manifest and enter the original source hash above.",
        );
      let source = record;
      if (
        !source ||
        source.burnTxHash?.toLowerCase() !== sourceHash.toLowerCase()
      )
        source = await sourceRecord(
          provider,
          sourceManifest,
          sourceHash as Hex,
        );
      if (!active()) return;
      setRecord(source);
      const stored = readBridgeSources().find(
        (r) => r.hash.toLowerCase() === sourceHash.toLowerCase(),
      );
      if (stored?.mintHash) {
        setMintHash(stored.mintHash);
        setMintLocked(stored.status !== "Destination reverted");
      }
      if (!stored) {
        try {
          saveBridgeSource(sourceManifest, sourceHash as Hex, {
            Amount: `${formatUnits(BigInt(source.amount), 6)} USDC`,
            "Destination domain": String(source.toChain),
            Recipient: source.recipient,
          });
          updateBridgeSource(sourceHash as Hex, "Source confirmed");
          onRecordsChange();
        } catch {
          setStatus(
            "Browser could not save this recovery record. Keep the source hash.",
          );
        }
      }
      const attested = await attest(source);
      if (!active()) return;
      if (!attested) {
        setStatus(
          "Circle attestation pending. Keep the original burn hash and check again later; do not burn again.",
        );
        return;
      }
      setRecord(attested);
      setStatus(
        "Matching Circle attestation available. Import a verified destination manifest, switch the external wallet to that network, then review receiving.",
      );
    } catch (e) {
      if (active()) setError(explain(e));
    } finally {
      if (active()) setBusy("");
    }
  }
  async function review() {
    const epoch = session;
    const sourceIdentity = sourceHash;
    const destinationIdentity = destinationText;
    const provider = window.ethereum;
    const active = () => epoch === current.current.session && sourceIdentity === current.current.sourceHash && destinationIdentity === current.current.destinationText && window.ethereum === provider;
    rememberReviewOpener();
    setError("");
    setBusy("Verifying destination and simulating the mint…");
    try {
      assertNoUnresolvedIntent();
      if (!record?.message || !provider)
        throw Error("Fetch a matching Circle attestation first.");
      if (mintLocked)
        throw Error(
          "A destination mint was already submitted. Check its receipt before any further action.",
        );
      const destination = parseRecoveryManifest(destinationText);
      const accounts = await provider.request({
        method: "eth_accounts",
      });
      if (!accounts[0]) throw Error("Connect the destination owner wallet.");
      const prepared = await prepareMint(provider, destination, record, accounts[0]);
      if (active()) {
        setMintIntentId(undefined);
        setDraft({ ...prepared, session: epoch, provider, sourceIdentity, destinationIdentity });
      }
    } catch (e) {
      if (active()) setError(explain(e));
    } finally {
      if (active()) setBusy("");
    }
  }
  async function confirm() {
    if (!draft || !window.ethereum || spent || journal.blocked) return;
    const epoch = draft.session;
    const provider = draft.provider;
    const sourceIdentity = draft.sourceIdentity;
    const destinationIdentity = draft.destinationIdentity;
    const assertCurrent = () => {
      if (epoch !== current.current.session || sourceIdentity !== current.current.sourceHash || destinationIdentity !== current.current.destinationText || provider !== window.ethereum)
        throw Error("Wallet or transfer changed since receiving review. Reconnect and review again.");
    };
    let sent: Hex | undefined;
    setBusy("Confirm receiving in your external wallet…");
    setError("");
    try {
      assertCurrent();
      const { transmitter, message } = await destinationChecks(
        provider,
        draft.destination,
        draft.record,
        draft.account,
      );
      const executedFee = BigInt("0x" + message.slice(2 + 312 * 2, 2 + 344 * 2));
      const expected = BigInt(draft.record.amount) - executedFee;
      await submit(
        provider,
        draft.destination.manifest,
        draft.account,
        draft.op,
        (hash) => {
          sent = hash;
          setMintHash(hash);
          setMintLocked(true);
          setBusy("Mint submitted · waiting for 2 confirmations…");
          try {
            saveMintSource(
              draft.record.burnTxHash!,
              hash,
              draft.destination.manifest.chainId,
              "Mint submitted",
            );
            onRecordsChange();
          } catch {
            setStatus(
              `Keep destination transaction hash ${hash}; browser recovery storage is unavailable.`,
            );
          }
        },
        { kind: "mint", assertCurrent, onClaimed: (intent) => setMintIntentId(intent.id), meta: {
          sourceHash: draft.record.burnTxHash!, mintNonce: messageNonce(message),
          token: USDC_CONTRACT[draft.record.toChain], transmitter,
          transmitterHash: draft.destination.transmitterHash,
          balanceBefore: String(draft.balanceBefore), expectedCredit: String(expected),
        } },
      );
      if (sent) {
        try {
          saveMintSource(
            draft.record.burnTxHash!,
            sent,
            draft.destination.manifest.chainId,
            "Destination confirmed",
          );
          onRecordsChange();
        } catch {
          /* Receipt and hash remain visible. */
        }
      }
      setStatus(
        `Destination received ${formatUnits(expected, 6)} USDC in the verified vault. Nonce consumed; receipt confirmed twice.`,
      );
      if (epoch === current.current.session) setDraft(undefined);
    } catch (e) {
      const message = explain(e);
      setError(message);
      if (sent) {
        let reverted = false;
        try { reverted = readIntents().some((intent) => intent.hash === sent && intent.status === "reverted"); }
        catch { /* Unavailable storage cannot establish a confirmed revert. */ }
        setMintLocked(!reverted);
        try {
          saveMintSource(
            draft.record.burnTxHash!,
            sent,
            draft.destination.manifest.chainId,
            reverted ? "Destination reverted" : "Mint unresolved",
          );
          onRecordsChange();
        } catch {
          /* Public hash remains visible. */
        }
      }
    } finally {
      if (epoch === current.current.session) setBusy("");
    }
  }
  async function checkReceipt() {
    setError("");
    setBusy("Checking the submitted destination receipt…");
    try {
      if (
        !mintHash ||
        !record?.message ||
        !record.attestation ||
        !window.ethereum
      )
        throw Error(
          "A saved destination hash and matching attestation are required.",
        );
      const destination = parseRecoveryManifest(destinationText);
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (!accounts[0]) throw Error("Connect the destination owner wallet.");
      const original = readIntents().find((intent) => intent.kind === "mint" && intent.hash === mintHash && intent.meta.sourceHash === record.burnTxHash?.toLowerCase() && intent.to === destination.manifest.vault.toLowerCase());
      if (!original) throw Error("The original public receiving intent is required.");
      const { intent } = await reconcileIntent(window.ethereum, original.id, mintHash);
      if (intent.status === "reverted") {
        setMintLocked(false);
        saveMintSource(
          record.burnTxHash!,
          mintHash,
          destination.manifest.chainId,
          "Destination reverted",
        );
        onRecordsChange();
        setStatus(
          "Destination mint reverted. No successful receiving was recorded. Recheck the matching attestation and review a new attempt.",
        );
        return;
      }
      setMintLocked(true);
      saveMintSource(
        record.burnTxHash!,
        mintHash,
        destination.manifest.chainId,
        "Destination confirmed",
      );
      onRecordsChange();
      setStatus(
        "Destination receiving confirmed twice; exact call, consumed CCTP nonce and vault credit verified. No further mint is allowed.",
      );
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="panel recovery">
      <div className="panel-heading">
        <h2>Receive on the destination</h2>
        <span className="badge">Owner confirmation required</span>
      </div>
      <p className="form-note">
        Start with the original source transaction hash above. Fetch its
        matching Circle sandbox attestation, then import a verified destination
        manifest with the destination vault’s runtime hash and the official
        MessageTransmitterV2 code hash. The source recipient must be this
        destination vault.
      </p>
      <button
        className="secondary"
        onClick={fetchAttestation}
        disabled={
          !sourceManifest || !/^0x[\da-f]{64}$/i.test(sourceHash) || !!busy
        }
      >
        Check Circle attestation ↻
      </button>
      <label className="field recovery-manifest">
        <span>Destination manifest JSON</span>
        <textarea
          aria-label="Destination manifest JSON"
          value={destinationText}
          onChange={(e) => {
            setDestinationText(e.target.value);
            setDraft(undefined);
          }}
          rows={5}
          placeholder="Destination vault manifest plus messageTransmitterCodeHash"
        />
      </label>
      <p className="form-note">
        Switch networks in your external wallet after the attestation is
        available. Receiving executes via destination vault.ownerExecute; keys
        and Circle attestations are never persisted in this browser.
      </p>
      <div className="button-row">
        <button
          className="primary"
          disabled={
            !record?.message || !destinationText || mintLocked || !!busy || journal.blocked
          }
          onClick={review}
        >
          Review destination mint →
        </button>
        {mintHash && (
          <button
            className="secondary"
            onClick={checkReceipt}
            disabled={!!busy}
          >
            Check destination receipt
          </button>
        )}
      </div>
      {status && (
        <p role="status" className="form-note">
          {status}
        </p>
      )}
      {busy && (
        <p role="status" className="form-note">
          {busy}
        </p>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {mintHash && <p className="form-note">Destination hash: {mintHash}</p>}
      {draft && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mint-review"
            tabIndex={-1}
            ref={modal}
          >
            <span className="eyebrow">DESTINATION RECEIVING · REVIEW</span>
            <h2 id="mint-review">Receive your CCTP transfer</h2>
            <p>
              This executes only the matching attested transfer through the
              destination vault. No new burn is submitted.
            </p>
            <dl>
              {Object.entries(draft.op.details).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div>
                <dt>Destination vault</dt>
                <dd>{draft.destination.manifest.vault}</dd>
              </div>
              <div>
                <dt>Signer</dt>
                <dd>{draft.account} · owner</dd>
              </div>
              <div>
                <dt>Network fee</dt>
                <dd>{draft.fee} ETH estimate; wallet shows final fee</dd>
              </div>
            </dl>
            <details>
              <summary>Complete destination vault call data</summary>
              <pre>{draft.op.data}</pre>
            </details>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            {busy && <p role="status">{busy}</p>}
            <div className="button-row">
              <button
                className="secondary"
                onClick={() => setDraft(undefined)}
                disabled={!!busy}
              >
                Go back
              </button>
              <button
                className="primary"
                onClick={confirm}
                disabled={!!busy || mintLocked || spent || journal.blocked}
              >
                Confirm destination mint in wallet ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
