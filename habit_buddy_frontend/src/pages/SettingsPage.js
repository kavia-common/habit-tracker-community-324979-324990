import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import FormField from "../components/FormField";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function SettingsPage() {
  /** Settings page: profile + preferences. */
  const ui = useUI();
  const me = useMemo(() => demoApi.getMe(), []);
  const settings = useMemo(() => demoApi.getSettings(), []);

  const [profile, setProfile] = useState({
    name: me.name || "",
    email: me.email || "",
    bio: me.bio || "",
    timezone: me.timezone || ""
  });

  const [prefs, setPrefs] = useState({
    reminders: Boolean(settings.reminders)
  });

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Profile</h2>
            <p className="card-subtitle">Your public identity in groups</p>
          </div>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <FormField label="Name">
              <input className="input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </FormField>

            <FormField label="Email">
              <input
                className="input"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
            </FormField>

            <FormField label="Bio">
              <textarea className="textarea" rows={4} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
            </FormField>

            <FormField label="Timezone">
              <input
                className="input"
                value={profile.timezone}
                onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
              />
            </FormField>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                demoApi.updateMe(profile);
                ui.showToast("Profile saved");
              }}
            >
              Save profile
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Preferences</h2>
            <p className="card-subtitle">Theme and reminders</p>
          </div>
          <span className="pill">Theme: {ui.theme}</span>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <div className="row between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Reminders</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Show reminder notifications (demo)</div>
              </div>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => setPrefs((p) => ({ ...p, reminders: !p.reminders }))}
              >
                {prefs.reminders ? "On" : "Off"}
              </button>
            </div>

            <div className="row between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Theme</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Light / Dark</div>
              </div>
              <button type="button" className="btn btn-small btn-primary" onClick={() => ui.toggleTheme()}>
                Toggle
              </button>
            </div>

            <button
              type="button"
              className="btn"
              onClick={() => {
                demoApi.updateSettings({ reminders: prefs.reminders });
                ui.showToast("Preferences saved");
              }}
            >
              Save preferences
            </button>

            <div className="notice">
              When backend settings APIs exist, these will be persisted server-side.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
