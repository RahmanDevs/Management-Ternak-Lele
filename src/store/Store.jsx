import { createContext, useContext, useEffect, useRef, useState } from "react";
import { demoUsers } from "../data/seed";
import { applyAction } from "./actions";
import { loadState, saveState, SESSION_KEY } from "./persistence";

const StoreContext = createContext(null);

function loadUser() {
  try {
    return (
      demoUsers.find(
        (item) => item.id === window.sessionStorage.getItem(SESSION_KEY),
      ) || null
    );
  } catch {
    return null;
  }
}

export function StoreProvider({ children }) {
  const [initial] = useState(loadState);
  const [state, setState] = useState(initial.state);
  const stateRef = useRef(state);
  const [user, setUser] = useState(loadUser);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    if (!saveState(state))
      setStorageWarning(
        "Penyimpanan lokal tidak tersedia. Perubahan hanya tersimpan selama halaman ini terbuka. Jangan muat ulang sebelum selesai demo.",
      );
  }, [state]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function notify(message) {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  function login(username, password) {
    const account = demoUsers.find(
      (item) => item.username === username.trim() && item.password === password,
    );
    if (!account)
      throw new Error("Username atau password tidak cocok. Silakan coba lagi.");
    setUser(account);
    try {
      window.sessionStorage.setItem(SESSION_KEY, account.id);
    } catch {
      /* The session remains available in memory. */
    }
    return account.role;
  }

  function logout() {
    setUser(null);
    setToast(null);
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* In-memory logout still succeeds. */
    }
  }

  function transact(type, payload) {
    const result = applyAction(stateRef.current, user?.role, type, payload);
    stateRef.current = result.state;
    setState(result.state);
    return result.id;
  }

  return (
    <StoreContext.Provider
      value={{
        state,
        user,
        login,
        logout,
        transact,
        storageWarning,
        toast,
        notify,
        dismissToast: () => setToast(null),
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("StoreProvider is missing.");
  return value;
}
