import { z } from "zod";

export const teamSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  shortName: z.string().min(1, "Short name is required").max(50),
  abbreviation: z.string().min(1, "Abbreviation is required").max(10),
  mascot: z.string().max(50).optional(),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  darkLogoUrl: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional(),
  espnId: z.string().optional(),
});

export type TeamFormValues = z.infer<typeof teamSchema>;
