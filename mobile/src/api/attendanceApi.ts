import { request } from "./client";
import type { ActiveSession, AttendanceOrganizerState } from "@/types/api";

export type AttendanceAction = "start" | "pause" | "resume" | "end";

export const attendanceApi = {
  organizerState: (hackathonId: string) => request<AttendanceOrganizerState>(`/hackathons/${hackathonId}/attendance`),
  control: (hackathonId: string, action: AttendanceAction) =>
    request<{ ok: true }>(`/hackathons/${hackathonId}/attendance`, { method: "POST", body: { action } }),
  active: () => request<{ items: ActiveSession[] }>("/attendance/active"),
  mark: (token: string) => request<{ ok: true; hackathonName: string }>("/attendance/mark", { method: "POST", body: { token } }),
};
