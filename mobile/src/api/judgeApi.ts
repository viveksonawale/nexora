import { request } from "./client";
import type { JudgeHistoryItem, JudgeSubmission } from "@/types/api";

export const judgeApi = {
  submissions: () => request<{ items: JudgeSubmission[] }>("/judge/submissions"),
  evaluate: (submissionId: string, b: { score: number; comments: string }) =>
    request<{ ok: true }>(`/judge/submissions/${submissionId}/evaluate`, { method: "POST", body: b }),
  history: () => request<{ items: JudgeHistoryItem[] }>("/judge/history"),
};
