"use server";

import { signIn as nextAuthSignIn } from "@/features/auth/infrastructure/next-auth-config";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";
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
      redirectTo: "/dashboard",
    });

    // signIn with redirectTo should throw a redirect on success
    // If we reach here, something unexpected happened
    clearAttempts(ip);
    return { success: true };
  } catch (error) {
    // Next.js redirect — re-throw so the client navigates
    if (isRedirectError(error)) {
      clearAttempts(ip);
      throw error;
    }

    // Auth.js credential errors (wrong password, user not found)
    if (error instanceof AuthError) {
      recordFailedAttempt(ip);
      console.warn(
        JSON.stringify({
          event: "auth.login.failed",
          ip,
          reason: error.type,
          message: error.message,
        })
      );
      return { success: false, error: LOGIN_ERROR };
    }

    recordFailedAttempt(ip);
    console.error(
      JSON.stringify({
        event: "auth.login.failed",
        ip,
        reason: "unknown",
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return { success: false, error: LOGIN_ERROR };
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
      console.warn(
        JSON.stringify({
          event: "auth.signup.duplicate_email",
          ip,
        })
      );
      return { success: false, error: SIGNUP_ERROR };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const newUser = await repo.createUser({
      name: parsed.data.name,
      email: parsed.data.email,
      image: null,
      metaId: null,
      passwordHash,
    });

    console.info(
      JSON.stringify({
        event: "auth.signup.user_created",
        userId: newUser.id,
        email: newUser.email,
      })
    );

    // Auto-login: redirectTo throws a redirect on success
    await nextAuthSignIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });

    clearAttempts(ip);
    return { success: true };
  } catch (error) {
    // Next.js redirect from successful signIn — re-throw
    if (isRedirectError(error)) {
      clearAttempts(ip);
      throw error;
    }

    // Auth error after user was already created
    if (error instanceof AuthError) {
      console.warn(
        JSON.stringify({
          event: "auth.signup.auto_login_failed",
          ip,
          reason: error.type,
        })
      );
      return {
        success: false,
        error: "Account created. Please sign in manually.",
      };
    }

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
