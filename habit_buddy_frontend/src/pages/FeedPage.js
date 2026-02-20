import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import { EmptyState, PageHeader } from "../components/ui";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function FeedPage() {
  /** Community feed page: post achievements and tips. */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);
  const [content, setContent] = useState("");

  const feed = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listFeed();
  }, [refresh]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      <PageHeader
        title="Community Feed"
        subtitle="Share wins, learn what worked for others, and keep the vibe supportive."
        actions={
          <button type="button" className="btn btn-small" onClick={() => ui.showToast("Feed filters coming soon (demo)")}>
            Filter
          </button>
        }
      />

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Share an update</h2>
            <p className="card-subtitle">Celebrate wins and share tips</p>
          </div>
        </div>
        <div className="card-body">
          <textarea className="textarea" rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="What helped you today?" />
          <div className="row between" style={{ marginTop: 10, alignItems: "center" }}>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Be kind. Be constructive.</span>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!content.trim()}
              onClick={() => {
                demoApi.createPost(content);
                setContent("");
                ui.showToast("Posted");
                setRefresh((x) => x + 1);
              }}
            >
              Post
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Latest posts</h2>
            <p className="card-subtitle">New from the community</p>
          </div>
        </div>
        <div className="card-body">
          <div className="list">
            {feed.map((p) => (
              <div key={p.id} className="list-item">
                <div style={{ maxWidth: "100%" }}>
                  <h3 style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    {p.author}
                    <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</span>
                  </h3>
                  <p style={{ whiteSpace: "pre-wrap" }}>{p.content}</p>
                  <div className="row wrap" style={{ marginTop: 8 }}>
                    <span className="pill">Likes {p.likes}</span>
                    <span className="pill">Comments {p.comments}</span>
                    {p.likedByMe ? <span className="pill">You liked</span> : null}
                  </div>
                </div>
                <div className="row wrap">
                  <button
                    type="button"
                    className={`btn btn-small ${p.likedByMe ? "btn-primary" : ""}`}
                    onClick={() => {
                      demoApi.toggleLikePost(p.id);
                      setRefresh((x) => x + 1);
                    }}
                  >
                    {p.likedByMe ? "Liked" : "Like"}
                  </button>
                  <button type="button" className="btn btn-small" onClick={() => ui.showToast("Comments coming soon (demo)")}>
                    Comment
                  </button>
                </div>
              </div>
            ))}
            {feed.length === 0 ? (
              <EmptyState title="No posts yet" description="Share your first update above to start the conversation." />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
