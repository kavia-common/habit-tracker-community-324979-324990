import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function GroupsPage() {
  /** Groups view: create, join by invite code, and browse. */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const groups = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listGroups();
  }, [refresh]);

  const challenges = useMemo(() => demoApi.listChallenges(), []);

  const [draft, setDraft] = useState({ name: "", description: "" });
  const [inviteCode, setInviteCode] = useState("");

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Create a group</h2>
            <p className="card-subtitle">Accountability with friends</p>
          </div>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <FormField label="Group name">
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g., Morning Momentum"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                className="textarea"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What’s this group about?"
              />
            </FormField>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                demoApi.createGroup(draft);
                setDraft({ name: "", description: "" });
                ui.showToast("Group created");
                setRefresh((x) => x + 1);
              }}
            >
              Create group
            </button>

            <div className="notice">Demo: groups are stored locally. Invite codes can be used below to “join”.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Join a group</h2>
            <p className="card-subtitle">Use an invite code</p>
          </div>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <FormField label="Invite code" help="Try: MOMENTUM">
              <div className="row">
                <input
                  className="input"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="e.g., MOMENTUM"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!inviteCode.trim()}
                  onClick={() => {
                    const res = demoApi.joinGroupByInvite(inviteCode);
                    if (res.ok) ui.showToast(res.message);
                    else ui.showToast(res.message || "Could not join");
                    setInviteCode("");
                    setRefresh((x) => x + 1);
                  }}
                >
                  Join
                </button>
              </div>
            </FormField>

            <div className="notice">
              Later this would map to <code>/groups/:id/join</code> (or invite-code endpoints). For demo, joining may create a placeholder group.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Your groups</h2>
            <p className="card-subtitle">Invite friends and stay consistent</p>
          </div>
          <span className="pill">{groups.length} groups</span>
        </div>
        <div className="card-body">
          <div className="list">
            {groups.map((g) => (
              <div key={g.id} className="list-item">
                <div>
                  <h3 style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {g.name} {g.isPrivate ? <span className="pill">Private</span> : <span className="pill">Public</span>}
                  </h3>
                  <p>{g.description || "—"}</p>
                  <p style={{ marginTop: 6 }}>
                    Members: <strong>{g.members}</strong> • Invite: <strong>{g.inviteCode || "—"}</strong>
                  </p>
                </div>
                <div className="row wrap">
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => {
                      navigator.clipboard?.writeText(g.inviteCode || "");
                      ui.showToast("Invite code copied (demo)");
                    }}
                  >
                    Copy invite
                  </button>
                  <button type="button" className="btn btn-small btn-primary" onClick={() => ui.showToast("Group chat coming soon (demo)")}>
                    Open
                  </button>
                </div>
              </div>
            ))}
            {groups.length === 0 ? <div className="notice">No groups yet.</div> : null}
          </div>
        </div>
      </div>

      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Active challenges</h2>
            <p className="card-subtitle">Group sprints and community events</p>
          </div>
        </div>
        <div className="card-body">
          <div className="list">
            {challenges.map((c) => (
              <div key={c.id} className="list-item">
                <div>
                  <h3>{c.title || c.name}</h3>
                  <p>{c.description}</p>
                  <p style={{ marginTop: 6 }}>
                    Participants: <strong>{c.participants}</strong>
                  </p>
                </div>
                <button type="button" className="btn btn-small btn-primary" onClick={() => ui.showToast("Challenge tracking available in Challenges tab")}>
                  Track
                </button>
              </div>
            ))}
            {challenges.length === 0 ? <div className="notice">No challenges yet.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
