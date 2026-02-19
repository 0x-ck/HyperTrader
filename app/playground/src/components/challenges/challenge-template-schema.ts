import { z } from "zod";

export const challengeTemplateSchema = z.object({
  stageId: z.number().int().min(1).max(65535),
  stageSequence: z.number().int().min(1).max(255),
  stageType: z.enum(["evaluation", "funded"]),
  startingDeposit: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
  admin: z.string().optional(),
  entranceCost: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
  entranceTokenMint: z.string(),
  minimumTradingDays: z.number().int().min(1).max(65535),
  dailyDrawdown: z.number().int().min(0).max(10000),
  maximumLoss: z.number().int().min(0).max(10000),
  profitTarget: z.number().int().min(0).max(10000),
  maxParticipants: z.number().int().min(1).max(65535),
  isActive: z.boolean(),
});

export type ChallengeTemplateSchema = z.infer<typeof challengeTemplateSchema>;

