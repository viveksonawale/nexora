import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { configureClient, ApiError } from "@/api/client";
import { authApi } from "@/api/authApi";
import { authService } from "@/services/authService";
import { tokenStorage } from "@/services/tokenStorage";
import type { Role, User } from "@/types/api";

type Status = "loading" | "signedOut" | "signedIn" | "error";

interface AuthValue {
  status: Status;
  user: User | null;
  bootError: ApiError | null;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  signup: (b: { name: string; email: string; password: string; college: string; role: Role }) => Promise<string>;
  updateProfile: (b: { name?: string; college?: string }) => Promise<void>;
  logout: () => Promise<void>;
  retryBoot: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [bootError, setBootError] = useState<ApiError | null>(null);

  const signOutLocal = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    configureClient({ getToken: tokenStorage.get, onUnauthorized: () => { void signOutLocal(); } });
  }, [signOutLocal]);

  const boot = useCallback(async () => {
    setStatus("loading");
    setBootError(null);
    try {
      const u = await authService.restore();
      setUser(u);
      setStatus(u ? "signedIn" : "signedOut");
    } catch (e) {
      // Network trouble keeps the stored token; anything else means the session is unusable.
      if (e instanceof ApiError && e.isNetwork) { setBootError(e); setStatus("error"); }
      else await signOutLocal();
    }
  }, [signOutLocal]);

  useEffect(() => { void boot(); }, [boot]);

  const value = useMemo<AuthValue>(() => ({
    status, user, bootError,
    login: async (email, password) => { setUser(await authService.login(email, password)); setStatus("signedIn"); },
    verifyOtp: async (email, code) => { setUser(await authService.verifyOtp(email, code)); setStatus("signedIn"); },
    signup: async (b) => (await authService.signup(b)).email,
    updateProfile: async (b) => { setUser((await authApi.updateMe(b)).user); },
    logout: signOutLocal,
    retryBoot: () => { void boot(); },
  }), [status, user, bootError, signOutLocal, boot]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

export const homeRouteFor = (role: Role | undefined) =>
  role === "ORGANIZER" ? "/(organizer)/dashboard" : role === "JUDGE" ? "/(judge)/projects" : "/(participant)/home";
