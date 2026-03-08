import { z } from "zod";

export const TOURNAMENT_REGIONS = ["south", "east", "west", "midwest"] as const;

export const TOURNAMENT_ROUNDS = [
  "first_four",
  "round_of_64",
  "round_of_32",
  "sweet_16",
  "elite_8",
  "final_four",
  "championship",
] as const;

export const ROUND_DISPLAY_NAMES: Record<
  (typeof TOURNAMENT_ROUNDS)[number],
  string
> = {
  first_four: "First Four",
  round_of_64: "Round of 64",
  round_of_32: "Round of 32",
  sweet_16: "Sweet 16",
  elite_8: "Elite 8",
  final_four: "Final Four",
  championship: "Championship",
};

export const REGION_DISPLAY_NAMES: Record<
  (typeof TOURNAMENT_REGIONS)[number],
  string
> = {
  south: "South",
  east: "East",
  west: "West",
  midwest: "Midwest",
};

export const createTournamentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  year: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  isActive: z.boolean().optional(),
});

export type CreateTournamentFormValues = z.infer<typeof createTournamentSchema>;

export const addTournamentTeamSchema = z.object({
  teamId: z.string().min(1, "Team is required"),
  seed: z
    .number()
    .int()
    .min(1, "Seed must be 1-16")
    .max(16, "Seed must be 1-16"),
  region: z.enum(TOURNAMENT_REGIONS),
});

export type AddTournamentTeamFormValues = z.infer<
  typeof addTournamentTeamSchema
>;

export const updateGameSchema = z.object({
  team1Score: z.number().int().min(0).nullable().optional(),
  team2Score: z.number().int().min(0).nullable().optional(),
  status: z.enum(["scheduled", "in_progress", "final"]).optional(),
  winnerTeamId: z.string().nullable().optional(),
});

export type UpdateGameFormValues = z.infer<typeof updateGameSchema>;
