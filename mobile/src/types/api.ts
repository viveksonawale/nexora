export type Role = "PARTICIPANT" | "ORGANIZER" | "JUDGE";
export type HackathonStatus = "UPCOMING" | "OPEN" | "LIVE" | "ENDED";
export type HackathonMode = "ONLINE" | "OFFLINE" | "HYBRID";

export interface User { id: string; email: string; name: string; college: string; role: Role }
export interface AuthResult { token: string; user: User }

export interface Hackathon {
  id: string; name: string; college: string; location: string;
  mode: HackathonMode; status: HackathonStatus; theme: string; tags: string[];
  description: string; problemStatement: string;
  prize: number; currency: string; startDate: string; endDate: string | null;
  participantCount: number; participantPreview: string[];
  isRegistered?: boolean; hasSubmitted?: boolean; isOwner?: boolean;
}

export type HackathonFilter = "all" | "live" | "open" | "upcoming" | "online" | "offline";
export type HackathonSort = "date" | "prize" | "participants";
export interface HackathonQuery { q?: string; filter?: HackathonFilter; sort?: HackathonSort }

export interface Submission { id: string; projectCode: string; title: string; description: string; repoUrl: string; demoUrl: string }
export interface SubmissionInput { title: string; description: string; repoUrl: string; demoUrl: string }

export interface ManageData {
  hackathon: Hackathon;
  stats: { registrations: number; submissions: number; judges: number; evaluations: number };
  timeline: { label: string; at: string }[];
  participants: { name: string; email: string; college: string; registeredAt: string }[];
  judges: { name: string; email: string }[];
  results: { projectCode: string; title: string; team: string; evaluations: number; averageScore: number | null }[];
}

export interface CreateHackathonInput {
  name: string; college: string; location: string; mode: HackathonMode; theme: string;
  tags: string[]; description: string; problemStatement: string; prize: number;
  startDate: string; endDate?: string;
}

export interface AttendanceOrganizerState {
  session: { id: string; status: "ACTIVE" | "PAUSED"; startedAt: string } | null;
  registered: number; present: number;
  qr: { token: string; expiresInSeconds: number } | null;
  recent: { name: string; at: string }[];
}
export interface ActiveSession { sessionId: string; hackathonId: string; hackathonName: string; startedAt: string; alreadyMarked: boolean }

export interface JudgeSubmission {
  id: string; projectCode: string; title: string; description: string; repoUrl: string; demoUrl: string;
  hackathon: { id: string; name: string };
  myEvaluation: { score: number; comments: string } | null;
}
export interface JudgeHistoryItem { score: number; comments: string; createdAt: string; submissionId: string; projectCode: string; title: string; hackathonName: string }

export interface AiSummary { summary: string; keyPoints: string[] }
