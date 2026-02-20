import { apiRequest } from "../api/client";
import { demoApi } from "../api/demoStore";

const LS_KEY = "hb_offline_action_queue_v3";

/**
 * Offline action queue + sync with conflict-handling:
 * - Exponential backoff retries
 * - Failure tracking + dead-lettering after max attempts
 * - Duplicate resolution (compaction) for idempotent actions
 *
 * Supported actions:
 * - habit_checkin: POST /habits/{habit_id}/checkins (one per habit per day)
 * - feed_post_create: POST /feed (not strictly idempotent server-side; we mitigate duplicates client-side)
 * - feed_reaction_toggle: POST /feed/{post_id}/like|unlike (idempotent per backend spec)
 *
 * Storage:
 * - localStorage key hb_offline_action_queue_v3
 * - Items carry retry metadata: attempts, nextAttemptAtMs, lastError, lastAttemptAtMs, lastStatus
 */

const DEFAULT_RETRY = {
  baseDelayMs: 1200,
  maxDelayMs: 60_000,
  jitterRatio: 0.25,
  maxAttempts: 6
};

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

function nowMs() {
  return Date.now();
}

function loadQueue() {
  const raw = localStorage.getItem(LS_KEY);
  const parsed = raw ? safeParseJson(raw, null) : null;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((x) => x && typeof x.type === "string" && typeof x.id === "string")
    .map(normalizeItem);
}

function saveQueue(queue) {
  localStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(queue) ? queue : []));
}

function isOfflineNow() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Ensure older queue items (from previous versions) still have required fields.
 * This protects users who already have v2 queue persisted.
 */
function normalizeItem(item) {
  const base = {
    ...item,
    createdAtMs: typeof item.createdAtMs === "number" ? item.createdAtMs : nowMs(),
    attempts: typeof item.attempts === "number" ? item.attempts : 0,
    nextAttemptAtMs: typeof item.nextAttemptAtMs === "number" ? item.nextAttemptAtMs : 0,
    lastAttemptAtMs: typeof item.lastAttemptAtMs === "number" ? item.lastAttemptAtMs : null,
    lastError: typeof item.lastError === "string" ? item.lastError : null,
    lastStatus: typeof item.lastStatus === "number" ? item.lastStatus : null,
    dead: Boolean(item.dead)
  };

  // Assign idempotency keys for dedupe/compaction.
  if (!base.dedupeKey) base.dedupeKey = computeDedupeKey(base);
  return base;
}

function stringifyError(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  // apiRequest throws Error with status/data fields
  const status = err.status ? ` status=${err.status}` : "";
  const msg = err.message ? err.message : "Error";
  return `${msg}${status}`;
}

function isRetryableHttpStatus(status) {
  if (!status) return true; // network / unknown
  if (status >= 500) return true;
  if (status === 408 || status === 409 || status === 425 || status === 429) return true;
  return false;
}

function computeBackoffDelayMs(attemptNum, retryCfg = DEFAULT_RETRY) {
  const expo = retryCfg.baseDelayMs * Math.pow(2, Math.max(0, attemptNum - 1));
  const capped = Math.min(retryCfg.maxDelayMs, expo);
  const jitter = capped * retryCfg.jitterRatio * (Math.random() * 2 - 1); // +/- jitterRatio
  return Math.max(0, Math.round(capped + jitter));
}

function computeDedupeKey(item) {
  // Dedupe keys should represent the "final intended effect".
  // This allows compaction of repeated actions while offline.
  if (item?.type === "habit_checkin") {
    // One check-in per habit per day (backend invariant).
    return `habit_checkin::${String(item.habitId)}::${String(item.checkin_date)}`;
  }
  if (item?.type === "feed_reaction_toggle") {
    // Final state per (post, reactionKey).
    return `feed_reaction_toggle::${String(item.postId)}::${String(item.reactionKey)}`;
  }
  if (item?.type === "feed_post_create") {
    // Feed posts aren't naturally idempotent on server without a client id; we mitigate duplicates by:
    // - dedupeKey based on clientPostId if present (stable per composed post)
    // - else fallback to content hash-ish key (content + createdAt bucket)
    const cpid = item.clientPostId ? String(item.clientPostId) : "";
    if (cpid) return `feed_post_create::clientPostId::${cpid}`;
    const content = String(item.content || "");
    const bucket = Math.floor((Number(item.createdAtMs) || nowMs()) / 60_000);
    return `feed_post_create::fallback::${content.slice(0, 64)}::${bucket}`;
  }
  return `unknown::${String(item?.type)}::${String(item?.id)}`;
}

