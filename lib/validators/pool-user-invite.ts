import { z } from "zod";

export const sendPoolUserInviteSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1, "Search query is required").max(50),
});

export type SendPoolUserInviteFormValues = z.infer<
  typeof sendPoolUserInviteSchema
>;
export type SearchUsersFormValues = z.infer<typeof searchUsersSchema>;
