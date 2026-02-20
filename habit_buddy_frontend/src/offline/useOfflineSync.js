import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getQueueSummary, syncQueuedActions } from "./offlineQueue";

/** Small helper: keep state in sync with localStorage-backed queue. */
function useQueueSummaryPolling({ intervalMs = 1500 } = {}) {
  const [summary, setSummary] = useState(() => getQueueSummary());

  useEffect(() => {
    const id = window.setInterval(() => {
      setSummary(getQueueSummary());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return summary;
}

// PUBLIC_INTERFACE
export function useOfflineSync() {
  /**
   * Hook providing:
   * - isOnline: browser connectivity (navigator.onLine + events)
   * - queueCount: total queued actions pending sync (including dead-letter)
   * - pendingCount: queued actions that will still retry
   * - deadCount: permanently failed actions
   * - nextRetryAtMs: earliest scheduled retry time (ms) among pending items
   * - syncNow(): manual sync action
   * - syncing + lastSync summary for UI indicators
   */
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const queueSummary = useQueueSummaryPolling({ intervalMs: 1200 });

  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    function onOnline() {
      setIsOnline(true);
    }
    function onOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return { sent: 0, remaining: queueSummary.total, results: [], summary: queueSummary };
    syncingRef.current = true;
    setSyncing(true);
    try {
      const res = await syncQueuedActions();
      setLastSync({ at: new Date().toISOString(), ...res });
      return res;
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [queueSummary]);

  // Auto-sync when we come back online and there is anything to flush.
  useEffect(() => {
    if (!isOnline) return;
    if (queueSummary.pending <= 0) return;
    syncNow();
  }, [isOnline, queueSummary.pending, syncNow]);

  return useMemo(
    () => ({
      isOnline,
      queueCount: queueSummary.total,
      pendingCount: queueSummary.pending,
      deadCount: queueSummary.dead,
      nextRetryAtMs: queueSummary.nextRetryAtMs,
      syncing,
      lastSync,
      syncNow
    }),
    [isOnline, queueSummary, syncing, lastSync, syncNow]
  );
}
