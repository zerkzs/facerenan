import { z } from "zod";

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export const SessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    image: z.string().url().nullable(),
  }),
  expires: z.string().datetime(),
});

export type OAuthCallbackDto = z.infer<typeof OAuthCallbackSchema>;
export type SessionResponseDto = z.infer<typeof SessionResponseSchema>;