/**
 * Queue compaction:
 * - habit_checkin: keep last item per (habitId, date) since that's the only valid outcome
 * - feed_reaction_toggle: keep last item per (postId, reactionKey) since we only care about final state
 * - feed_post_create: dedupe by clientPostId (if user retries UI submit quickly)
 */
function compactQueue(queue) {
  const lastIdxByKey = new Map();
  const toRemove = new Set();

  queue.forEach((raw, idx) => {
    const item = normalizeItem(raw);
    const k = item.dedupeKey || computeDedupeKey(item);
    if (!k) return;

    if (item.type === "habit_checkin" || item.type === "feed_reaction_toggle" || item.type === "feed_post_create") {
      if (lastIdxByKey.has(k)) toRemove.add(lastIdxByKey.get(k));
      lastIdxByKey.set(k, idx);
    }
  });

  if (toRemove.size === 0) return queue.map(normalizeItem);
  return queue.filter((_, idx) => !toRemove.has(idx)).map(normalizeItem);
}

async function sendCheckinToServerOrDemo(item) {
  try {
    // Backend creates one check-in per habit per day. If duplicate, backend could return 409/422.
    // Treat 409/422 as a "conflict" that implies the desired state already exists -> success.
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
    const status = err?.status || null;
    if (status === 409 || status === 422) {
      // Most likely already exists; accept as idempotent success to avoid infinite retries.
      return { ok: true, via: "api", assumedDuplicate: true, status };
    }

    // Demo fallback to preserve UI consistency even if backend is down/missing.
    try {
      demoApi.checkInHabit(item.habitId, {
        date: item.checkin_date,
        value: item.value ?? null,
        note: item.note ?? null
      });
      return { ok: true, via: "demo" };
    } catch {
      return { ok: false, via: "api", error: err, status };
    }
  }
}

async function sendFeedPostToServerOrDemo(item) {
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
    const status = err?.status || null;

    // Demo fallback (post may already be visible optimistically).
    // Important: we do NOT toggle/remove anything here; just ensure UI doesn't break.
    try {
      demoApi.createPost(item.content || "", { postType: item.post_type || "text", tags: item.tags || [] });
      return { ok: true, via: "demo", status };
    } catch {
      return { ok: false, via: "api", error: err, status };
    }
  }
}

async function sendReactionToggleToServerOrDemo(item) {
  const isLike = item.reactionKey === "like";

  if (isLike) {
    const path = item.toReacted
      ? `/feed/${encodeURIComponent(item.postId)}/like`
      : `/feed/${encodeURIComponent(item.postId)}/unlike`;

    try {
      await apiRequest(path, { method: "POST" });
      return { ok: true, via: "api" };
    } catch (err) {
      const status = err?.status || null;
      // Like/unlike are idempotent per backend spec; treat 409 as already applied.
      if (status === 409) return { ok: true, via: "api", assumedDuplicate: true, status };

      try {
        // demoApi.toggleReaction toggles; ensure desired final state
        const state = demoApi.listFeed().find((p) => p.id === item.postId);
        const reacted = Boolean(state?.reactions?.[item.reactionKey]?.reactedByMe);
        if (reacted !== Boolean(item.toReacted)) demoApi.toggleReaction(item.postId, item.reactionKey);
        return { ok: true, via: "demo", status };
      } catch {
        return { ok: false, via: "api", error: err, status };
      }
    }
  }

  // Non-like reactions: demo-only for now.
  try {
    const state = demoApi.listFeed().find((p) => p.id === item.postId);
    const reacted = Boolean(state?.reactions?.[item.reactionKey]?.reactedByMe);
    if (reacted !== Boolean(item.toReacted)) demoApi.toggleReaction(item.postId, item.reactionKey);
    return { ok: true, via: "demo" };
  } catch (err) {
    return { ok: false, via: "demo", error: err };
  }
}

