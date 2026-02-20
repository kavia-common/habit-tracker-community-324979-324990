import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { EmptyState, PageHeader, Section } from "../components/ui";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function AdminPage() {
  /** Admin (demo): announcements + moderation queue + stats. */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const admin = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.getAdminOverview();
  }, [refresh]);

  const enabled = demoApi.isAdminEnabled();
  const [draft, setDraft] = useState({ title: "", body: "" });

  if (!enabled) {
    return (
      <div className="grid" style={{ gap: 12 }}>
        <PageHeader title="Admin" subtitle="Moderation and announcements (demo-only)" />
        <div className="notice error">Admin mode is disabled in this demo store.</div>
      </div>
    );
  }

  const announcements = admin?.announcements || [];
  const moderationQueue = admin?.moderationQueue || [];

  return (
    <div className="grid" style={{ gap: 12 }}>
      <PageHeader title="Admin" subtitle="Demo-only tools. In production, protect this behind role-based access control." />

      <div className="grid cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Overview</h2>
              <p className="card-subtitle">High-level stats</p>
            </div>
          </div>
          <div className="card-body">
            <Section title="Platform stats" subtitle="Demo numbers from the client store.">
              <div className="grid cols-2" style={{ gap: 12 }}>
                <div className="notice">
                  <div style={{ fontWeight: 900 }}>Users</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{admin?.stats?.totalUsers ?? "—"}</div>
                </div>
                <div className="notice">
                  <div style={{ fontWeight: 900 }}>DAU</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{admin?.stats?.dailyActiveUsers ?? "—"}</div>
                </div>
                <div className="notice">
                  <div style={{ fontWeight: 900 }}>Habits</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{admin?.stats?.totalHabits ?? "—"}</div>
                </div>
                <div className="notice">
                  <div style={{ fontWeight: 900 }}>Groups</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{admin?.stats?.totalGroups ?? "—"}</div>
                </div>
              </div>

              <div className="notice warn">
                This page is intentionally frontend-only. In production, use audited admin APIs, RBAC, and server-side logging.
              </div>
            </Section>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Announcement</h2>
              <p className="card-subtitle">Broadcast message to users (demo)</p>
            </div>
          </div>
          <div className="card-body">
            <div className="grid" style={{ gap: 12 }}>
              <FormField label="Title">
                <input className="input" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
              </FormField>
              <FormField label="Body">
                <textarea className="textarea" rows={4} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
              </FormField>

              <div className="row between">
                <span style={{ color: "var(--muted)", fontSize: 12 }}>Keep it short and actionable.</span>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!draft.title.trim()}
                  onClick={() => {
                    demoApi.createAnnouncement(draft);
                    setDraft({ title: "", body: "" });
                    ui.showToast("Announcement created (demo)");
                    setRefresh((x) => x + 1);
                  }}
                >
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Announcements</h2>
              <p className="card-subtitle">Toggle active/inactive</p>
            </div>
            <span className="pill">{announcements.length}</span>
          </div>
          <div className="card-body">
            <div className="list">
              {announcements.map((a) => (
                <div key={a.id} className="list-item">
                  <div>
                    <h3 style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      {a.title} {a.active ? <span className="pill">Active</span> : <span className="pill">Off</span>}
                    </h3>
                    <p style={{ whiteSpace: "pre-wrap" }}>{a.body || "—"}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => {
                      demoApi.toggleAnnouncement(a.id);
                      ui.showToast("Updated");
                      setRefresh((x) => x + 1);
                    }}
                  >
                    Toggle
                  </button>
                </div>
              ))}
              {announcements.length === 0 ? (
                <EmptyState title="No announcements" description="Publish one from the panel above to broadcast it to users (demo)." />
              ) : null}
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">Moderation queue</h2>
              <p className="card-subtitle">Review reported content (demo)</p>
            </div>
            <span className="pill">{moderationQueue.length}</span>
          </div>
          <div className="card-body">
            <div className="list">
              {moderationQueue.map((m) => (
                <div key={m.id} className="list-item">
                  <div style={{ maxWidth: "100%" }}>
                    <h3 style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      {m.type} <span className="pill">Reported</span>
                    </h3>
                    <p>Reason: {m.reason}</p>
                    <p style={{ marginTop: 6 }}>{m.contentPreview}</p>
                    <p style={{ marginTop: 6, color: "var(--muted)" }}>{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => {
                        demoApi.resolveModerationItem(m.id, "remove");
                        ui.showToast("Removed (demo)");
                        setRefresh((x) => x + 1);
                      }}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => {
                        demoApi.resolveModerationItem(m.id, "dismiss");
                        ui.showToast("Dismissed (demo)");
                        setRefresh((x) => x + 1);
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
              {moderationQueue.length === 0 ? (
                <EmptyState title="Nothing to review" description="When content is reported, it will appear here (demo)." />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
