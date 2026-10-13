import { useEffect, useRef, useState } from "react";
import { formatUnits, encodeFunctionData, type Hex } from "viem";
import {
  sourceRecord,
  attest,
  parseRecoveryManifest,
  prepareMint,
  destinationChecks,
  type RecoveryDraft,
} from "./recovery";
import { type Manifest, validateReceipt } from "./security";
import { submit, explain } from "./wallet";
import { erc20Abi, vaultAbi } from "./abi";
import { MessageTransmitterV2Abi } from "../../../src/bridge/abis";
import { messageNonce } from "../../../src/bridge/message";
import { USDC_CONTRACT, type BridgeRecord } from "../../../src/bridge/types";
import {
  readBridgeSources,
  saveBridgeSource,
  updateBridgeSource,
  saveMintSource,
} from "./bridgeRecords";
export default function Recovery({
  sourceManifest,
  sourceHash,
  onRecordsChange,
}: {
  sourceManifest?: Manifest;
  sourceHash: string;
  onRecordsChange: () => void;
}) {
  const [destinationText, setDestinationText] = useState(""),
    [record, setRecord] = useState<BridgeRecord>(),
    [draft, setDraft] = useState<RecoveryDraft>(),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [mintHash, setMintHash] = useState<Hex>(),
    [mintLocked, setMintLocked] = useState(false);
  const modal = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setRecord(undefined);
    setDraft(undefined);
    setStatus("");
    setError("");
    setMintHash(undefined);
    setMintLocked(false);
  }, [sourceHash]);
  useEffect(() => {
    if (!draft) return;
    modal.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setDraft(undefined);
      if (e.key === "Tab") {
        const nodes = modal.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled)",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [draft, busy]);
  async function fetchAttestation() {
    setError("");
    setStatus("");
    setBusy("Checking the original burn and Circle attestation…");
    try {
      if (
        !window.ethereum ||
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
          window.ethereum,
          sourceManifest,
          sourceHash as Hex,
        );
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
      setError(explain(e));
    } finally {
      setBusy("");
    }
  }
  async function review() {
    setError("");
    setBusy("Verifying destination and simulating the mint…");
    try {
      if (!record?.message || !window.ethereum)
        throw Error("Fetch a matching Circle attestation first.");
      if (mintLocked)
        throw Error(
          "A destination mint was already submitted. Check its receipt before any further action.",
        );
      const destination = parseRecoveryManifest(destinationText);
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (!accounts[0]) throw Error("Connect the destination owner wallet.");
      setDraft(
        await prepareMint(window.ethereum, destination, record, accounts[0]),
      );
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy("");
    }
  }
  async function confirm() {
    if (!draft || !window.ethereum) return;
    let sent: Hex | undefined;
    setBusy("Confirm receiving in your external wallet…");
    setError("");
    try {
      const { rpc, transmitter, message } = await destinationChecks(
        window.ethereum,
        draft.destination,
        draft.record,
        draft.account,
      );
      await submit(
        window.ethereum,
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
      );
      const [used, balance] = await Promise.all([
        rpc.readContract({
          address: transmitter,
          abi: MessageTransmitterV2Abi,
          functionName: "usedNonces",
          args: [messageNonce(message)],
        }),
        rpc.readContract({
          address: USDC_CONTRACT[draft.record.toChain],
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [draft.destination.manifest.vault],
        }),
      ]);
      const executedFee = BigInt(
        "0x" + message.slice(2 + 312 * 2, 2 + 344 * 2),
      );
      const expected = BigInt(draft.record.amount) - executedFee;
      if (used === 0n || balance < draft.balanceBefore + expected)
        throw Error(
          "Destination receipt succeeded, but CCTP nonce or vault credit could not be verified. Keep the hash and inspect before retrying.",
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
      setDraft(undefined);
    } catch (e) {
      const message = explain(e);
      setError(message);
      if (sent) {
        const reverted = /Transaction reverted on-chain/.test(message);
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
      setBusy("");
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
      const { rpc, transmitter, message } = await destinationChecks(
        window.ethereum,
        destination,
        record,
        accounts[0],
        true,
      );
      const receipt = await rpc.waitForTransactionReceipt({
        hash: mintHash,
        confirmations: 2,
        timeout: 15000,
      });
      if (
        receipt.to?.toLowerCase() !== destination.manifest.vault.toLowerCase()
      )
        throw Error(
          "Saved mint receipt does not target the destination vault.",
        );
      const transaction = await rpc.getTransaction({ hash: mintHash });
      const receiveData = encodeFunctionData({
        abi: MessageTransmitterV2Abi,
        functionName: "receiveMessage",
        args: [message, record.attestation],
      });
      const expectedCall = encodeFunctionData({
        abi: vaultAbi,
        functionName: "ownerExecute",
        args: [transmitter, 0n, receiveData],
      });
      if (transaction.input.toLowerCase() !== expectedCall.toLowerCase())
        throw Error(
          "Saved destination transaction does not match this exact attested transfer.",
        );
      if (receipt.transactionHash.toLowerCase() !== mintHash.toLowerCase())
        throw Error(
          "RPC returned a receipt for a different transaction. Keep the original destination hash.",
        );
      if (receipt.status === "reverted") {
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
      validateReceipt(receipt, mintHash);
      const used = await rpc.readContract({
        address: transmitter,
        abi: MessageTransmitterV2Abi,
        functionName: "usedNonces",
        args: [messageNonce(message)],
      });
      if (used === 0n)
        throw Error(
          "Successful receipt did not consume the CCTP nonce. Do not retry until the discrepancy is resolved.",
        );
      setMintLocked(true);
      saveMintSource(
        record.burnTxHash!,
        mintHash,
        destination.manifest.chainId,
        "Destination confirmed",
      );
      onRecordsChange();
      setStatus(
        "Destination receiving confirmed twice; exact call and consumed CCTP nonce verified. No further mint is allowed.",
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
            !record?.message || !destinationText || mintLocked || !!busy
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
                disabled={!!busy || mintLocked}
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
