import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignupSchema } from "@/features/auth/application/dto";
import { SupabaseAuthRepository } from "@/features/auth/infrastructure/supabase-auth-repository";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = SignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const repo = new SupabaseAuthRepository();

  const existing = await repo.findUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  try {
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
    console.error("[signup] Failed to create account:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