async function sendItem(item) {
  if (item?.type === "habit_checkin") return sendCheckinToServerOrDemo(item);
  if (item?.type === "feed_post_create") return sendFeedPostToServerOrDemo(item);
  if (item?.type === "feed_reaction_toggle") return sendReactionToggleToServerOrDemo(item);
  return { ok: false, error: new Error(`Unknown queue item type: ${String(item?.type)}`) };
}

function shouldAttemptNow(item) {
  if (item.dead) return false;
  const t = Number(item.nextAttemptAtMs) || 0;
  return t <= nowMs();
}

function markAttemptFailure(item, err, status, retryCfg = DEFAULT_RETRY) {
  const attempts = (Number(item.attempts) || 0) + 1;
  const retryable = isRetryableHttpStatus(status);

  const updated = {
    ...item,
    attempts,
    lastAttemptAtMs: nowMs(),
    lastError: stringifyError(err),
    lastStatus: status || null
  };

  if (!retryable || attempts >= retryCfg.maxAttempts) {
    return { ...updated, dead: true, nextAttemptAtMs: nowMs() };
  }

  const delay = computeBackoffDelayMs(attempts, retryCfg);
  return { ...updated, nextAttemptAtMs: nowMs() + delay };
}

function markAttemptSuccess(item) {
  return {
    ...item,
    lastAttemptAtMs: nowMs(),
    lastError: null,
    lastStatus: item.lastStatus || null
  };
}

// PUBLIC_INTERFACE
export function getQueuedActions() {
  /** Return queued actions (oldest first). */
  const q = loadQueue();
  return q.slice().sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
}

// PUBLIC_INTERFACE
export function getQueueSummary() {
  /**
   * Returns a summary useful for UI:
   * - total: total queued (including dead)
   * - pending: eligible or waiting for retry (not dead)
   * - dead: maxed out / non-retryable failures
   * - nextRetryAtMs: earliest nextAttemptAtMs for pending items that are not eligible now
   */
  const q = getQueuedActions();
  const pending = q.filter((x) => !x.dead);
  const dead = q.filter((x) => x.dead);
  const nextRetryAtMs = pending.reduce((min, item) => {
    const t = Number(item.nextAttemptAtMs) || 0;
    if (!t) return min;
    return min == null ? t : Math.min(min, t);
  }, null);

  return { total: q.length, pending: pending.length, dead: dead.length, nextRetryAtMs };
}

// PUBLIC_INTERFACE
export function getQueuedActionsCount() {
  /** Convenience for UI badges (all items, including dead). */
  return getQueuedActions().length;
}

// PUBLIC_INTERFACE
export function getPendingQueuedActionsCount() {
  /** Count of items that are not dead (will retry). */
  return getQueuedActions().filter((x) => !x.dead).length;
}

// PUBLIC_INTERFACE
export function clearQueuedActions() {
  /** Clear the offline queue (debug / extreme recovery). */
  saveQueue([]);
}

// PUBLIC_INTERFACE
export function removeDeadQueuedActions() {
  /** Remove items that have permanently failed. */
  const q = getQueuedActions().filter((x) => !x.dead);
  saveQueue(q);
  return q.length;
}

