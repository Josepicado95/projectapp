import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getRefreshToken, setTokens, clearTokens } from "./secure-store";
import { apiRequest, ApiError } from "./api";

type User = { id: number; name: string; email: string };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await apiRequest<User>("/api/mobile/auth/me");
      setUser(me);
    } catch (err) {
      // Only a real 401 means the token is genuinely invalid — a network
      // failure (flaky mobile signal) shouldn't silently log the user out.
      if (err instanceof ApiError && err.status === 401) {
        await clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await apiRequest<{ accessToken: string; refreshToken: string; user: User }>(
      "/api/mobile/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    );
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiRequest("/api/mobile/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
