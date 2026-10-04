import { request } from "./client";
import type { CreateHackathonInput, Hackathon, ManageData } from "@/types/api";

export const organizerApi = {
  myHackathons: () => request<{ items: Hackathon[] }>("/organizer/hackathons"),
  create: (b: CreateHackathonInput) => request<Hackathon>("/hackathons", { method: "POST", body: b }),
  manage: (id: string) => request<ManageData>(`/hackathons/${id}/manage`),
  addJudge: (id: string, email: string) => request<{ ok: true }>(`/hackathons/${id}/judges`, { method: "POST", body: { email } }),
};
