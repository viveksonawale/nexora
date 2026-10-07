"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, SessionUser } from "../api-client";

interface SessionContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  error: Error | null;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSession = async (setLoading: boolean = true) => {
    if (setLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SessionUser>("/me");
      setUser(data);
    } catch (err: unknown) {
      setUser(null);
      const apiErr = err as { status?: number };
      if (apiErr.status !== 401) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSession(false);

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  return (
    <SessionContext.Provider value={{ user, isLoading, error, refreshSession: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
