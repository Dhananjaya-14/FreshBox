import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, jsonBody, setAccessToken, tryRestoreSession } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    tryRestoreSession()
      .then((restoredUser) => { if (active) setUser(restoredUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const data = await api("/auth/login", { method: "POST", body: jsonBody(credentials) });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await api("/auth/register", { method: "POST", body: jsonBody(details) });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try { await api("/auth/logout", { method: "POST" }, false); }
    finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, register, signOut, setUser }), [user, ready, signIn, register, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
