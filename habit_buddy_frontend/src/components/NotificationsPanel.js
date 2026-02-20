import React, { useMemo } from "react";
import { demoApi } from "../api/demoStore";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function NotificationsPanel() {
  /** Slide-over panel showing notifications. */
  const ui = useUI();
  const notifications = useMemo(() => demoApi.listNotifications(), [ui.notifOpen]); // re-evaluate when opening

  if (!ui.notifOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notifications panel"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17, 24, 39, 0.35)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end"
      }}
      onClick={() => ui.closeNotifications()}
    >
      <div
        className="card"
        style={{
          width: "min(420px, 92vw)",
          height: "100%",
          borderRadius: "0",
          borderLeft: "1px solid var(--border)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ fontSize: 14 }}>
              Notifications
            </h2>
            <p className="card-subtitle">Reminders and group activity</p>
          </div>
          <div className="row">
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                demoApi.markAllNotificationsRead();
                ui.showToast("Marked all as read");
              }}
            >
              Mark all read
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => ui.closeNotifications()}>
              Close
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="list">
            {notifications.length === 0 ? (
              <div className="notice">No notifications.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="list-item" style={{ alignItems: "center" }}>
                  <div>
                    <h3 style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {n.title} {!n.read ? <span className="pill">New</span> : null}
                    </h3>
                    <p>{n.body}</p>
                    <p style={{ marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.read ? (
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => {
                        demoApi.markNotificationRead(n.id);
                        ui.showToast("Marked as read");
                      }}
                    >
                      Read
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
