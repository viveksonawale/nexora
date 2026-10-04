import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiError } from "@/api/client";

interface Options { intervalMs?: number; enabled?: boolean; refetchOnFocus?: boolean }

/**
 * Loads data and exposes the states every screen needs:
 * loading (first load), refreshing (pull to refresh), error, data. Stale responses are ignored.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: Options = {}) {
  const { intervalMs, enabled = true, refetchOnFocus = false } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const run = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    const id = ++seq.current;
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    try {
      const r = await fnRef.current();
      if (id !== seq.current) return;
      setData(r);
      setError(null);
    } catch (e) {
      if (id !== seq.current) return;
      setError(e instanceof ApiError ? e : new ApiError(0, "Something went wrong", "UNKNOWN"));
    } finally {
      if (id === seq.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    run("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    if (!intervalMs || !enabled) return;
    const t = setInterval(() => run("silent"), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, enabled, run]);

  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus && enabled && !first.current) run("silent");
      first.current = false;
    }, [refetchOnFocus, enabled, run]),
  );

  return {
    data, error, loading, refreshing,
    reload: () => run("initial"),
    refresh: () => run("refresh"),
    setData,
  };
}
