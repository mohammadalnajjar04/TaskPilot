import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authService } from "../services/authService";
import {
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setStoredUser,
  clearAuthStorage,
} from "../utils/storage";

const AuthContext = createContext(null);

let currentMeRequest = null;

function fetchCurrentUserOnce() {
  if (!currentMeRequest) {
    currentMeRequest = authService.getMe().finally(() => {
      currentMeRequest = null;
    });
  }
  return currentMeRequest;
}

function persistSession({ accessToken, user }) {
  setAccessToken(accessToken);
  setStoredUser(user);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentUser = useCallback(async () => {
    const fetchedUser = await fetchCurrentUserOnce();
    setUser(fetchedUser);
    setStoredUser(fetchedUser);
    return fetchedUser;
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const storedToken = getAccessToken();

      if (!storedToken) {
        setToken(null);
        setUser(null);
        if (active) setIsLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const fetchedUser = await refreshCurrentUser();
        if (active) setUser(fetchedUser);
      } catch {
        clearAuthStorage();
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [refreshCurrentUser]);

  const login = useCallback(async (email, password) => {
    const session = await authService.login(email, password);
    persistSession(session);
    setToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const session = await authService.register(fullName, email, password);
    persistSession(session);
    setToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      register,
      logout,
      refreshCurrentUser,
    }),
    [user, token, isLoading, login, register, logout, refreshCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
