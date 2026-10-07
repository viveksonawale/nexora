import { z } from "zod";

export const AutoAssignJudgesSchema = z.object({
  judgesPerSubmission: z.number().int().min(1).default(3),
});

export const ManualAssignJudgeSchema = z.object({
  staffId: z.string().min(1),
  submissionId: z.string().min(1),
});

export const SubmitScoresSchema = z.object({
  scores: z.array(z.object({
    criterionId: z.string().min(1),
    value: z.number().min(0),
    comment: z.string().max(500).optional(),
  })),
  overallComment: z.string().max(1000).optional(),
});

export const AwardPrizeSchema = z.object({
  submissionId: z.string().min(1),
});

export const LockJudgingSchema = z.object({
  force: z.boolean().default(false),
});
