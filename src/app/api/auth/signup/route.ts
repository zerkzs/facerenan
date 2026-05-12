import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { SignupSchema } from "@/features/auth/application/dto";
import { SupabaseAuthRepository } from "@/features/auth/infrastructure/supabase-auth-repository";
import {
  checkRateLimit,
  recordFailedAttempt,
} from "@/features/auth/infrastructure/rate-limiter";

const SIGNUP_ERROR = "Unable to create account.";

export async function POST(request: Request) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";

  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    console.warn(
      JSON.stringify({ event: "auth.signup.rate_limited", ip, retryAfterMs })
    );
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await request.json();
  const parsed = SignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: SIGNUP_ERROR }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const repo = new SupabaseAuthRepository();

  try {
    const existing = await repo.findUserByEmail(email);
    if (existing) {
      // Same generic error to prevent email enumeration
      console.warn(
        JSON.stringify({ event: "auth.signup.duplicate_email", ip })
      );
      return NextResponse.json({ error: SIGNUP_ERROR }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await repo.createUser({
      name,
      email,
      image: null,
      metaId: null,
      passwordHash,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    recordFailedAttempt(ip);
    console.error(
      JSON.stringify({
        event: "auth.signup.error",
        ip,
        error: err instanceof Error ? err.message : "unknown",
      })
    );
    return NextResponse.json({ error: SIGNUP_ERROR }, { status: 500 });
  }
}
