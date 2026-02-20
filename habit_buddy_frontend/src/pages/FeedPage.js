import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import { EmptyState, PageHeader, Section } from "../components/ui";
import { useUI } from "../context/UIContext";
import { enqueueFeedPostCreate, enqueueFeedReactionToggle, syncQueuedActions } from "../offline/offlineQueue";
import { useOfflineSync } from "../offline/useOfflineSync";

const REACTIONS = [
  { key: "like", label: "Like", emoji: "👍" },
  { key: "celebrate", label: "Celebrate", emoji: "🎉" },
  { key: "support", label: "Support", emoji: "🤝" },
  { key: "insightful", label: "Insightful", emoji: "💡" }
];

function safeLower(s) {
  return String(s || "").toLowerCase();
}

function reactionTotal(post) {
  const r = post.reactions || {};
  return Object.values(r).reduce((sum, v) => sum + (Number(v?.count) || 0), 0);
}

/** PUBLIC_INTERFACE */
export default function FeedPage() {
  /** Community feed page: post achievements and tips with reactions, filters, and discovery (demo + offline queue). */
  const ui = useUI();
  const { isOnline } = useOfflineSync();
  const [refresh, setRefresh] = useState(0);

  // Composer
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // Filters / sort
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("all"); // "all" | tagId
  const [reactionFilter, setReactionFilter] = useState("any"); // "any" | reactionKey
  const [sortBy, setSortBy] = useState("new"); // new | top | discussed

  const { feed, discovery, availableTags } = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;

    const rawFeed = demoApi.listFeed();
    const disc = demoApi.listDiscovery();

    const tags = disc.tags || [];
    return { feed: rawFeed, discovery: disc, availableTags: tags };
  }, [refresh]);

  const filteredFeed = useMemo(() => {
    const q = safeLower(query.trim());

    let items = [...feed];

    if (q) {
      items = items.filter((p) => {
        const hay = `${p.author} ${p.content} ${(p.tags || []).join(" ")}`;
        return safeLower(hay).includes(q);
      });
    }

    if (activeTag !== "all") {
      items = items.filter((p) => (p.tags || []).includes(activeTag));
    }

    if (reactionFilter !== "any") {
      items = items.filter((p) => (p.reactions || {})[reactionFilter]?.count > 0);
    }

    if (sortBy === "new") {
      items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    } else if (sortBy === "top") {
      items.sort((a, b) => reactionTotal(b) - reactionTotal(a));
    } else if (sortBy === "discussed") {
      items.sort((a, b) => (b.comments || 0) - (a.comments || 0));
    }

    return items;
  }, [feed, query, activeTag, reactionFilter, sortBy]);

  const selectedTagSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  function toggleComposerTag(tagId) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return [...next].slice(0, 3);
    });
  }

  return (
    <div className="grid" style={{ gap: 12 }}>
      <PageHeader
        title="Community Feed"
        subtitle="Share wins, react with support, and discover groups & topics."
        actions={
          <div className="row wrap" style={{ justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                setQuery("");
                setActiveTag("all");
                setReactionFilter("any");
                setSortBy("new");
                ui.showToast("Filters cleared");
              }}
            >
              Clear
            </button>
            <a className="btn btn-small btn-primary" href="#share">
              Share
            </a>
          </div>
        }
      />

      {/* Two-column responsive layout using existing grid utilities */}
      <div className="grid cols-3" style={{ alignItems: "start" }}>
        <div className="grid" style={{ gridColumn: "span 2", gap: 12 }}>
          {/* Composer */}
          <div className="card" id="share">
            <div className="card-header">
              <div>
                <h2 className="card-title">Share an update</h2>
                <p className="card-subtitle">Celebrate wins, share tips, add a couple topics</p>
              </div>
            </div>
            <div className="card-body">
              <label className="label" htmlFor="feed-content">
                Update
              </label>
              <textarea
                id="feed-content"
                className="textarea"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What helped you today?"
              />

              <div className="row between" style={{ marginTop: 10, alignItems: "center" }}>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>
                  Tip: add up to 3 topics to help others find it.
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!content.trim()}
                  onClick={async () => {
                    const payload = {
                      content: content.trim(),
                      tags: selectedTags,
                      post_type: "text",
                      group_id: null,
                      data: null
                    };

                    // Optimistic UI: always update demo store immediately (works offline too).
                    demoApi.createPost(payload.content, { tags: payload.tags, postType: payload.post_type });

                    // Always enqueue for eventual sync (API + demo fallback handled during sync).
                    enqueueFeedPostCreate(payload);

                    setContent("");
                    setSelectedTags([]);
                    setRefresh((x) => x + 1);

                    if (!isOnline) {
                      ui.showToast("Offline — post queued for sync");
                      return;
                    }

                    // If online, attempt to flush right away.
                    const res = await syncQueuedActions();
                    if (res.sent > 0) ui.showToast("Posted + synced");
                    else ui.showToast("Posted (sync pending)");
                  }}
                >
                  Post
                </button>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="row wrap" style={{ gap: 8 }}>
                  {availableTags.slice(0, 8).map((t) => {
                    const pressed = selectedTagSet.has(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`btn btn-small ${pressed ? "btn-primary" : ""}`}
                        aria-pressed={pressed}
                        onClick={() => toggleComposerTag(t.id)}
                        title={`Tag: ${t.label}`}
                      >
                        <span aria-hidden="true">{t.emoji || "🏷️"}</span>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {selectedTags.length ? (
                  <div className="help">Selected: {selectedTags.join(", ")}</div>
                ) : (
                  <div className="help">No topics selected.</div>
                )}
              </div>
            </div>
          </div>

          {/* Filters + sort */}
          <div className="card">
            <div className="card-body">
              <div className="grid cols-3" style={{ gap: 10 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="label" htmlFor="feed-search">
                    Search
                  </label>
                  <input
                    id="feed-search"
                    className="input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search posts, authors, topics…"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="feed-sort">
                    Sort
                  </label>
                  <select id="feed-sort" className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="new">Newest</option>
                    <option value="top">Top reactions</option>
                    <option value="discussed">Most discussed</option>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="label" htmlFor="feed-tag">
                    Topic
                  </label>
                  <select
                    id="feed-tag"
                    className="select"
                    value={activeTag}
                    onChange={(e) => setActiveTag(e.target.value)}
                  >
                    <option value="all">All topics</option>
                    {availableTags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.emoji ? `${t.emoji} ` : ""}{t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="feed-reactfilter">
                    Filter by reaction
                  </label>
                  <select
                    id="feed-reactfilter"
                    className="select"
                    value={reactionFilter}
                    onChange={(e) => setReactionFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    {REACTIONS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.emoji} {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row wrap" style={{ marginTop: 10 }}>
                <span className="pill">Results {filteredFeed.length}</span>
                {activeTag !== "all" ? <span className="pill">Topic: {activeTag}</span> : null}
                {reactionFilter !== "any" ? <span className="pill">Has: {reactionFilter}</span> : null}
                {query.trim() ? <span className="pill">Query: “{query.trim()}”</span> : null}
              </div>
            </div>
          </div>

          {/* Feed list */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Latest posts</h2>
                <p className="card-subtitle">React, comment, and explore topics</p>
              </div>
            </div>
            <div className="card-body">
              <div className="list">
                {filteredFeed.map((p) => {
                  const tags = p.tags || [];
                  const reactions = p.reactions || {};
                  return (
                    <div key={p.id} className="list-item">
                      <div style={{ maxWidth: "100%" }}>
                        <h3 style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                          {p.author}
                          <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 12 }}>
                            {new Date(p.createdAt).toLocaleString()}
                          </span>
                        </h3>

                        <p style={{ whiteSpace: "pre-wrap" }}>{p.content}</p>

                        <div className="row wrap" style={{ marginTop: 8 }}>
                          <span className="pill">Reactions {reactionTotal(p)}</span>
                          <span className="pill">Comments {p.comments}</span>
                          {tags.length ? <span className="pill">Topics {tags.length}</span> : null}
                        </div>

                        {tags.length ? (
                          <div className="row wrap" style={{ marginTop: 10 }}>
                            {tags.map((t) => (
                              <button
                                key={`${p.id}_${t}`}
                                type="button"
                                className="btn btn-small"
                                onClick={() => setActiveTag(t)}
                                title={`Filter by ${t}`}
                              >
                                #{t}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid" style={{ gap: 10, minWidth: 220 }}>
                        <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                          {REACTIONS.map((r) => {
                            const state = reactions[r.key] || { count: 0, reactedByMe: false };
                            const active = Boolean(state.reactedByMe);
                            return (
                              <button
                                key={r.key}
                                type="button"
                                className={`btn btn-small ${active ? "btn-primary" : ""}`}
                                aria-pressed={active}
                                onClick={async () => {
                                  // Optimistic UI first
                                  const before = demoApi.listFeed().find((x) => x.id === p.id);
                                  const prevReacted = Boolean(before?.reactions?.[r.key]?.reactedByMe);

                                  demoApi.toggleReaction(p.id, r.key);
                                  setRefresh((x) => x + 1);

                                  // Queue desired final state (after toggle)
                                  enqueueFeedReactionToggle({ postId: p.id, reactionKey: r.key, toReacted: !prevReacted });

                                  if (!isOnline) {
                                    ui.showToast("Offline — reaction queued");
                                    return;
                                  }

                                  // Online: best-effort immediate sync
                                  await syncQueuedActions();
                                }}
                                title={`${r.label}`}
                              >
                                <span aria-hidden="true">{r.emoji}</span>
                                <span style={{ fontVariantNumeric: "tabular-nums" }}>{state.count || 0}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-small"
                            onClick={() => ui.showToast("Comments UI coming soon (demo)")}
                          >
                            Comment
                          </button>
                          <button
                            type="button"
                            className="btn btn-small btn-ghost"
                            onClick={() => {
                              navigator.clipboard?.writeText(p.content).catch(() => null);
                              ui.showToast("Copied");
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredFeed.length === 0 ? (
                  <EmptyState
                    title="No matching posts"
                    description="Try clearing filters or sharing a new update."
                    action={
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => {
                          setQuery("");
                          setActiveTag("all");
                          setReactionFilter("any");
                          setSortBy("new");
                        }}
                      >
                        Clear filters
                      </button>
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Discovery panel */}
        <div className="grid" style={{ gap: 12 }}>
          <div className="card">
            <div className="card-body">
              <Section
                title="Discover topics"
                subtitle="Jump into something you care about"
                right={
                  <button type="button" className="btn btn-small" onClick={() => setActiveTag("all")}>
                    View all
                  </button>
                }
              >
                <div className="row wrap" style={{ gap: 8 }}>
                  {availableTags.map((t) => {
                    const active = activeTag === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`btn btn-small ${active ? "btn-primary" : ""}`}
                        aria-pressed={active}
                        onClick={() => setActiveTag(t.id)}
                      >
                        <span aria-hidden="true">{t.emoji || "🏷️"}</span>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </Section>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <Section title="Suggested groups" subtitle="Find accountability that fits">
                <div className="list">
                  {(discovery.suggestedGroups || []).slice(0, 4).map((g) => (
                    <div key={g.id} className="list-item" style={{ padding: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {g.name}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{g.description}</div>
                        <div className="row wrap" style={{ marginTop: 8 }}>
                          <span className="pill">Members {g.members}</span>
                          {g.isPrivate ? <span className="pill">Private</span> : <span className="pill">Public</span>}
                        </div>
                      </div>
                      <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn btn-small btn-primary"
                          onClick={() => ui.showToast(`Open group “${g.name}” (demo)`)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <Section title="Suggested people" subtitle="Follow for more tips (demo)">
                <div className="list">
                  {(discovery.suggestedUsers || []).slice(0, 4).map((u) => (
                    <div key={u.id} className="list-item" style={{ padding: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 2 }}>{u.name}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{u.bio}</div>
                        <div className="row wrap" style={{ marginTop: 8 }}>
                          <span className="pill">Streak {u.streak}</span>
                        </div>
                      </div>
                      <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => ui.showToast(`Followed ${u.name} (demo)`)}
                        >
                          Follow
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
