import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function ChallengesPage() {
  /** Challenges: create, join, and track progress (demo). */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const challenges = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listChallenges();
  }, [refresh]);

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    goal_type: "streak",
    goal_value: 7,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Create a challenge</h2>
            <p className="card-subtitle">Sprints, streaks, and shared goals</p>
          </div>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <FormField label="Title">
              <input
                className="input"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g., 14-Day Reading Streak"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                className="textarea"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What’s the goal?"
              />
            </FormField>

            <div className="grid cols-2" style={{ gap: 12 }}>
              <FormField label="Goal type">
                <select
                  className="select"
                  value={draft.goal_type}
                  onChange={(e) => setDraft((d) => ({ ...d, goal_type: e.target.value }))}
                >
                  <option value="streak">Streak</option>
                  <option value="value">Value</option>
                </select>
              </FormField>

              <FormField label="Goal value">
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={draft.goal_value}
                  onChange={(e) => setDraft((d) => ({ ...d, goal_value: Number(e.target.value) }))}
                />
              </FormField>
            </div>

            <div className="grid cols-2" style={{ gap: 12 }}>
              <FormField label="Start date">
                <input
                  className="input"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                />
              </FormField>

              <FormField label="End date">
                <input
                  className="input"
                  type="date"
                  value={draft.endDate}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                />
              </FormField>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                demoApi.createChallenge(draft);
                setDraft((d) => ({ ...d, title: "", description: "" }));
                ui.showToast("Challenge created (demo)");
                setRefresh((x) => x + 1);
              }}
            >
              Create challenge
            </button>

            <div className="notice">
              Demo: joining and progress tracking is local. Later this will map to <code>/challenges</code> and <code>/challenges/:id/join</code>.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Browse challenges</h2>
            <p className="card-subtitle">Join one and track progress</p>
          </div>
          <span className="pill">{challenges.length} total</span>
        </div>
        <div className="card-body">
          <div className="list">
            {challenges.map((c) => {
              const my = demoApi.getMyChallengeProgress(c.id);
              const joined = Boolean(my);
              const daysCompleted = my?.progress?.daysCompleted || 0;
              const goal = c.goal_value || 0;
              const pct = goal > 0 ? Math.round((daysCompleted / goal) * 100) : 0;

              return (
                <div key={c.id} className="list-item">
                  <div style={{ maxWidth: "74%" }}>
                    <h3 style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {c.title} {c.isActive ? <span className="pill">Active</span> : <span className="pill">Ended</span>}
                    </h3>
                    <p>{c.description || "—"}</p>
                    <p style={{ marginTop: 6 }}>
                      Goal: <strong>{c.goal_type}</strong> • Value: <strong>{c.goal_value ?? "—"}</strong> • Participants:{" "}
                      <strong>{c.participants || 0}</strong>
                    </p>
                    {joined ? (
                      <p style={{ marginTop: 6 }}>
                        Your progress: <strong>{daysCompleted}</strong> / <strong>{goal}</strong> ({pct}%)
                      </p>
                    ) : null}
                  </div>

                  <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                    {!joined ? (
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => {
                          demoApi.joinChallenge(c.id);
                          ui.showToast("Joined challenge (demo)");
                          setRefresh((x) => x + 1);
                        }}
                      >
                        Join
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => {
                            demoApi.updateMyChallengeProgress(c.id, { daysCompleted: daysCompleted + 1 });
                            ui.showToast("Progress saved (demo)");
                            setRefresh((x) => x + 1);
                          }}
                        >
                          +1 day
                        </button>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => {
                            // Demo "reset": set to 0
                            demoApi.updateMyChallengeProgress(c.id, { daysCompleted: 0 });
                            ui.showToast("Progress reset (demo)");
                            setRefresh((x) => x + 1);
                          }}
                        >
                          Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {challenges.length === 0 ? <div className="notice">No challenges yet.</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
