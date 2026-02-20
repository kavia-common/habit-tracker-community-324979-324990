import React, { useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function PowerFeaturesPage() {
  /** Power features: templates, automation hints, export (demo). */
  const ui = useUI();
  const [refresh, setRefresh] = useState(0);

  const templates = useMemo(() => demoApi.listTemplates(), []);
  const habitsCount = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    const _ = refresh;
    return demoApi.listHabits().length;
  }, [refresh]);

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Templates</h2>
            <p className="card-subtitle">Create multiple habits in one click</p>
          </div>
          <span className="pill">{habitsCount} habits</span>
        </div>
        <div className="card-body">
          <div className="list">
            {templates.map((t) => (
              <div key={t.id} className="list-item">
                <div>
                  <h3>{t.title}</h3>
                  <p>{t.habits.length} habits • {t.habits.join(" • ")}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-small btn-primary"
                  onClick={() => {
                    const res = demoApi.applyTemplate(t.id);
                    if (res.ok) {
                      ui.showToast(res.message);
                      setRefresh((x) => x + 1);
                    } else {
                      ui.showToast(res.message || "Failed");
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }} className="notice">
            Templates help you bootstrap routines quickly. Later: share templates with groups.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Export</h2>
            <p className="card-subtitle">Download your data (demo)</p>
          </div>
        </div>
        <div className="card-body">
          <div className="notice warn">
            Export is a demo-only client-side download. In production, exports should be generated securely server-side.
          </div>

          <div style={{ marginTop: 12 }} className="row wrap">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const payload = demoApi.exportData();
                const json = JSON.stringify(payload, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `habit-buddy-export-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                ui.showToast("Exported");
              }}
            >
              Download JSON
            </button>

            <button type="button" className="btn" onClick={() => ui.showToast("Automations coming soon (demo)")}>
              Automations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
