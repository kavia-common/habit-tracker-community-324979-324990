import React, { createContext, useContext, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "../api/client";

const AuthContext = createContext(null);

/** PUBLIC_INTERFACE */
export function AuthProvider({ children }) {
  /** Provides authentication state and helpers. */
  const [token, setTokenState] = useState(() => getToken());

  const value = useMemo(() => {
    return {
      isAuthed: Boolean(token),
      token,
      loginWithToken(nextToken) {
        setToken(nextToken);
        setTokenState(nextToken);
      },
      logout() {
        clearToken();
        setTokenState(null);
      }
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** PUBLIC_INTERFACE */
export function useAuth() {
  /** Hook to access auth state. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
