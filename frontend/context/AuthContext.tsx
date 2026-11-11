import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthContextType,
} from '../types/auth';
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
} from '../services/authService';
import storage from '../services/storage';
import { setAuthToken, setOnUnauthorized } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ─── Logout handler ────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort logout
    } finally {
      await storage.clearAuthStorage();
      setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  // ─── Refresh User Data ─────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await getMeApi();
      setUser(freshUser);
      await storage.saveUser(freshUser);
    } catch (error) {
      console.warn('[AuthContext] Failed to refresh user profile:', error);
      throw error;
    }
  }, []);

  // ─── Login handler ─────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const authData = await loginApi(credentials);
      setToken(authData.token);
      setUser(authData.user);

      // Persist in secure storage
      await Promise.all([
        storage.saveToken(authData.token),
        storage.saveUser(authData.user),
      ]);
    },
    []
  );

  // ─── Register handler ──────────────────────────────────────────────────────
  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const authData = await registerApi(credentials);
      setToken(authData.token);
      setUser(authData.user);

      // Persist in secure storage
      await Promise.all([
        storage.saveToken(authData.token),
        storage.saveUser(authData.user),
      ]);
    },
    []
  );

  // ─── Session Restoration on App Startup ────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();

        if (!storedToken) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Set token for outgoing requests
        setAuthToken(storedToken);

        // Optimistically set cached user if available
        if (storedUser && isMounted) {
          setUser(storedUser);
          setToken(storedToken);
        }

        // Verify token with backend by getting latest profile
        try {
          const freshUser = await getMeApi();
          if (isMounted) {
            setUser(freshUser);
            setToken(storedToken);
            await storage.saveUser(freshUser);
          }
        } catch (error: any) {
          // If server says 401 (token expired/invalid), wipe session
          if (error?.response?.status === 401) {
            console.warn('[AuthContext] Stored session is invalid or expired. Clearing...');
            await storage.clearAuthStorage();
            setAuthToken(null);
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          } else {
            // Network error (offline) - keep cached user so student can use app offline
            console.warn('[AuthContext] Offline or unreachable, preserving cached user session.');  
            if (isMounted && storedToken) {
              setToken(storedToken);
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] Error restoring session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    // Register 401 interceptor callback to trigger auto-logout
    setOnUnauthorized(() => {
      console.warn('[AuthContext] 401 received from API. Logging out user.');
      logout();
    });

    return () => {
      isMounted = false;
      setOnUnauthorized(null);
    };
  }, [logout]);

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, isAuthenticated, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;