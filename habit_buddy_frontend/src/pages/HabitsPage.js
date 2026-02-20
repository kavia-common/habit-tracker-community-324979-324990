import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function HabitsPage() {
  /** Habits list with upgraded fields + create/edit/delete and check-ins. */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const habits = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listHabits();
  }, [refresh]);

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    habit_type: "daily",
    target_value: 1,
    unit: "",
    reminder_time: "",
    is_public: false,
    color: "",
    icon: ""
  });

  const [checkinDraft, setCheckinDraft] = useState({ value: "", note: "" });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Create a habit</h2>
            <p className="card-subtitle">Upgrades: target, unit, reminders, and visibility</p>
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

            <div className="grid cols-2" style={{ gap: 12 }}>
              <FormField label="Habit type">
                <select
                  className="select"
                  value={draft.habit_type}
                  onChange={(e) => setDraft((d) => ({ ...d, habit_type: e.target.value }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="custom">Custom</option>
                </select>
              </FormField>

              <FormField label="Reminder time" help="Optional (demo).">
                <input
                  className="input"
                  type="time"
                  value={draft.reminder_time}
                  onChange={(e) => setDraft((d) => ({ ...d, reminder_time: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid cols-2" style={{ gap: 12 }}>
              <FormField label="Target value">
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={draft.target_value}
                  onChange={(e) => setDraft((d) => ({ ...d, target_value: Number(e.target.value) }))}
                />
              </FormField>

              <FormField label="Unit">
                <input
                  className="input"
                  value={draft.unit}
                  onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                  placeholder="e.g., glasses / min / reps"
                />
              </FormField>
            </div>

            <div className="grid cols-2" style={{ gap: 12 }}>
              <FormField label="Icon" help="Emoji is fine for demo UI.">
                <input className="input" value={draft.icon} onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))} placeholder="e.g., 💧" />
              </FormField>

              <FormField label="Color" help="Hex color (optional).">
                <input className="input" value={draft.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} placeholder="#3b82f6" />
              </FormField>
            </div>

            <div className="row between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Public habit</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Allow sharing to feed/groups (demo)</div>
              </div>
              <button type="button" className="btn btn-small" onClick={() => setDraft((d) => ({ ...d, is_public: !d.is_public }))}>
                {draft.is_public ? "On" : "Off"}
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                demoApi.createHabit(draft);
                setDraft({
                  title: "",
                  description: "",
                  habit_type: "daily",
                  target_value: 1,
                  unit: "",
                  reminder_time: "",
                  is_public: false,
                  color: "",
                  icon: ""
                });
                ui.showToast("Habit created");
                setRefresh((x) => x + 1);
              }}
            >
              Create habit
            </button>

            <div className="notice">
              Habit “upgrades” are stored in demo state. Later they map cleanly to backend habit fields (type/target/unit/reminder/public).
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
              const target = h.target_value ?? 1;
              const unit = h.unit ? ` ${h.unit}` : "";
              const badge = checked ? "Checked today" : "Not yet";
              const icon = h.icon ? `${h.icon} ` : "";

              return (
                <div key={h.id} className="list-item">
                  <div>
                    <h3 style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {icon}
                      {h.title} <span className="pill">{badge}</span>
                      {h.is_public ? <span className="pill">Public</span> : <span className="pill">Private</span>}
                    </h3>
                    <p>{h.description || "—"}</p>
                    <p style={{ marginTop: 6 }}>
                      Target: <strong>{target}</strong>
                      {unit} • Streak: <strong>{h.streak || 0}</strong> • Best: <strong>{h.longestStreak || 0}</strong>
                    </p>
                    {h.reminder_time ? (
                      <p style={{ marginTop: 6, color: "var(--muted)" }}>
                        Reminder: <strong>{h.reminder_time}</strong>
                      </p>
                    ) : null}
                  </div>

                  <div className="grid" style={{ gap: 8, minWidth: 220 }}>
                    <div className="row">
                      <input
                        className="input"
                        style={{ height: 34, padding: "6px 10px" }}
                        placeholder="Value (optional)"
                        value={checkinDraft.value}
                        onChange={(e) => setCheckinDraft((d) => ({ ...d, value: e.target.value }))}
                      />
                      <button
                        type="button"
                        className={`btn btn-small ${checked ? "" : "btn-primary"}`}
                        onClick={() => {
                          demoApi.checkInHabit(h.id, {
                            value: checkinDraft.value ? Number(checkinDraft.value) : null,
                            note: checkinDraft.note || null
                          });
                          ui.showToast(checked ? "Already checked in today (updated value/note)" : "Check-in saved");
                          setRefresh((x) => x + 1);
                        }}
                      >
                        {checked ? "Update" : "Check-in"}
                      </button>
                    </div>

                    <input
                      className="input"
                      style={{ height: 34, padding: "6px 10px" }}
                      placeholder="Note (optional)"
                      value={checkinDraft.note}
                      onChange={(e) => setCheckinDraft((d) => ({ ...d, note: e.target.value }))}
                    />

                    <div className="row wrap" style={{ justifyContent: "flex-end" }}>
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
                        className="btn btn-small"
                        onClick={() => {
                          demoApi.simulateReminderPing(h.id);
                          ui.showToast("Reminder pinged (demo)");
                        }}
                      >
                        Ping
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
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12 }} className="notice">
            Tip: add reminders per habit in the Reminders page. You can also “Ping” a habit here to generate a demo notification.
          </div>
        </div>
      </div>
    </div>
  );
}
