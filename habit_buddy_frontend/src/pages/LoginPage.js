import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function LoginPage() {
  /** Login page. Stores token and redirects to app. */
  const auth = useAuth();
  const ui = useUI();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/app/dashboard";

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="card-header">
          <div>
            <h1 className="card-title" style={{ fontSize: 18 }}>
              Welcome back
            </h1>
            <p className="card-subtitle">Login to continue tracking habits with friends.</p>
          </div>
          <button type="button" className="btn btn-small" onClick={() => ui.toggleTheme()}>
            {ui.theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <FormField label="Email">
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </FormField>
            <FormField label="Password">
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </FormField>

            <button
              type="button"
              className="btn btn-primary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  // Placeholder auth: backend auth endpoints not available in OpenAPI spec yet.
                  // We'll store a demo token to enable app navigation.
                  const demoToken = `demo.${btoa(email)}.${Date.now()}`;
                  auth.loginWithToken(demoToken);
                  ui.showToast("Logged in");
                  navigate(from, { replace: true });
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="notice">
              Backend API spec currently exposes only <code>GET /</code>. This login uses a demo token until backend auth is implemented.
            </div>

            <div className="row between">
              <span style={{ color: "var(--muted)", fontSize: 12 }}>New here?</span>
              <Link className="btn btn-small" to="/register">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
