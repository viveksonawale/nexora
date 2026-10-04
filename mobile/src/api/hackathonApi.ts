import { request } from "./client";
import type { Hackathon, HackathonQuery, Submission, SubmissionInput } from "@/types/api";

export const hackathonApi = {
  list: (p: HackathonQuery = {}) =>
    request<{ items: Hackathon[] }>("/hackathons", { query: { q: p.q, filter: p.filter, sort: p.sort }, auth: false }),
  get: (id: string) => request<Hackathon>(`/hackathons/${id}`),
  register: (id: string) => request<{ ok: true }>(`/hackathons/${id}/register`, { method: "POST" }),
  mine: () => request<{ items: Hackathon[] }>("/registrations"),
  getSubmission: (id: string) => request<{ submission: Submission | null }>(`/hackathons/${id}/submission`),
  saveSubmission: (id: string, b: SubmissionInput) =>
    request<{ submission: Submission }>(`/hackathons/${id}/submission`, { method: "PUT", body: b }),
};
