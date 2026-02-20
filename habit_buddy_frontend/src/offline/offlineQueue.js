import { apiRequest } from "../api/client";
import { demoApi } from "../api/demoStore";

const LS_KEY = "hb_offline_action_queue_v2";

/**
 * Offline action queue
 * - Supports habit check-ins (existing behavior)
 * - Adds feed posting + reaction toggles (new)
 *
 * Notes:
 * - The app uses demoStore as an always-available local model. When online, we try the real API first,
 *   but will fall back to demoStore to keep UI consistent if endpoints are missing/unavailable.
 * - When offline, we enqueue actions and apply optimistic demoStore updates immediately.
 */

/**
 * @typedef {Object} QueuedCheckin
 * @property {string} id
 * @property {"habit_checkin"} type
 * @property {string} habitId
 * @property {string} checkin_date
 * @property {number|null} value
 * @property {string|null} note
 * @property {number} createdAtMs
 */

/**
 * @typedef {Object} QueuedFeedPost
 * @property {string} id
 * @property {"feed_post_create"} type
 * @property {string|null} group_id
 * @property {"text"|"achievement"} post_type
 * @property {string|null} content
 * @property {Object|null} data
 * @property {string[]} tags
 * @property {string} clientPostId A stable client id for optimistic UI and reconciliation (demoStore only for now)
 * @property {number} createdAtMs
 */

/**
 * @typedef {Object} QueuedReactionToggle
 * @property {string} id
 * @property {"feed_reaction_toggle"} type
 * @property {string} postId
 * @property {string} reactionKey
 * @property {boolean} toReacted Desired final reacted state after toggle
 * @property {number} createdAtMs
 */

function safeParseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function uid(prefix = "q") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function loadQueue() {
  const raw = localStorage.getItem(LS_KEY);
  const parsed = raw ? safeParseJson(raw, null) : null;
  if (!Array.isArray(parsed)) return [];
  // Very light sanity filter
  return parsed.filter((x) => x && typeof x.type === "string" && typeof x.id === "string");
}

function saveQueue(queue) {
  localStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(queue) ? queue : []));
}

function isOfflineNow() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Collapse multiple queued reaction toggles on the same (postId, reactionKey) into only the last desired state.
 * This prevents spamming API calls after a user taps repeatedly while offline.
 */
function compactQueue(queue) {
  /** @type {Map<string, number>} */
  const lastIdxByReactionKey = new Map();

  const toRemove = new Set();
  queue.forEach((item, idx) => {
    if (item?.type !== "feed_reaction_toggle") return;
    const k = `${item.postId}::${item.reactionKey}`;
    if (lastIdxByReactionKey.has(k)) {
      // remove older one
      toRemove.add(lastIdxByReactionKey.get(k));
    }
    lastIdxByReactionKey.set(k, idx);
  });

  if (toRemove.size === 0) return queue;
  return queue.filter((_, idx) => !toRemove.has(idx));
}

/**
 * Attempt to call backend check-in endpoint. If it fails (endpoint missing/unavailable),
 * fall back to demoStore so the UI still reflects the check-in.
 */
async function sendCheckinToServerOrDemo(item) {
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
    try {
      demoApi.checkInHabit(item.habitId, {
        date: item.checkin_date,
        value: item.value ?? null,
        note: item.note ?? null
      });
      return { ok: true, via: "demo" };
    } catch {
      return { ok: false, via: "api", error: err };
    }
  }
}

async function sendFeedPostToServerOrDemo(item) {
  // Backend spec: POST /feed with body FeedPostCreateRequest (group_id, post_type, content, data)
  try {
    const created = await apiRequest(`/feed`, {
      method: "POST",
      body: {
        group_id: item.group_id ?? null,
        post_type: item.post_type || "text",
        content: item.content ?? null,
        data: item.data ?? null
      }
    });
    return { ok: true, via: "api", created };
  } catch (err) {
    // Demo fallback (already optimistic in UI, but safe to re-apply if needed).
    try {
      demoApi.createPost(item.content || "", { postType: item.post_type || "text", tags: item.tags || [] });
      return { ok: true, via: "demo" };
    } catch {
      return { ok: false, via: "api", error: err };
    }
  }
}

async function sendReactionToggleToServerOrDemo(item) {
  // Backend currently supports only like/unlike:
  // - POST /feed/{post_id}/like
  // - POST /feed/{post_id}/unlike
  // For other reactions we fall back to demo behavior.
  const isLike = item.reactionKey === "like";
  if (isLike) {
    const path = item.toReacted
      ? `/feed/${encodeURIComponent(item.postId)}/like`
      : `/feed/${encodeURIComponent(item.postId)}/unlike`;
    try {
      await apiRequest(path, { method: "POST" });
      return { ok: true, via: "api" };
    } catch (err) {
      try {
        demoApi.toggleReaction(item.postId, item.reactionKey);
        return { ok: true, via: "demo" };
      } catch {
        return { ok: false, via: "api", error: err };
      }
    }
  }

  // Non-like reactions: demo-only for now (backend endpoints not defined in OpenAPI).
  try {
    // Ensure demo matches desired final state. demoApi.toggleReaction toggles, so we compare first.
    const state = demoApi.listFeed().find((p) => p.id === item.postId);
    const reacted = Boolean(state?.reactions?.[item.reactionKey]?.reactedByMe);
    if (reacted !== Boolean(item.toReacted)) demoApi.toggleReaction(item.postId, item.reactionKey);
    return { ok: true, via: "demo" };
  } catch (err) {
    return { ok: false, via: "demo", error: err };
  }
}

