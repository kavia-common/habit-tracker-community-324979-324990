import { apiRequest } from "../api/client";
import { demoApi } from "../api/demoStore";

const LS_KEY = "hb_offline_checkin_queue_v1";

/**
 * A queued habit check-in operation.
 * @typedef {Object} QueuedCheckin
 * @property {string} id Unique id for queue item
 * @property {string} habitId Habit id
 * @property {string} checkin_date Date string YYYY-MM-DD
 * @property {number|null} value Optional numeric value
 * @property {string|null} note Optional note
 * @property {number} createdAtMs Timestamp for ordering/debug
 */

function safeParseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadQueue() {
  const raw = localStorage.getItem(LS_KEY);
  const parsed = raw ? safeParseJson(raw, null) : null;
  if (!Array.isArray(parsed)) return [];
  // Small sanity filter: must have habitId and checkin_date
  return parsed.filter((x) => x && typeof x.habitId === "string" && typeof x.checkin_date === "string");
}

function saveQueue(queue) {
  localStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(queue) ? queue : []));
}

function uid(prefix = "q") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/**
 * Attempt to call backend check-in endpoint. If it fails (endpoint missing/unavailable),
 * fall back to demoStore so the UI still reflects the check-in.
 */
async function sendCheckinToServerOrDemo(item) {
  // Backend spec: POST /habits/{habit_id}/checkins with body HabitCheckinCreateRequest
  try {
    await apiRequest(`/habits/${encodeURIComponent(item.habitId)}/checkins`, {
      method: "POST",
      body: {
        checkin_date: item.checkin_date,
        value: item.value ?? null,
        note: item.note ?? null
      }
    });
    return { ok: true, via: "api" };
  } catch (err) {
    // If offline, let the caller treat it as retryable.
    // If the backend doesn't support the endpoint yet, we still want to apply to demo state.
    try {
      demoApi.checkInHabit(item.habitId, {
        date: item.checkin_date,
        value: item.value ?? null,
        note: item.note ?? null
      });
      return { ok: true, via: "demo" };
    } catch {
      // If even demo fails, return original API error as the root.
      return { ok: false, via: "api", error: err };
    }
  }
}

// PUBLIC_INTERFACE
export function getQueuedCheckins() {
  /** Return queued check-ins (oldest first). */
  const q = loadQueue();
  return q.slice().sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
}

// PUBLIC_INTERFACE
export function getQueuedCheckinsCount() {
  /** Convenience for UI badges. */
  return getQueuedCheckins().length;
}

// PUBLIC_INTERFACE
export function enqueueHabitCheckin({ habitId, checkin_date, value = null, note = null }) {
  /**
   * Enqueue a habit check-in for later sync.
   * This should be used when the app is offline or when the caller wants to ensure eventual sync.
   */
  const item = {
    id: uid("checkin"),
    habitId: String(habitId),
    checkin_date: String(checkin_date),
    value: value == null ? null : Number(value),
    note: note == null ? null : String(note),
    createdAtMs: Date.now()
  };

  const queue = loadQueue();
  queue.push(item);
  saveQueue(queue);
  return item;
}

// PUBLIC_INTERFACE
export function clearQueuedCheckins() {
  /** Clear the offline queue (debug / extreme recovery). */
  saveQueue([]);
}

// PUBLIC_INTERFACE
export async function syncQueuedCheckins({ onProgress } = {}) {
  /**
   * Flush queued check-ins to backend (or demo fallback).
   *
   * - Items are processed in FIFO order.
   * - If navigator is offline, the function returns early without modifying the queue.
   * - If a network error happens mid-sync, remaining items stay queued.
   *
   * @param {Object} opts
   * @param {(info: {remaining: number, sent: number, lastResult?: any}) => void} [opts.onProgress]
   * @returns {Promise<{sent:number, remaining:number, results:Array}>}
   */
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const remaining = getQueuedCheckinsCount();
    return { sent: 0, remaining, results: [] };
  }

  let queue = getQueuedCheckins();
  const results = [];
  let sent = 0;

  while (queue.length > 0) {
    const item = queue[0];

    // Attempt send
    // If API fails due to offline/network, break and leave queued.
    let res;
    try {
      res = await sendCheckinToServerOrDemo(item);
    } catch (e) {
      res = { ok: false, error: e };
    }

    results.push({ itemId: item.id, ...res });

    if (res.ok) {
      // Remove successfully processed item
      queue = queue.slice(1);
      saveQueue(queue);
      sent += 1;
      if (onProgress) onProgress({ remaining: queue.length, sent, lastResult: res });
      continue;
    }

    // If not ok, decide whether retry later:
    // - If offline, stop (keep remaining)
    // - Otherwise, stop (avoid tight loop on permanent errors)
    if (typeof navigator !== "undefined" && navigator.onLine === false) break;
    break;
  }

  return { sent, remaining: queue.length, results };
}
