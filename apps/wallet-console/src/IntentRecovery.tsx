import { useState } from "react";
import { chains } from "./security";
import { reconcileIntent, type PublicIntent } from "./intents";
import type { Hex } from "viem";
export default function IntentRecovery({ entries, storageError, onReconciled }: {
  entries: PublicIntent[];
  storageError: string;
  onReconciled: (intent: PublicIntent) => void;
}) {
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  if (!entries.length && !storageError) return null;
  async function verify(intent: PublicIntent) {
    setError("");
    setBusy(intent.id);
    try {
      if (!window.ethereum) throw Error("Connect an injected wallet on the original intent network to read its transaction.");
      const hash = hashes[intent.id] || intent.hash || "";
      if (!/^0x[\da-f]{64}$/i.test(hash)) throw Error("Enter the original public transaction hash from your wallet history.");
      const result = await reconcileIntent(window.ethereum, intent.id, hash as Hex);
      onReconciled(result.intent);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally { setBusy(""); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "agentwallet-public-recovery.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return <section className="panel intent-recovery">
    <div className="panel-heading">
      <h2>Wallet request recovery</h2>
      <button className="secondary" onClick={download} disabled={!!storageError || !entries.length}>Download recovery metadata</button>
    </div>
    <p className="form-note">Public transaction identities survive dialog close, setup navigation and reload. An unknown request may already have executed; another write stays blocked until its exact transaction is verified. Find its hash in your external wallet history and switch to its original network.</p>
    {storageError && <p role="alert" className="error-text">Recovery storage unavailable: {storageError}. Sending is blocked.</p>}
    {entries.map((intent) => <div className="intent-entry" key={intent.id}>
      <div className="panel-heading"><h3>{intent.label}</h3><span className="badge">{
        intent.status === "confirmed" ? intent.queueId ? `Receipt confirmed · queued request #${intent.queueId}` : "Receipt confirmed" :
        intent.status === "reverted" ? "Reverted receipt" : intent.status === "rejected" ? "Not submitted" :
        intent.hash ? "Saved receipt unresolved" : "Broadcast outcome unknown"
      }</span></div>
      <dl>
        <dt>Original network</dt><dd>{chains[intent.chainId as keyof typeof chains].name} · {intent.chainId}</dd>
        <dt>Signer</dt><dd>{intent.from}</dd>
        <dt>Destination</dt><dd>{intent.to ?? "Contract creation"}</dd>
        <dt>Wallet nonce</dt><dd>{intent.nonce}</dd>
        <dt>Calldata digest</dt><dd>{intent.dataHash}</dd>
        {intent.meta.amount && <><dt>Reviewed amount</dt><dd>{intent.meta.amount}</dd></>}
        {intent.contractAddress && <><dt>Creation address</dt><dd>{intent.contractAddress}</dd></>}
      </dl>
      {intent.hash && <a target="_blank" rel="noopener noreferrer" href={`${chains[intent.chainId as keyof typeof chains].explorer}/tx/${intent.hash}`}>{intent.hash} ↗</a>}
      {intent.status === "unknown" && <div className="inspect">
        <label className="field"><span>Recovered transaction hash</span><input aria-label="Recovered transaction hash" value={hashes[intent.id] ?? intent.hash ?? ""} onChange={(event) => setHashes((prior) => ({ ...prior, [intent.id]: event.target.value }))} /></label>
        <button className="secondary" disabled={!!busy} onClick={() => verify(intent)}>Verify recovered transaction</button>
      </div>}
    </div>)}
    {busy && <p role="status">Verifying the original transaction and two-confirmation receipt…</p>}
    {error && <p role="alert" className="error-text">{error}</p>}
  </section>;
}
