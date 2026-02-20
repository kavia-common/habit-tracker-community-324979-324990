import React, { useEffect, useMemo, useState } from "react";
import { healthCheck } from "../api/client";
import { demoApi } from "../api/demoStore";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function DashboardPage() {
  /** Dashboard with streaks, badges placeholder, and quick insights. */
  const ui = useUI();
  const [apiStatus, setApiStatus] = useState({ ok: null, message: "" });

  const habits = useMemo(() => demoApi.listHabits(), []);
  const streakSum = habits.reduce((acc, h) => acc + (h.streak || 0), 0);
  const checkedToday = habits.filter((h) => h.lastCheckIn === new Date().toISOString().slice(0, 10)).length;

  useEffect(() => {
    (async () => {
      try {
        await healthCheck();
        setApiStatus({ ok: true, message: "Backend reachable" });
      } catch (e) {
        setApiStatus({ ok: false, message: "Backend not reachable via configured API base URL" });
      }
    })();
  }, []);

  return (
    <div className="grid cols-3">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Today</h2>
            <p className="card-subtitle">Daily progress snapshot</p>
          </div>
          <span className="pill">{checkedToday}/{habits.length} checked</span>
        </div>
        <div className="card-body">
          <div className="kpi">
            <strong>{Math.round((checkedToday / Math.max(habits.length, 1)) * 100)}%</strong>
            <span>Habits checked in today</span>
          </div>
          <div style={{ marginTop: 12 }} className="notice">
            Tip: Make the first step so small you can’t say no.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Streaks</h2>
            <p className="card-subtitle">Consistency over intensity</p>
          </div>
        </div>
        <div className="card-body">
          <div className="kpi">
            <strong>{streakSum}</strong>
            <span>Total streak days across habits</span>
          </div>
          <div style={{ marginTop: 12 }} className="row wrap">
            <span className="pill">Badge: Starter</span>
            <span className="pill">Badge: 3-day streak</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">System</h2>
            <p className="card-subtitle">API + reminders</p>
          </div>
        </div>
        <div className="card-body">
          <div className={`notice ${apiStatus.ok === false ? "error" : ""}`}>
            {apiStatus.ok === null ? "Checking backend..." : apiStatus.message}
          </div>
          <div style={{ marginTop: 12 }} className="row wrap">
            <button type="button" className="btn btn-small" onClick={() => ui.openNotifications()}>
              View notifications
            </button>
            <button type="button" className="btn btn-small btn-primary" onClick={() => ui.showToast("Nice. Keep going.")}>
              Motivation
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Your habits</h2>
            <p className="card-subtitle">Quick overview</p>
          </div>
        </div>
        <div className="card-body">
          <div className="list">
            {habits.map((h) => (
              <div key={h.id} className="list-item">
                <div>
                  <h3>{h.title}</h3>
                  <p>{h.description || "No description"}</p>
                  <p style={{ marginTop: 6 }}>
                    Streak: <strong>{h.streak || 0}</strong> • Last check-in:{" "}
                    <strong>{h.lastCheckIn ? h.lastCheckIn : "—"}</strong>
                  </p>
                </div>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => {
                      demoApi.checkInHabit(h.id);
                      ui.showToast("Checked in");
                      window.location.reload();
                    }}
                  >
                    Check-in
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
