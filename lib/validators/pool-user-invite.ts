import { z } from "zod";

const sendPoolUserInviteSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["member", "leader"]).default("member"),
});

const searchUsersSchema = z.object({
  query: z.string().min(1, "Search query is required").max(50),
});

export const searchUsersInputSchema = z.object({
  poolId: z.string().min(1),
  formData: searchUsersSchema,
});

export const sendUserInviteInputSchema = z.object({
  poolId: z.string().min(1),
  formData: sendPoolUserInviteSchema,
});

export const cancelUserInviteInputSchema = z.object({
  poolId: z.string().min(1),
  inviteId: z.string().min(1),
});

export const respondToInviteInputSchema = z.object({
  inviteId: z.string().min(1),
  response: z.enum(["accepted", "declined"]),
});
