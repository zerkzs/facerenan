import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/features/auth/infrastructure/next-auth-config";
import { SupabaseAccountIndexRepository } from "@/features/ad-accounts/infrastructure/supabase-account-index-repository";
import { SearchAccounts } from "@/features/ad-accounts/application/search-accounts";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { error: "q query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const indexRepo = new SupabaseAccountIndexRepository();
    const useCase = new SearchAccounts(indexRepo);
    const results = await useCase.execute(session.user.id, query.trim());
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
