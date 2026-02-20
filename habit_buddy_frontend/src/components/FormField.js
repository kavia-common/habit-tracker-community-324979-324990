import React from "react";

/** PUBLIC_INTERFACE */
export default function FormField({ label, help, children }) {
  /** Wrapper to align labels/inputs consistently. */
  return (
    <div>
      {label ? <label className="label">{label}</label> : null}
      {children}
      {help ? <div className="help">{help}</div> : null}
    </div>
  );
}
