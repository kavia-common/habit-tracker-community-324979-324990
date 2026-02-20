import React, { useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { demoApi } from "../api/demoStore";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import NotificationsPanel from "./NotificationsPanel";
import OfflineIndicator from "./OfflineIndicator";

function usePageTitle() {
  const location = useLocation();
  return useMemo(() => {
    const path = location.pathname || "/";
    if (path.startsWith("/app/dashboard")) return "Dashboard";
    if (path.startsWith("/app/analytics")) return "Analytics";
    if (path.startsWith("/app/habits")) return "Habits";
    if (path.startsWith("/app/social")) return "Social";
    if (path.startsWith("/app/groups")) return "Groups";
    if (path.startsWith("/app/challenges")) return "Challenges";
    if (path.startsWith("/app/reminders")) return "Reminders";
    if (path.startsWith("/app/personalization")) return "Personalization";
    if (path.startsWith("/app/power")) return "Power Features";
    if (path.startsWith("/app/admin")) return "Admin";
    if (path.startsWith("/app/feed")) return "Community Feed";
    if (path.startsWith("/app/settings")) return "Settings";
    return "Habit Buddy";
  }, [location.pathname]);
}

/** PUBLIC_INTERFACE */
export default function AppShell() {
  /** Main authenticated layout with sidebar/topbar and outlet content area. */
  const title = usePageTitle();
  const auth = useAuth();
  const ui = useUI();
  const navigate = useNavigate();

  const me = demoApi.getMe();
  const unreadCount = demoApi.listNotifications().filter((n) => !n.read).length;

  return (
    <div className="app-root">
      <div className="shell">
        <aside className="sidebar" aria-label="Sidebar Navigation">
          <div className="sidebar-inner">
            <div className="brand" role="banner">
              <div className="brand-mark" aria-hidden="true" />
              <div className="brand-title">
                <strong>Habit Buddy</strong>
                <span>Social habit tracking</span>
              </div>
            </div>

            <nav className="nav" aria-label="Primary">
              <NavLink to="/app/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  D
                </div>
                <div className="nav-label">
                  <span>Dashboard</span>
                  <small>Streaks, badges</small>
                </div>
              </NavLink>

              <NavLink to="/app/analytics" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  📈
                </div>
                <div className="nav-label">
                  <span>Analytics</span>
                  <small>Heatmap & trends</small>
                </div>
              </NavLink>

              <NavLink to="/app/habits" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  H
                </div>
                <div className="nav-label">
                  <span>Habits</span>
                  <small>Upgrades + check-ins</small>
                </div>
              </NavLink>

              <NavLink to="/app/social" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  S
                </div>
                <div className="nav-label">
                  <span>Social</span>
                  <small>Friends, badges</small>
                </div>
              </NavLink>

              <NavLink to="/app/groups" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  G
                </div>
                <div className="nav-label">
                  <span>Groups</span>
                  <small>Teams & invites</small>
                </div>
              </NavLink>

              <NavLink to="/app/challenges" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  C
                </div>
                <div className="nav-label">
                  <span>Challenges</span>
                  <small>Sprints & progress</small>
                </div>
              </NavLink>

              <NavLink to="/app/reminders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  R
                </div>
                <div className="nav-label">
                  <span>Reminders</span>
                  <small>Schedules & pings</small>
                </div>
              </NavLink>

              <NavLink to="/app/personalization" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  P
                </div>
                <div className="nav-label">
                  <span>Personalize</span>
                  <small>Layout & style</small>
                </div>
              </NavLink>

              <NavLink to="/app/power" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  ⚡
                </div>
                <div className="nav-label">
                  <span>Power</span>
                  <small>Templates & export</small>
                </div>
              </NavLink>

              <NavLink to="/app/admin" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  A
                </div>
                <div className="nav-label">
                  <span>Admin</span>
                  <small>Moderation</small>
                </div>
              </NavLink>

              <NavLink to="/app/feed" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  F
                </div>
                <div className="nav-label">
                  <span>Feed</span>
                  <small>Posts & tips</small>
                </div>
              </NavLink>

              <NavLink to="/app/settings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <div className="nav-icon" aria-hidden="true">
                  ⚙
                </div>
                <div className="nav-label">
                  <span>Settings</span>
                  <small>Profile, theme</small>
                </div>
              </NavLink>
            </nav>

            <div className="sidebar-footer">
              <div className="row between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{me.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{me.email}</div>
                </div>
                <span className="pill">Streaks</span>
              </div>

              <div className="row wrap">
                <button type="button" className="btn btn-small" onClick={() => ui.toggleTheme()}>
                  Theme: {ui.theme === "light" ? "Light" : "Dark"}
                </button>

                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => ui.openNotifications()}
                  aria-label="Open notifications panel"
                >
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
                </button>

                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => {
                    auth.logout();
                    navigate("/login");
                  }}
                >
                  Logout
                </button>
              </div>

              <div className="notice warn">
                Backend OpenAPI currently only exposes <code>GET /</code>. UI runs with demo data until full APIs are available.
              </div>
            </div>
          </div>
        </aside>

        <main className="main" role="main">
          <header className="topbar" role="banner">
            <h1>{title}</h1>
            <div className="spacer" />
            <div style={{ minWidth: 220 }}>
              <OfflineIndicator />
            </div>
            <button type="button" className="btn btn-small" onClick={() => navigate("/app/habits")}>
              Quick: Check-in
            </button>
            <button type="button" className="btn btn-small btn-primary" onClick={() => navigate("/app/feed")}>
              Share update
            </button>
          </header>

          <div className="page">
            <div className="container">
              <Outlet />
            </div>
          </div>
        </main>

        <NotificationsPanel />
      </div>
    </div>
  );
}
