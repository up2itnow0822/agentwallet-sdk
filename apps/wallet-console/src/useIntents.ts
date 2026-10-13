import { useEffect, useState } from "react";
import { intentChanged, intentStorageKey, readIntents, type PublicIntent } from "./intents";
interface JournalState { entries: PublicIntent[]; error: string }
function read(): JournalState {
  try { return { entries: readIntents(), error: "" }; }
  catch (error) { return { entries: [], error: error instanceof Error ? error.message : "Public recovery storage unavailable." }; }
}
export function useIntents() {
  const [journal, setJournal] = useState(read);
  useEffect(() => {
    const refresh = () => setJournal(read());
    const storage = (event: StorageEvent) => {
      if (event.key === intentStorageKey || event.key === null) refresh();
    };
    window.addEventListener(intentChanged, refresh);
    window.addEventListener("storage", storage);
    refresh();
    return () => {
      window.removeEventListener(intentChanged, refresh);
      window.removeEventListener("storage", storage);
    };
  }, []);
  return { ...journal, blocked: !!journal.error || journal.entries.some((entry) => entry.status === "unknown") };
}