// PUBLIC_INTERFACE
export function enqueueHabitCheckin({ habitId, checkin_date, value = null, note = null }) {
  /**
   * Enqueue a habit check-in for later sync.
   * This should be used when the app is offline or when the caller wants to ensure eventual sync.
   */
  const item = normalizeItem({
    id: uid("checkin"),
    type: "habit_checkin",
    habitId: String(habitId),
    checkin_date: String(checkin_date),
    value: value == null ? null : Number(value),
    note: note == null ? null : String(note),
    createdAtMs: nowMs()
  });

  const queue = compactQueue([...loadQueue(), item]);
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
  const item = normalizeItem({
    id: uid("feedpost"),
    type: "feed_post_create",
    group_id: group_id == null ? null : String(group_id),
    post_type: post_type === "achievement" ? "achievement" : "text",
    content: content == null ? null : String(content),
    data: data == null ? null : data,
    tags: cleanedTags,
    // Stable id for compaction; also used as a best-effort idempotency key client-side
    clientPostId: uid("clientpost"),
    createdAtMs: nowMs()
  });

  const queue = compactQueue([...loadQueue(), item]);
  saveQueue(queue);
  return item;
}

// PUBLIC_INTERFACE
export function enqueueFeedReactionToggle({ postId, reactionKey, toReacted }) {
  /**
   * Enqueue a reaction toggle action for later sync.
   * Callers should apply an optimistic UI update immediately (demoStore does this).
   */
  const item = normalizeItem({
    id: uid("react"),
    type: "feed_reaction_toggle",
    postId: String(postId),
    reactionKey: String(reactionKey),
    toReacted: Boolean(toReacted),
    createdAtMs: nowMs()
  });

  const queue = compactQueue([...loadQueue(), item]);
  saveQueue(queue);
  return item;
}

// PUBLIC_INTERFACE
export async function syncQueuedActions({ onProgress, retryCfg } = {}) {
  /**
   * Flush queued actions to backend (or demo fallback).
   *
   * Behavior:
   * - FIFO order
   * - Skips items not yet eligible (nextAttemptAtMs in the future)
   * - On a failure, marks the item for retry with exponential backoff and stops the loop
   *   (prevents hammering / preserves order where it matters)
   * - Dead items remain in queue but are skipped
   *
   * @param {Object} opts
   * @param {(info: {remaining: number, sent: number, lastResult?: any, queueSummary?: any}) => void} [opts.onProgress]
   * @param {{baseDelayMs?:number,maxDelayMs?:number,jitterRatio?:number,maxAttempts?:number}} [opts.retryCfg]
   * @returns {Promise<{sent:number, remaining:number, results:Array, summary: any}>}
   */
  const cfg = { ...DEFAULT_RETRY, ...(retryCfg || {}) };

  if (isOfflineNow()) {
    const summary = getQueueSummary();
    return { sent: 0, remaining: summary.total, results: [], summary };
  }

  let queue = getQueuedActions();
  queue = compactQueue(queue);

  const results = [];
  let sent = 0;

  // Persist compaction result immediately (helps duplicate resolution even if sync aborts).
  saveQueue(queue);

  while (queue.length > 0) {
    const item = normalizeItem(queue[0]);

    // Skip dead-letter items; keep them for inspection/removal.
    if (item.dead) {
      queue = queue.slice(1);
      // Do not remove dead items here; they remain in storage.
      // But we must advance the loop; to avoid rewriting storage many times,
      // just continue and rewrite at end.
      continue;
    }

    // Skip until nextAttemptAt if needed.
    if (!shouldAttemptNow(item)) break;

    let res;
    try {
      res = await sendItem(item);
    } catch (e) {
      res = { ok: false, error: e };
    }

    results.push({ itemId: item.id, type: item.type, ...res });

    if (res.ok) {
      // Remove item from queue (success).
      const remainingQueue = queue.slice(1);
      queue = remainingQueue;
      saveQueue(queue);
      sent += 1;
      if (onProgress) onProgress({ remaining: queue.length, sent, lastResult: res, queueSummary: getQueueSummary() });
      continue;
    }

    // Failure: update retry state for this head item and stop.
    const status = res?.status || res?.error?.status || item.lastStatus || null;
    const updatedItem = markAttemptFailure(item, res?.error, status, cfg);

    queue = [updatedItem, ...queue.slice(1)];
    saveQueue(queue);

    if (isOfflineNow()) break;
    break;
  }

  const summary = getQueueSummary();
  return { sent, remaining: summary.total, results, summary };
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
