import React, { useMemo } from "react";
import { useOfflineSync } from "../offline/useOfflineSync";
import { removeDeadQueuedActions } from "../offline/offlineQueue";
import { useUI } from "../context/UIContext";

function formatEta(ms) {
  if (!ms) return null;
  const delta = ms - Date.now();
  if (delta <= 0) return "now";
  const sec = Math.round(delta / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  return `${hr}h`;
}

// PUBLIC_INTERFACE
export default function OfflineIndicator() {
  /** Shows online/offline status + queued actions + manual "Sync now" action. */
  const ui = useUI();
  const { isOnline, queueCount, pendingCount, deadCount, nextRetryAtMs, syncing, syncNow } = useOfflineSync();

  const statusText = isOnline ? "Online" : "Offline";
  const toneClass = isOnline ? "notice" : "notice warn";

  const eta = useMemo(() => formatEta(nextRetryAtMs), [nextRetryAtMs]);

  return (
    <div className={`offline-indicator ${toneClass}`} role="status" aria-live="polite">
      <div className="row between" style={{ gap: 10 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <span style={{ fontWeight: 800, fontSize: 12 }}>{statusText}</span>

          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            Queue: <strong>{queueCount}</strong>
          </span>

          {deadCount > 0 ? (
            <span className="pill" style={{ background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.25)" }}>
              Failed: <strong>{deadCount}</strong>
            </span>
          ) : null}

          {isOnline && pendingCount > 0 && !syncing && eta && eta !== "now" ? (
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Retry in {eta}</span>
          ) : null}
        </div>

        <div className="row wrap" style={{ justifyContent: "flex-end" }}>
          {deadCount > 0 ? (
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => {
                const left = removeDeadQueuedActions();
                ui.showToast(`Removed failed items. Queue now ${left}.`);
              }}
              title="Remove permanently failed items from the queue"
            >
              Clear failed
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn-small"
            disabled={!isOnline || pendingCount === 0 || syncing}
            onClick={async () => {
              const res = await syncNow();
              if (res.sent > 0) ui.showToast(`Synced ${res.sent} item${res.sent === 1 ? "" : "s"}`);
              else if (!isOnline && res.remaining > 0) ui.showToast("Offline — will sync when back online");
              else if (res.summary?.dead > 0) ui.showToast(`Some items failed (${res.summary.dead}). Will retry or clear failed.`);
              else ui.showToast("Nothing to sync");
            }}
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </div>
    </div>
  );
}
