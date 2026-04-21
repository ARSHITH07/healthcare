import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../lib/authStorage";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [integrity, setIntegrity] = useState({
    isValid: true,
    corruptedIndex: null,
    issuesByIndex: {},
  });

  const pushToast = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, tone: "info", ...toast }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const refreshChain = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [result, inspection] = await Promise.all([api.getBlockchain(), api.getIntegrity()]);
      setChain(result.chain);
      setIntegrity(inspection);
      return inspection;
    } catch {
      pushToast({ tone: "error", message: "Unable to load blockchain data." });
      return null;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [pushToast]);

  useEffect(() => {
    refreshChain();
  }, [refreshChain]);

  const login = useCallback((credentials) => {
    const nextUser = loginUser(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback((payload) => {
    const nextUser = registerUser(payload);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      chain,
      integrity,
      loading,
      login,
      logout,
      register,
      refreshChain,
      pushToast,
      toasts,
    }),
    [user, chain, integrity, loading, login, logout, register, refreshChain, pushToast, toasts]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider.");
  }

  return context;
}
