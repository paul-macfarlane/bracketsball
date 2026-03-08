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
