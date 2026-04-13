import { createContext, useContext, useState, useCallback } from "react";
import { STORAGE_TOKEN, STORAGE_USER } from "../auth/storageKeys";

const AuthContext = createContext(null);

function loadState() {
  try {
    const token = sessionStorage.getItem(STORAGE_TOKEN);
    const userRaw = sessionStorage.getItem(STORAGE_USER);
    if (!token || !userRaw) {
      return { user: null, token: null };
    }
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(loadState);

  const login = useCallback((userData, token) => {
    sessionStorage.setItem(STORAGE_USER, JSON.stringify(userData));
    sessionStorage.setItem(STORAGE_TOKEN, token);
    setState({ user: userData, token });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_USER);
    sessionStorage.removeItem(STORAGE_TOKEN);
    setState({ user: null, token: null });
  }, []);

  const isAuthenticated = !!(state.user && state.token);

  return (
    <AuthContext.Provider
      value={{ user: state.user, token: state.token, login, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
