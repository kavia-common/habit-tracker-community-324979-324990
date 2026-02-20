import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { EmptyState, PageHeader } from "../components/ui";
import { useUI } from "../context/UIContext";

const DOW = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" }
];

/** PUBLIC_INTERFACE */
export default function RemindersPage() {
  /** Reminders: per-habit reminder schedule (demo). */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const habits = useMemo(() => demoApi.listHabits(), []);
  const reminders = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listReminders();
  }, [refresh]);

  const [draft, setDraft] = useState({
    habitId: habits[0]?.id || "",
    time: "09:00",
    days: [1, 2, 3, 4, 5],
    enabled: true,
    message: "Quick check-in?"
  });

  const hasHabits = habits.length > 0;

  return (
    <div className="grid" style={{ gap: 12 }}>
      <PageHeader title="Reminders" subtitle="Gentle nudges for the habits you’re building." />

      <div className="grid cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Create reminder</h2>
              <p className="card-subtitle">Schedule a time and choose days</p>
            </div>
          </div>
          <div className="card-body">
            {!hasHabits ? (
              <EmptyState
                title="Create a habit first"
                description="Reminders attach to a habit. Add your first habit in the Habits page."
                action={
                  <button type="button" className="btn btn-small btn-primary" onClick={() => ui.showToast("Use the Habits tab to create a habit (demo)")}>
                    Go to Habits
                  </button>
                }
              />
            ) : (
              <div className="grid" style={{ gap: 12 }}>
                <FormField label="Habit">
                  <select className="select" value={draft.habitId} onChange={(e) => setDraft((d) => ({ ...d, habitId: e.target.value }))}>
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="grid cols-2" style={{ gap: 12 }}>
                  <FormField label="Time">
                    <input className="input" type="time" value={draft.time} onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))} />
                  </FormField>

                  <FormField label="Enabled">
                    <button type="button" className={`btn ${draft.enabled ? "btn-primary" : ""}`} onClick={() => setDraft((d) => ({ ...d, enabled: !d.enabled }))}>
                      {draft.enabled ? "On" : "Off"}
                    </button>
                  </FormField>
                </div>

                <FormField label="Days" help="Choose days of week (Mon–Sun).">
                  <div className="row wrap">
                    {DOW.map((d) => {
                      const on = draft.days.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          className={`btn btn-small ${on ? "btn-primary" : ""}`}
                          onClick={() =>
                            setDraft((x) => ({
                              ...x,
                              days: on ? x.days.filter((k) => k !== d.id) : [...x.days, d.id].sort((a, b) => a - b)
                            }))
                          }
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Message">
                  <input
                    className="input"
                    value={draft.message}
                    onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))}
                    placeholder="e.g., You’ve got this — quick check-in?"
                  />
                </FormField>

                <div className="row between">
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>Demo: saved locally.</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!draft.habitId}
                    onClick={() => {
                      demoApi.upsertReminder(draft);
                      ui.showToast("Reminder saved (demo)");
                      setRefresh((x) => x + 1);
                    }}
                  >
                    Save reminder
                  </button>
                </div>

                <div className="notice">
                  Tip: use “Ping now” below to push a reminder notification and see it in the notifications drawer.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Your reminders</h2>
              <p className="card-subtitle">Schedules and quick tests</p>
            </div>
            <span className="pill">{reminders.length} total</span>
          </div>
          <div className="card-body">
            <div className="list">
              {reminders.map((r) => {
                const habit = habits.find((h) => h.id === r.habitId);
                const label = habit?.title || "Unknown habit";
                return (
                  <div key={r.id} className="list-item">
                    <div>
                      <h3 style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        {label} {!r.enabled ? <span className="pill">Off</span> : <span className="pill">On</span>}
                      </h3>
                      <p>
                        Time: <strong>{r.time}</strong> • Days: <strong>{(r.days || []).join(", ")}</strong>
                      </p>
                      <p style={{ marginTop: 6 }}>{r.message}</p>
                    </div>
                    <div className="row wrap" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() => {
                          demoApi.upsertReminder({ ...r, enabled: !r.enabled });
                          ui.showToast(r.enabled ? "Disabled" : "Enabled");
                          setRefresh((x) => x + 1);
                        }}
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => {
                          demoApi.simulateReminderPing(r.habitId);
                          ui.showToast("Reminder sent (demo)");
                        }}
                      >
                        Ping now
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => {
                          if (!window.confirm("Delete this reminder?")) return;
                          demoApi.deleteReminder(r.id);
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
              {reminders.length === 0 ? (
                <EmptyState title="No reminders yet" description="Create your first reminder to get a nudge at the right time." />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
