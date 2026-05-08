import { z } from "zod";

export const CreateBusinessManagerSchema = z.object({
  bmId: z.string().min(1, "Business Manager ID is required"),
  userToken: z.string().min(1, "User token is required"),
  systemToken: z.string().nullable().optional(),
  appId: z.string().min(1, "App ID is required"),
  appSecret: z.string().min(1, "App Secret is required"),
  autoRenew: z.boolean().default(false),
});

export const UpdateBusinessManagerSchema = z.object({
  bmId: z.string().min(1).optional(),
  userToken: z.string().min(1).optional(),
  systemToken: z.string().nullable().optional(),
  appId: z.string().min(1).optional(),
  appSecret: z.string().min(1).optional(),
  autoRenew: z.boolean().optional(),
});

export const FetchBmNameSchema = z.object({
  bmId: z.string().min(1, "BM ID is required"),
  accessToken: z.string().min(1, "Access token is required"),
});

export type CreateBusinessManagerDto = z.infer<
  typeof CreateBusinessManagerSchema
>;
export type UpdateBusinessManagerDto = z.infer<
  typeof UpdateBusinessManagerSchema
>;
export type FetchBmNameDto = z.infer<typeof FetchBmNameSchema>;

export const InviteBusinessUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
});

export const BatchInviteSchema = z.object({
  emails: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one email is required")
    .max(100, "Maximum 100 emails per batch"),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
});

export type InviteBusinessUserDto = z.infer<typeof InviteBusinessUserSchema>;
export type BatchInviteDto = z.infer<typeof BatchInviteSchema>;
