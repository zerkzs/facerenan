"use server";

import { signIn as nextAuthSignIn } from "@/features/auth/infrastructure/next-auth-config";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { SignupSchema, LoginSchema } from "./dto";
import { SupabaseAuthRepository } from "../infrastructure/supabase-auth-repository";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
} from "../infrastructure/rate-limiter";

const LOGIN_ERROR = "Invalid credentials.";
const SIGNUP_ERROR = "Unable to create account.";
const RATE_LIMIT_ERROR = "Too many attempts. Please try again later.";

export type AuthResult = {
  success: boolean;
  error?: string;
};

async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

export async function loginAction(
  email: string,
  password: string
): Promise<AuthResult> {
  const ip = await getClientIp();

  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    const retryMinutes = Math.ceil(retryAfterMs / 60_000);
    console.warn(
      JSON.stringify({
        event: "auth.login.rate_limited",
        ip,
        retryAfterMs,
      })
    );
    return {
      success: false,
      error: `${RATE_LIMIT_ERROR} Try again in ${retryMinutes} min.`,
    };
  }

  const parsed = LoginSchema.safeParse({ email, password });
  if (!parsed.success) {
    recordFailedAttempt(ip);
    console.warn(
      JSON.stringify({
        event: "auth.login.failed",
        ip,
        reason: "validation",
      })
    );
    return { success: false, error: LOGIN_ERROR };
  }

  try {
    await nextAuthSignIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    clearAttempts(ip);
    return { success: true };
  } catch (error) {
    recordFailedAttempt(ip);
    console.warn(
      JSON.stringify({
        event: "auth.login.failed",
        ip,
        reason: error instanceof AuthError ? "invalid_credentials" : "unknown",
      })
    );
    if (error instanceof AuthError) {
      return { success: false, error: LOGIN_ERROR };
    }
    throw error;
  }
}

export async function signupAction(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const ip = await getClientIp();

  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    const retryMinutes = Math.ceil(retryAfterMs / 60_000);
    console.warn(
      JSON.stringify({
        event: "auth.signup.rate_limited",
        ip,
        retryAfterMs,
      })
    );
    return {
      success: false,
      error: `${RATE_LIMIT_ERROR} Try again in ${retryMinutes} min.`,
    };
  }

  const parsed = SignupSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return { success: false, error: SIGNUP_ERROR };
  }

  const repo = new SupabaseAuthRepository();

  try {
    const existing = await repo.findUserByEmail(parsed.data.email);
    if (existing) {
      // Same generic message to prevent email enumeration
      console.warn(
        JSON.stringify({
          event: "auth.signup.duplicate_email",
          ip,
        })
      );
      return { success: false, error: SIGNUP_ERROR };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await repo.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      image: null,
      metaId: null,
      passwordHash,
    });

    await nextAuthSignIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    clearAttempts(ip);
    return { success: true };
  } catch (error) {
    recordFailedAttempt(ip);
    console.error(
      JSON.stringify({
        event: "auth.signup.error",
        ip,
        error: error instanceof Error ? error.message : "unknown",
      })
    );
    return { success: false, error: SIGNUP_ERROR };
  }
}
