import { useState, useCallback, useEffect } from "react";
import { getSession, logout as destroySession } from "./authService";
import type { Session } from "./types";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(() => getSession());

  // Re-check session on window focus (handles expiry while tab was inactive)
  useEffect(() => {
    function onFocus() {
      const s = getSession();
      setSession(s);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Auto-logout when session expires
  useEffect(() => {
    if (!session) return;
    const msLeft = session.expiresAt - Date.now();
    if (msLeft <= 0) {
      setSession(null);
      return;
    }
    const timer = setTimeout(() => {
      destroySession();
      setSession(null);
    }, msLeft);
    return () => clearTimeout(timer);
  }, [session]);

  const handleLogout = useCallback(() => {
    destroySession();
    setSession(null);
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setSession(getSession());
  }, []);

  return {
    session,
    isAuthenticated: session !== null,
    logout: handleLogout,
    onLoginSuccess: handleLoginSuccess,
  };
}
