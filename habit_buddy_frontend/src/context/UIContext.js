import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { demoApi } from "../api/demoStore";

const UIContext = createContext(null);

/** PUBLIC_INTERFACE */
export function UIProvider({ children }) {
  /** Provides UI state: theme + toasts + notifications drawer. */
  const [theme, setTheme] = useState(() => demoApi.getSettings().theme || "light");
  const [toast, setToast] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    demoApi.updateSettings({ theme });
  }, [theme]);

  const value = useMemo(() => {
    return {
      theme,
      setTheme,
      toggleTheme() {
        setTheme((t) => (t === "light" ? "dark" : "light"));
      },
      toast,
      showToast(message, ms = 2400) {
        setToast({ message });
        window.clearTimeout(window.__hb_toast_timer);
        window.__hb_toast_timer = window.setTimeout(() => setToast(null), ms);
      },
      notifOpen,
      setNotifOpen,
      openNotifications() {
        setNotifOpen(true);
      },
      closeNotifications() {
        setNotifOpen(false);
      }
    };
  }, [theme, toast, notifOpen]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

/** PUBLIC_INTERFACE */
export function useUI() {
  /** Hook to access UI state. */
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
