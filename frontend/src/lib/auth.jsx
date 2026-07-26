import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("funland_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const refresh = (background = false) =>
    api.get("/auth/me", { _background: background })
      .then((r) => {
        setUser(r.data);
        localStorage.setItem("funland_user", JSON.stringify(r.data));
      })
      .catch((err) => {
        // Only clear session on explicit 401 during INITIAL foreground load
        if (!background && err?.response?.status === 401) {
          localStorage.removeItem("funland_token");
          localStorage.removeItem("funland_user");
          setUser(null);
        }
        // Silent fail on network hiccups so PWA stays usable offline
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    const token = localStorage.getItem("funland_token");
    if (!token) { setLoading(false); return; }
    refresh(false);
    // Re-sync permissions on window focus (silent — won't logout on failure)
    const onFocus = () => { if (localStorage.getItem("funland_token")) refresh(true); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("funland_token", data.token);
    localStorage.setItem("funland_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("funland_token");
    localStorage.removeItem("funland_user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refresh: () => refresh(true), isAdmin: user?.role === "admin" }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