// PUBLIC_INTERFACE
export function getQueuedActions() {
  /** Return queued actions (oldest first). */
  const q = loadQueue();
  return q.slice().sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
}

// PUBLIC_INTERFACE
export function getQueuedActionsCount() {
  /** Convenience for UI badges. */
  return getQueuedActions().length;
}

// PUBLIC_INTERFACE
export function enqueueHabitCheckin({ habitId, checkin_date, value = null, note = null }) {
  /**
   * Enqueue a habit check-in for later sync.
   * This should be used when the app is offline or when the caller wants to ensure eventual sync.
   */
  const item = {
    id: uid("checkin"),
    type: "habit_checkin",
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
export function enqueueFeedPostCreate({ content, tags = [], post_type = "text", group_id = null, data = null }) {
  /**
   * Enqueue a feed post create action for later sync.
   * Callers should also apply an optimistic UI update immediately (demoStore does this).
   */
  const cleanedTags = Array.isArray(tags) ? tags.map((t) => String(t)) : [];
  const item = {
    id: uid("feedpost"),
    type: "feed_post_create",
    group_id: group_id == null ? null : String(group_id),
    post_type: post_type === "achievement" ? "achievement" : "text",
    content: content == null ? null : String(content),
    data: data == null ? null : data,
    tags: cleanedTags,
    clientPostId: uid("clientpost"),
    createdAtMs: Date.now()
  };

  const queue = loadQueue();
  queue.push(item);
  saveQueue(queue);
  return item;
}

// PUBLIC_INTERFACE
export function enqueueFeedReactionToggle({ postId, reactionKey, toReacted }) {
  /**
   * Enqueue a reaction toggle action for later sync.
   * Callers should apply an optimistic UI update immediately (demoStore does this).
   */
  const item = {
    id: uid("react"),
    type: "feed_reaction_toggle",
    postId: String(postId),
    reactionKey: String(reactionKey),
    toReacted: Boolean(toReacted),
    createdAtMs: Date.now()
  };

  const queue = compactQueue([...loadQueue(), item]);
  saveQueue(queue);
  return item;
}

// PUBLIC_INTERFACE
export function clearQueuedActions() {
  /** Clear the offline queue (debug / extreme recovery). */
  saveQueue([]);
}

async function sendItem(item) {
  if (item?.type === "habit_checkin") return sendCheckinToServerOrDemo(item);
  if (item?.type === "feed_post_create") return sendFeedPostToServerOrDemo(item);
  if (item?.type === "feed_reaction_toggle") return sendReactionToggleToServerOrDemo(item);
  return { ok: false, error: new Error(`Unknown queue item type: ${String(item?.type)}`) };
}

// PUBLIC_INTERFACE
export async function syncQueuedActions({ onProgress } = {}) {
  /**
   * Flush queued actions to backend (or demo fallback).
   *
   * - Items are processed in FIFO order.
   * - If navigator is offline, the function returns early without modifying the queue.
   * - If a network error happens mid-sync, remaining items stay queued.
   *
   * @param {Object} opts
   * @param {(info: {remaining: number, sent: number, lastResult?: any}) => void} [opts.onProgress]
   * @returns {Promise<{sent:number, remaining:number, results:Array}>}
   */
  if (isOfflineNow()) {
    const remaining = getQueuedActionsCount();
    return { sent: 0, remaining, results: [] };
  }

  let queue = getQueuedActions();
  const results = [];
  let sent = 0;

  while (queue.length > 0) {
    const item = queue[0];

    let res;
    try {
      res = await sendItem(item);
    } catch (e) {
      res = { ok: false, error: e };
    }

    results.push({ itemId: item.id, type: item.type, ...res });

    if (res.ok) {
      queue = queue.slice(1);
      saveQueue(queue);
      sent += 1;
      if (onProgress) onProgress({ remaining: queue.length, sent, lastResult: res });
      continue;
    }

    // If not ok, stop and keep remaining items queued.
    if (isOfflineNow()) break;
    break;
  }

  return { sent, remaining: queue.length, results };
}

/**
 * Back-compat exports for existing UI.
 * (HabitsPage imports syncQueuedCheckins; keep that working.)
 */

// PUBLIC_INTERFACE
export async function syncQueuedCheckins(opts) {
  /** Back-compat: sync all queued actions (including check-ins). */
  return syncQueuedActions(opts);
}

// PUBLIC_INTERFACE
export function getQueuedCheckins() {
  /** Back-compat: return only queued check-ins. */
  return getQueuedActions().filter((x) => x?.type === "habit_checkin");
}

// PUBLIC_INTERFACE
export function getQueuedCheckinsCount() {
  /** Back-compat: count only queued check-ins. */
  return getQueuedCheckins().length;
}
