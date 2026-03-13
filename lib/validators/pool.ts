import { z } from "zod";

export const POOL_VISIBILITY_OPTIONS = ["private", "public"] as const;
export type PoolVisibility = (typeof POOL_VISIBILITY_OPTIONS)[number];

export const POOL_LIMITS = {
  bracketsPerUser: { min: 1, max: 10, default: 5 },
  participants: { min: 2, max: 100, default: 50 },
  scoring: { min: 0, max: 1000 },
} as const;

const scoringField = z
  .number()
  .int("Must be a whole number")
  .min(POOL_LIMITS.scoring.min, `Must be at least ${POOL_LIMITS.scoring.min}`)
  .max(POOL_LIMITS.scoring.max, `Must be at most ${POOL_LIMITS.scoring.max}`);

export const createPoolSchema = z.object({
  name: z
    .string()
    .min(1, "Pool name is required")
    .max(100, "Pool name must be 100 characters or less"),
  visibility: z.enum(POOL_VISIBILITY_OPTIONS),
  imageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  maxBracketsPerUser: z
    .number()
    .int()
    .min(
      POOL_LIMITS.bracketsPerUser.min,
      `Must allow at least ${POOL_LIMITS.bracketsPerUser.min} bracket`,
    )
    .max(
      POOL_LIMITS.bracketsPerUser.max,
      `Maximum ${POOL_LIMITS.bracketsPerUser.max} brackets per user`,
    ),
  maxParticipants: z
    .number()
    .int()
    .min(
      POOL_LIMITS.participants.min,
      `Must allow at least ${POOL_LIMITS.participants.min} participants`,
    )
    .max(
      POOL_LIMITS.participants.max,
      `Maximum ${POOL_LIMITS.participants.max} participants`,
    ),
});

export type CreatePoolFormValues = z.infer<typeof createPoolSchema>;

export function buildUpdatePoolSchema(
  currentMemberCount: number,
  maxBracketCountInPool: number,
) {
  const minBrackets = Math.max(
    POOL_LIMITS.bracketsPerUser.min,
    maxBracketCountInPool,
  );
  const minParticipants = Math.max(
    POOL_LIMITS.participants.min,
    currentMemberCount,
  );

  return z.object({
    name: z
      .string()
      .min(1, "Pool name is required")
      .max(100, "Pool name must be 100 characters or less"),
    visibility: z.enum(POOL_VISIBILITY_OPTIONS),
    imageUrl: z
      .string()
      .url("Must be a valid URL")
      .or(z.literal(""))
      .optional(),
    maxBracketsPerUser: z
      .number()
      .int()
      .min(
        minBrackets,
        maxBracketCountInPool > POOL_LIMITS.bracketsPerUser.min
          ? `Cannot be less than ${maxBracketCountInPool} (a member already has that many brackets)`
          : `Must allow at least ${POOL_LIMITS.bracketsPerUser.min} bracket`,
      )
      .max(
        POOL_LIMITS.bracketsPerUser.max,
        `Maximum ${POOL_LIMITS.bracketsPerUser.max} brackets per user`,
      ),
    maxParticipants: z
      .number()
      .int()
      .min(
        minParticipants,
        currentMemberCount > POOL_LIMITS.participants.min
          ? `Cannot be less than ${currentMemberCount} (current member count)`
          : `Must allow at least ${POOL_LIMITS.participants.min} participants`,
      )
      .max(
        POOL_LIMITS.participants.max,
        `Maximum ${POOL_LIMITS.participants.max} participants`,
      ),
    scoringFirstFour: scoringField,
    scoringRound64: scoringField,
    scoringRound32: scoringField,
    scoringSweet16: scoringField,
    scoringElite8: scoringField,
    scoringFinalFour: scoringField,
    scoringChampionship: scoringField,
  });
}

export type UpdatePoolFormValues = z.infer<
  ReturnType<typeof buildUpdatePoolSchema>
>;

export const searchPublicPoolsSchema = z.object({
  search: z.string().max(100).optional(),
  minBracketsPerUser: z
    .number()
    .int()
    .min(POOL_LIMITS.bracketsPerUser.min)
    .max(POOL_LIMITS.bracketsPerUser.max)
    .optional(),
  maxBracketsPerUser: z
    .number()
    .int()
    .min(POOL_LIMITS.bracketsPerUser.min)
    .max(POOL_LIMITS.bracketsPerUser.max)
    .optional(),
  minParticipants: z
    .number()
    .int()
    .min(POOL_LIMITS.participants.min)
    .max(POOL_LIMITS.participants.max)
    .optional(),
  maxParticipants: z
    .number()
    .int()
    .min(POOL_LIMITS.participants.min)
    .max(POOL_LIMITS.participants.max)
    .optional(),
  sort: z
    .enum([
      "most-members",
      "most-available",
      "fewest-brackets",
      "most-brackets",
      "alphabetical",
    ])
    .optional(),
  page: z.number().int().min(1).optional(),
});

export const joinPublicPoolSchema = z.object({
  poolId: z.string().min(1),
});
