import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/features/auth/infrastructure/supabase-client";

/**
 * GET /api/auth/debug
 * Diagnostic endpoint — checks env vars, Auth.js config, and Supabase schema.
 * TODO: Remove or protect before production launch.
 */
export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check critical env vars (existence only, never values)
  checks.env = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    AUTH_URL: !!process.env.AUTH_URL,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    AUTH_TRUST_HOST: !!process.env.AUTH_TRUST_HOST,
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const db = createSupabaseServerClient();
    checks.supabaseClient = "ok";

    // Check if users table exists and has password_hash column
    const { data: columns, error: schemaError } = await db.rpc("get_columns", {
      table_name_param: "users",
    });

    if (schemaError) {
      // RPC doesn't exist — fallback: try a direct query
      checks.schemaRpcAvailable = false;

      // Try to select password_hash to see if column exists
      const { data, error } = await db
        .from("users")
        .select("id, email, password_hash")
        .limit(1);

      if (error) {
        checks.passwordHashColumn = false;
        checks.passwordHashError = {
          code: error.code,
          message: error.message,
          hint: error.hint,
        };
      } else {
        checks.passwordHashColumn = true;
        checks.sampleUserCount = data?.length ?? 0;
        if (data && data.length > 0) {
          const row = data[0] as Record<string, unknown>;
          checks.sampleUser = {
            id: row.id,
            email: row.email,
            hasPasswordHash: row.password_hash !== null && row.password_hash !== undefined,
            passwordHashPrefix:
              typeof row.password_hash === "string"
                ? row.password_hash.substring(0, 7)
                : "NULL",
          };
        }
      }
    } else {
      checks.schemaRpcAvailable = true;
      checks.columns = columns;
    }

    // Count total users
    const { count, error: countError } = await db
      .from("users")
      .select("*", { count: "exact", head: true });

    checks.totalUsers = countError ? `error: ${countError.message}` : count;

    return NextResponse.json({ status: "ok", checks }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "unknown",
        checks,
      },
      { status: 500 }
    );
  }
}
