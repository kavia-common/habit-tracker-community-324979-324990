import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function GroupsPage() {
  /** Groups and challenges view. */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const groups = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listGroups();
  }, [refresh]);

  const challenges = useMemo(() => demoApi.listChallenges(), []);

  const [draft, setDraft] = useState({ name: "", description: "" });

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

            <div className="notice">
              Challenges, invites, and group membership will be wired to backend endpoints once available.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Your groups</h2>
            <p className="card-subtitle">Join a challenge and stay consistent</p>
          </div>
          <span className="pill">{groups.length} groups</span>
        </div>
        <div className="card-body">
          <div className="list">
            {groups.map((g) => (
              <div key={g.id} className="list-item">
                <div>
                  <h3>{g.name}</h3>
                  <p>{g.description || "—"}</p>
                  <p style={{ marginTop: 6 }}>
                    Members: <strong>{g.members}</strong>
                  </p>
                </div>
                <div className="row wrap">
                  <button type="button" className="btn btn-small" onClick={() => ui.showToast("Invite link copied (demo)")}>
                    Invite
                  </button>
                  <button type="button" className="btn btn-small btn-primary" onClick={() => ui.showToast("Challenge joined (demo)")}>
                    Join challenge
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
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <p style={{ marginTop: 6 }}>
                    Participants: <strong>{c.participants}</strong>
                  </p>
                </div>
                <button type="button" className="btn btn-small btn-primary" onClick={() => ui.showToast("Challenge progress saved (demo)")}>
                  Track
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
