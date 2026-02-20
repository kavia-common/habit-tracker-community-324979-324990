import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { PageHeader, Section } from "../components/ui";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function PersonalizationPage() {
  /** Personalization: preferences that shape the UI experience (demo). */
  const ui = useUI();
  const initial = useMemo(() => demoApi.getSettings(), []);
  const [prefs, setPrefs] = useState({
    weeklyGoalDays: initial.weeklyGoalDays ?? 5,
    motivationStyle: initial.motivationStyle || "encouraging",
    dashboardLayout: initial.dashboardLayout || "balanced",
    quietStart: initial.quietHours?.start || "22:00",
    quietEnd: initial.quietHours?.end || "07:00",
    reduceMotion: Boolean(initial.reduceMotion)
  });

  return (
    <div className="grid" style={{ gap: 12 }}>
      <PageHeader title="Personalization" subtitle="Tune Habit Buddy’s tone, layout, and accessibility preferences." />

      <div className="grid cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Preferences</h2>
              <p className="card-subtitle">Saved locally for demo</p>
            </div>
          </div>
          <div className="card-body">
            <div className="grid" style={{ gap: 12 }}>
              <FormField label="Motivation style" help="Changes how tips/messages are phrased (demo).">
                <select className="select" value={prefs.motivationStyle} onChange={(e) => setPrefs((p) => ({ ...p, motivationStyle: e.target.value }))}>
                  <option value="encouraging">Encouraging</option>
                  <option value="direct">Direct</option>
                  <option value="playful">Playful</option>
                </select>
              </FormField>

              <FormField label="Dashboard layout" help="Affects what you see first on the dashboard (demo).">
                <select className="select" value={prefs.dashboardLayout} onChange={(e) => setPrefs((p) => ({ ...p, dashboardLayout: e.target.value }))}>
                  <option value="balanced">Balanced</option>
                  <option value="habits-first">Habits first</option>
                  <option value="social-first">Social first</option>
                </select>
              </FormField>

              <FormField label="Weekly goal (days)" help="How many days you aim to check in each week.">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={7}
                  value={prefs.weeklyGoalDays}
                  onChange={(e) => setPrefs((p) => ({ ...p, weeklyGoalDays: Number(e.target.value) }))}
                />
              </FormField>

              <div className="grid cols-2" style={{ gap: 12 }}>
                <FormField label="Quiet hours start">
                  <input className="input" type="time" value={prefs.quietStart} onChange={(e) => setPrefs((p) => ({ ...p, quietStart: e.target.value }))} />
                </FormField>
                <FormField label="Quiet hours end">
                  <input className="input" type="time" value={prefs.quietEnd} onChange={(e) => setPrefs((p) => ({ ...p, quietEnd: e.target.value }))} />
                </FormField>
              </div>

              <div className="row between">
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Reduce motion</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>Accessibility preference (demo)</div>
                </div>
                <button type="button" className={`btn btn-small ${prefs.reduceMotion ? "btn-primary" : ""}`} onClick={() => setPrefs((p) => ({ ...p, reduceMotion: !p.reduceMotion }))}>
                  {prefs.reduceMotion ? "On" : "Off"}
                </button>
              </div>

              <div className="row between" style={{ alignItems: "center" }}>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>These settings currently persist locally.</span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    demoApi.updateSettings({
                      weeklyGoalDays: prefs.weeklyGoalDays,
                      motivationStyle: prefs.motivationStyle,
                      dashboardLayout: prefs.dashboardLayout,
                      quietHours: { start: prefs.quietStart, end: prefs.quietEnd },
                      reduceMotion: prefs.reduceMotion
                    });
                    ui.showToast("Personalization saved");
                  }}
                >
                  Save changes
                </button>
              </div>

              <div className="notice">Later they’ll be synced to server settings APIs.</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Preview</h2>
              <p className="card-subtitle">Example messages based on your style</p>
            </div>
          </div>
          <div className="card-body">
            <Section
              title="Message sample"
              subtitle="This is how Habit Buddy might speak to you."
              right={<span className="pill">Tone: {prefs.motivationStyle}</span>}
            >
              {prefs.motivationStyle === "encouraging" ? <div className="notice">You’re doing great — just one small step today.</div> : null}
              {prefs.motivationStyle === "direct" ? <div className="notice warn">Pick one habit. Do it now. Then you’re done.</div> : null}
              {prefs.motivationStyle === "playful" ? <div className="notice">Quest update: +1 check-in unlocks momentum.</div> : null}
            </Section>

            <div style={{ marginTop: 12 }} className="row wrap">
              <span className="pill">Layout: {prefs.dashboardLayout}</span>
              <span className="pill">Weekly goal: {prefs.weeklyGoalDays}/7</span>
              <span className="pill">
                Quiet: {prefs.quietStart}–{prefs.quietEnd}
              </span>
              {prefs.reduceMotion ? <span className="pill">Reduced motion</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
