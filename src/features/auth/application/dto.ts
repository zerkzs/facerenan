import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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

export type LoginDto = z.infer<typeof LoginSchema>;
export type SignupDto = z.infer<typeof SignupSchema>;
export type SessionResponseDto = z.infer<typeof SessionResponseSchema>;
