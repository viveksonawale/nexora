import type { Hackathon, User } from "@prisma/client";

export const publicUser = (u: User) => ({
  id: u.id, email: u.email, name: u.name, college: u.college, role: u.role,
});

type HackathonRow = Hackathon & {
  _count?: { registrations: number };
  registrations?: { user: { name: string } }[];
};

/** Shape the website's /hackathons cards need: status, mode, participants, avatars, prize, tags. */
export const publicHackathon = (h: HackathonRow, extra: Record<string, unknown> = {}) => ({
  id: h.id, name: h.name, college: h.college, location: h.location,
  mode: h.mode, status: h.status, theme: h.theme, tags: h.tags,
  description: h.description, problemStatement: h.problemStatement,
  prize: h.prize, currency: h.currency,
  startDate: h.startDate.toISOString(), endDate: h.endDate?.toISOString() ?? null,
  participantCount: h._count?.registrations ?? 0,
  participantPreview: (h.registrations ?? []).map((r) => r.user.name),
  ...extra,
});

export const cardInclude = {
  _count: { select: { registrations: true } },
  registrations: { take: 3, orderBy: { createdAt: "asc" as const }, select: { user: { select: { name: true } } } },
};
