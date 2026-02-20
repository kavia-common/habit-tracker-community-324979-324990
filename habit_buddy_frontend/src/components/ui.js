import React from "react";

/** PUBLIC_INTERFACE */
export function PageHeader({ title, subtitle, actions }) {
  /** Standard page header row with optional actions, used for visual consistency across pages. */
  return (
    <div className="page-header">
      <div className="page-header__title">
        <h2 className="page-title">{title}</h2>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}

/** PUBLIC_INTERFACE */
export function Section({ title, subtitle, right, children }) {
  /** Lightweight section wrapper to align headings and right-side actions inside cards. */
  return (
    <div className="section">
      {(title || subtitle || right) && (
        <div className="section__header">
          <div>
            {title ? <div className="section__title">{title}</div> : null}
            {subtitle ? <div className="section__subtitle">{subtitle}</div> : null}
          </div>
          {right ? <div className="section__right">{right}</div> : null}
        </div>
      )}
      <div className="section__body">{children}</div>
    </div>
  );
}

/** PUBLIC_INTERFACE */
export function EmptyState({ title, description, action }) {
  /** Standard empty state with optional action. */
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state__icon" aria-hidden="true">
        ⎯
      </div>
      <div className="empty-state__content">
        <div className="empty-state__title">{title}</div>
        {description ? <div className="empty-state__description">{description}</div> : null}
      </div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

/** PUBLIC_INTERFACE */
export function Skeleton({ lines = 3 }) {
  /** Simple skeleton loader for cards/lists (demo-friendly). */
  const arr = Array.from({ length: Math.max(1, Math.min(lines, 8)) });
  return (
    <div className="skeleton" aria-hidden="true">
      {arr.map((_, idx) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={idx} className="skeleton__line" />
      ))}
    </div>
  );
}
