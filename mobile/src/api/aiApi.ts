import { request } from "./client";
import type { AiSummary } from "@/types/api";

export const aiApi = {
  summarize: (text: string) => request<AiSummary>("/ai/summarize", { method: "POST", body: { text } }),
};
