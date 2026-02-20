import React from "react";
import { Link } from "react-router-dom";

/** PUBLIC_INTERFACE */
export default function NotFoundPage() {
  /** 404 page. */
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Page not found</h2>
          <p className="card-subtitle">The page you requested doesn’t exist.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="row wrap">
          <Link className="btn btn-primary" to="/app/dashboard">
            Go to dashboard
          </Link>
          <Link className="btn" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
