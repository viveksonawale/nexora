import { hackathonApi } from "@/api/hackathonApi";
import type { HackathonQuery } from "@/types/api";
import { useAsync } from "./useAsync";

export const useHackathons = (q: HackathonQuery) =>
  useAsync(() => hackathonApi.list(q), [q.q, q.filter, q.sort]);

export const useHackathon = (id: string) =>
  useAsync(() => hackathonApi.get(id), [id], { refetchOnFocus: true });
