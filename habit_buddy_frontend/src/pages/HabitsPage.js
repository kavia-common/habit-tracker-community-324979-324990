import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function HabitsPage() {
  /** Habits list with create/edit/delete and daily check-in. */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const habits = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listHabits();
  }, [refresh]);

  const [draft, setDraft] = useState({ title: "", description: "", schedule: "daily", target: 1 });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Create a habit</h2>
            <p className="card-subtitle">Small, clear, repeatable</p>
          </div>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <FormField label="Title">
              <input
                className="input"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g., Drink water"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                className="textarea"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={3}
                placeholder="e.g., 8 glasses"
              />
            </FormField>

            <FormField label="Schedule">
              <select
                className="select"
                value={draft.schedule}
                onChange={(e) => setDraft((d) => ({ ...d, schedule: e.target.value }))}
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="custom">Custom</option>
              </select>
            </FormField>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                demoApi.createHabit(draft);
                setDraft({ title: "", description: "", schedule: "daily", target: 1 });
                ui.showToast("Habit created");
                setRefresh((x) => x + 1);
              }}
            >
              Create habit
            </button>

            <div className="notice">
              Habits CRUD and check-ins are wired to a demo store until backend endpoints are available.
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Your habits</h2>
            <p className="card-subtitle">Check in to build streaks</p>
          </div>
          <span className="pill">{habits.length} total</span>
        </div>
        <div className="card-body">
          <div className="list">
            {habits.length === 0 ? <div className="notice">No habits yet. Create one!</div> : null}
            {habits.map((h) => {
              const checked = h.lastCheckIn === today;
              return (
                <div key={h.id} className="list-item">
                  <div>
                    <h3 style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {h.title} {checked ? <span className="pill">Checked today</span> : null}
                    </h3>
                    <p>{h.description || "—"}</p>
                    <p style={{ marginTop: 6 }}>
                      Streak: <strong>{h.streak || 0}</strong>
                    </p>
                  </div>
                  <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className={`btn btn-small ${checked ? "" : "btn-primary"}`}
                      onClick={() => {
                        demoApi.checkInHabit(h.id);
                        ui.showToast(checked ? "Already checked in today" : "Check-in saved");
                        setRefresh((x) => x + 1);
                      }}
                    >
                      {checked ? "Checked" : "Check-in"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => {
                        const nextTitle = window.prompt("Edit habit title:", h.title);
                        if (nextTitle == null) return;
                        demoApi.updateHabit(h.id, { title: nextTitle });
                        ui.showToast("Updated");
                        setRefresh((x) => x + 1);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => {
                        if (!window.confirm("Delete this habit?")) return;
                        demoApi.deleteHabit(h.id);
                        ui.showToast("Deleted");
                        setRefresh((x) => x + 1);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
