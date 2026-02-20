import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getQueuedCheckinsCount, syncQueuedCheckins } from "./offlineQueue";

/** Small helper: keep state in sync with localStorage-backed queue. */
function useQueueCountPolling({ intervalMs = 1500 } = {}) {
  const [count, setCount] = useState(() => getQueuedCheckinsCount());

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount(getQueuedCheckinsCount());
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return count;
}

// PUBLIC_INTERFACE
export function useOfflineSync() {
  /**
   * Hook providing:
   * - isOnline: browser connectivity (navigator.onLine + events)
   * - queueCount: number of queued check-ins pending sync
   * - syncNow(): manual sync action
   * - syncing + lastSync summary for UI indicators
   */
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false));
  const queueCount = useQueueCountPolling({ intervalMs: 1200 });

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
    if (syncingRef.current) return { sent: 0, remaining: getQueuedCheckinsCount(), results: [] };
    syncingRef.current = true;
    setSyncing(true);
    try {
      const res = await syncQueuedCheckins();
      setLastSync({ at: new Date().toISOString(), ...res });
      return res;
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  // Auto-sync when we come back online and there is anything to flush.
  useEffect(() => {
    if (!isOnline) return;
    if (queueCount <= 0) return;
    // Fire and forget: the UI can still show the syncing state.
    syncNow();
  }, [isOnline, queueCount, syncNow]);

  return useMemo(
    () => ({
      isOnline,
      queueCount,
      syncing,
      lastSync,
      syncNow
    }),
    [isOnline, queueCount, syncing, lastSync, syncNow]
  );
}
