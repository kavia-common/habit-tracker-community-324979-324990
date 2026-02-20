import React from "react";
import { useOfflineSync } from "../offline/useOfflineSync";
import { useUI } from "../context/UIContext";

// PUBLIC_INTERFACE
export default function OfflineIndicator() {
  /** Shows online/offline status + queued check-ins count + manual "Sync now" action. */
  const ui = useUI();
  const { isOnline, queueCount, syncing, syncNow } = useOfflineSync();

  const statusText = isOnline ? "Online" : "Offline";
  const toneClass = isOnline ? "notice" : "notice warn";

  return (
    <div className={`offline-indicator ${toneClass}`} role="status" aria-live="polite">
      <div className="row between" style={{ gap: 10 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 12 }}>{statusText}</span>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            Queue: <strong>{queueCount}</strong>
          </span>
        </div>

        <button
          type="button"
          className="btn btn-small"
          disabled={!isOnline || queueCount === 0 || syncing}
          onClick={async () => {
            const res = await syncNow();
            if (res.sent > 0) ui.showToast(`Synced ${res.sent} check-in${res.sent === 1 ? "" : "s"}`);
            else if (res.remaining > 0 && !isOnline) ui.showToast("Offline — will sync when back online");
            else ui.showToast("Nothing to sync");
          }}
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>
    </div>
  );
}
