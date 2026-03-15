import { z } from "zod";

export const createBracketEntrySchema = z.object({
  name: z
    .string()
    .min(1, "Bracket name is required")
    .max(100, "Bracket name must be 100 characters or less"),
});

export type CreateBracketEntryFormValues = z.infer<
  typeof createBracketEntrySchema
>;

export const updateBracketNameSchema = z.object({
  bracketEntryId: z.string().min(1),
  name: z
    .string()
    .min(1, "Bracket name is required")
    .max(100, "Bracket name must be 100 characters or less"),
});

export const savePickSchema = z.object({
  bracketEntryId: z.string().min(1),
  tournamentGameId: z.string().min(1),
  pickedTeamId: z.string().min(1),
});

export const updateTiebreakerSchema = z.object({
  bracketEntryId: z.string().min(1),
  tiebreakerScore: z
    .number()
    .int("Tiebreaker must be a whole number")
    .min(0, "Tiebreaker must be 0 or more")
    .max(500, "Tiebreaker must be 500 or less"),
});

export const submitBracketSchema = z.object({
  bracketEntryId: z.string().min(1),
});

const statWeightsSchema = z.object({
  ppg: z.number().int().min(0).max(10),
  oppPpg: z.number().int().min(0).max(10),
  fgPct: z.number().int().min(0).max(10),
  threePtPct: z.number().int().min(0).max(10),
  ftPct: z.number().int().min(0).max(10),
  reboundsPerGame: z.number().int().min(0).max(10),
  assistsPerGame: z.number().int().min(0).max(10),
  stealsPerGame: z.number().int().min(0).max(10),
  blocksPerGame: z.number().int().min(0).max(10),
  turnoversPerGame: z.number().int().min(0).max(10),
});

const statsConfigSchema = z.object({
  weights: statWeightsSchema,
  chaosLevel: z.enum(["low", "medium", "high"]),
});

export const autoFillBracketSchema = z
  .object({
    bracketEntryId: z.string().min(1),
    strategy: z.enum(["chalk", "weighted_random", "random", "stats_custom"]),
    statsConfig: statsConfigSchema.optional(),
  })
  .refine(
    (data) =>
      data.strategy !== "stats_custom" || data.statsConfig !== undefined,
    {
      message: "statsConfig is required for stats_custom strategy",
      path: ["statsConfig"],
    },
  );

export const clearBracketSchema = z.object({
  bracketEntryId: z.string().min(1),
});
