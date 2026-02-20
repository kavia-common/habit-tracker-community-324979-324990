import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

/** PUBLIC_INTERFACE */
export default function RegisterPage() {
  /** Registration page. Creates a demo account and logs in. */
  const auth = useAuth();
  const ui = useUI();
  const navigate = useNavigate();

  const [name, setName] = useState("Alex");
  const [email, setEmail] = useState("alex@example.com");
  const [password, setPassword] = useState("password");

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="card-header">
          <div>
            <h1 className="card-title" style={{ fontSize: 18 }}>
              Create your account
            </h1>
            <p className="card-subtitle">Start tracking habits and join challenges.</p>
          </div>
          <button type="button" className="btn btn-small" onClick={() => ui.toggleTheme()}>
            {ui.theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
        <div className="card-body">
          <div className="grid" style={{ gap: 12 }}>
            <FormField label="Name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </FormField>
            <FormField label="Email">
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </FormField>
            <FormField label="Password" help="Use at least 8 characters (demo only).">
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </FormField>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                // Demo register -> issue demo token
                const demoToken = `demo.${btoa(`${name}:${email}`)}.${Date.now()}`;
                auth.loginWithToken(demoToken);
                ui.showToast("Account created");
                navigate("/app/dashboard");
              }}
            >
              Create account
            </button>

            <div className="row between">
              <span style={{ color: "var(--muted)", fontSize: 12 }}>Already have an account?</span>
              <Link className="btn btn-small" to="/login">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
